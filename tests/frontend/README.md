# tests/frontend

Lokasi seluruh test frontend (Vitest), mirror terhadap `frontend/src/`.

Contoh:

```
frontend/src/components/kasir/   ->   tests/frontend/components/kasir/
frontend/src/pages/ml/           ->   tests/frontend/pages/ml/
```

Belum ada test frontend saat konsolidasi ini dibuat — folder ini disiapkan
supaya test baru langsung ditulis di lokasi yang benar (lihat
`frontend/vitest.config.ts` untuk konfigurasi `include`).
