ALTER TABLE produk_batch ADD CONSTRAINT chk_qty_sisa_non_negative CHECK (qty_sisa >= 0);
