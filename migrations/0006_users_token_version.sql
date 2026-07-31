-- Add token_version to users for token invalidation

ALTER TABLE users
ADD COLUMN token_version INT NOT NULL DEFAULT 0;
