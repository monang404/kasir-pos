from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.require_role import RequireModule
from app.auth.session import get_current_user
from app.database import get_db
from app.kasir.checkout_service import (
    CheckoutRequest,
    InsufficientStockException,
    proses_checkout,
)

router = APIRouter(prefix="/kasir", tags=["kasir"])
check_kasir_access = RequireModule("kasir")

@router.post("/checkout", dependencies=[Depends(check_kasir_access)])
def checkout_endpoint(
    req: CheckoutRequest, 
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    """
    Endpoint untuk checkout kasir secara atomic.
    Mengembalikan response sukses dengan field kode berisi TRX-YYYYMMDD-XXXXXXXX asli.
    """
    try:
        # Call the atomic service
        result = proses_checkout(db=db, req=req, kasir_id=user["id"], kasir_nama=user["nama_lengkap"])
        return {
            "status": "success",
            "message": "Transaksi berhasil",
            "data": result
        }
    except InsufficientStockException as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        import logging
        logging.exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Terjadi kesalahan internal. Silakan coba lagi."
        )
