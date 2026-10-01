-- Phase 1 games share a small JSON state store with the existing per-Home DrawingSwapGame record.
ALTER TABLE "DrawingSwapGame" ADD COLUMN "gameState" TEXT;
