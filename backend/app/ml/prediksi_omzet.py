import math
from datetime import datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.database import SessionLocal, get_db
from app.ml.job_infra import get_or_trigger_ml_task

try:
    import numpy as np
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.linear_model import LinearRegression
    from sklearn.metrics import mean_squared_error
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

router = APIRouter(prefix="/ml", tags=["ml"])
check_access = RequireModule("ml")


def holt_es(data, alpha=0.3, beta=0.1, steps=7):
    if len(data) < 2:
        return [data[0] if data else 0] * steps
    
    level = data[0]
    trend = data[1] - data[0]
    
    for i in range(1, len(data)):
        last_level = level
        level = alpha * data[i] + (1 - alpha) * (level + trend)
        trend = beta * (level - last_level) + (1 - beta) * trend
        
    predictions = []
    for i in range(1, steps + 1):
        pred = level + i * trend
        predictions.append(max(0, pred))
    return predictions


def manual_rmse(y_true, y_pred):
    if not y_true: return float('inf')
    return math.sqrt(sum((a - b)**2 for a, b in zip(y_true, y_pred)) / len(y_true))


def compute_prediksi_omzet(db: Session):
    # Ambil omzet harian 90 hari terakhir
    rows = db.execute(text("""
        SELECT date(tanggal) as tgl, SUM(total) as omzet
        FROM transaksi
        WHERE date(tanggal) >= date('now', '-90 days')
        GROUP BY date(tanggal)
        ORDER BY date(tanggal) ASC
    """)).fetchall()

    if not rows:
        return {"error": "Tidak ada data transaksi", "predictions": [], "model_used": "None", "rmse": 0}

    # Pad missing dates with 0
    start_date = datetime.strptime(rows[0].tgl, "%Y-%m-%d").date()
    end_date = datetime.strptime(rows[-1].tgl, "%Y-%m-%d").date()
    
    date_map = {r.tgl: r.omzet for r in rows}
    
    dates = []
    series = []
    curr = start_date
    while curr <= end_date:
        d_str = curr.strftime("%Y-%m-%d")
        dates.append(curr)
        series.append(float(date_map.get(d_str, 0)))
        curr += timedelta(days=1)

    steps_ahead = 7
    predictions = []
    model_used = "HoltES"
    best_rmse = float('inf')
    
    if len(series) < 35 or not HAS_SKLEARN:
        model_used = "HoltES"
        predictions = holt_es(series, 0.3, 0.1, steps_ahead)
        # Evaluasi dengan split 80/20 di sejarah jika cukup panjang
        if len(series) >= 10:
            split_idx = int(len(series) * 0.8)
            train = series[:split_idx]
            test = series[split_idx:]
            preds_test = holt_es(train, 0.3, 0.1, len(test))
            best_rmse = manual_rmse(test, preds_test)
    else:
        # Punya Sklearn dan data >= 35
        # Buat dataset
        X, y = [], []
        for i in range(30, len(series)):
            lag_1 = series[i-1]
            lag_7 = series[i-7]
            lag_30 = series[i-30]
            
            window = series[i-7:i]
            roll_mean = np.mean(window)
            roll_std = np.std(window)
            
            t = dates[i]
            hari_minggu = t.weekday()
            bulan = t.month
            is_weekend = 1 if hari_minggu >= 5 else 0
            trend = i
            
            X.append([lag_1, lag_7, lag_30, roll_mean, roll_std, trend, hari_minggu, bulan, is_weekend])
            y.append(series[i])
            
        X = np.array(X)
        y = np.array(y)
        
        split = int(len(X) * 0.8)
        X_train, y_train = X[:split], y[:split]
        X_test, y_test = X[split:], y[split:]
        
        # Test 1: Random Forest
        rf = RandomForestRegressor(n_estimators=50, random_state=42)
        rf.fit(X_train, y_train)
        rf_preds = rf.predict(X_test)
        rf_rmse = mean_squared_error(y_test, rf_preds, squared=False)
        
        # Test 2: Linear Regression
        lr = LinearRegression()
        lr.fit(X_train, y_train)
        lr_preds = lr.predict(X_test)
        lr_rmse = mean_squared_error(y_test, lr_preds, squared=False)
        
        # Test 3: HoltES as baseline
        train_series = series[:30 + split]
        test_series = series[30 + split:]
        holt_preds = holt_es(train_series, 0.3, 0.1, len(test_series))
        holt_rmse = manual_rmse(test_series, holt_preds)
        
        # Pick best
        best_model_name = "HoltES"
        best_rmse = holt_rmse
        
        if rf_rmse < best_rmse:
            best_rmse = rf_rmse
            best_model_name = "RandomForest"
            
        if lr_rmse < best_rmse:
            best_rmse = lr_rmse
            best_model_name = "LinearRegression"
            
        model_used = best_model_name
        
        # Predict future steps walk-forward
        if model_used == "HoltES":
            predictions = holt_es(series, 0.3, 0.1, steps_ahead)
        else:
            final_model = rf if model_used == "RandomForest" else lr
            final_model.fit(X, y)
            
            current_series = list(series)
            for step in range(steps_ahead):
                idx = len(current_series)
                
                lag_1 = current_series[-1]
                lag_7 = current_series[-7]
                lag_30 = current_series[-30]
                window = current_series[-7:]
                
                next_date = end_date + timedelta(days=step+1)
                hm = next_date.weekday()
                bln = next_date.month
                iw = 1 if hm >= 5 else 0
                tr = idx
                
                features = np.array([[lag_1, lag_7, lag_30, np.mean(window), np.std(window), tr, hm, bln, iw]])
                pred_val = max(0, final_model.predict(features)[0])
                predictions.append(pred_val)
                current_series.append(pred_val)
                
    # Confidence menurun linear per hari (misal 95% ke 65%)
    result_data = []
    base_conf = 95
    for i in range(steps_ahead):
        target_date = end_date + timedelta(days=i+1)
        conf = max(0, base_conf - (i * 5))
        result_data.append({
            "tanggal": target_date.strftime("%Y-%m-%d"),
            "prediksi_omzet": round(predictions[i], 2),
            "confidence": f"{conf}%"
        })
        
    return {
        "model_used": model_used,
        "rmse": round(best_rmse, 2),
        "predictions": result_data,
        "eval_info": "Model terbaik dipilih otomatis via time-based split."
    }


@router.get("/prediksi-omzet", dependencies=[Depends(check_access)])
def api_prediksi_omzet(
    background_tasks: BackgroundTasks,
    force_refresh: bool = Query(False),
    db: Session = Depends(get_db)
):
    res = get_or_trigger_ml_task(
        key="prediksi_omzet",
        compute_func=compute_prediksi_omzet,
        db=db,
        bg_tasks=background_tasks,
        db_factory=SessionLocal,
        max_age_hours=24,
        force_refresh=force_refresh
    )
    return res
