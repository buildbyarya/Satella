-- Harden Home deletion requests to one active request per Home.
ALTER TABLE "HomeDeletionRequest"
  ADD CONSTRAINT "HomeDeletionRequest_homeId_key" UNIQUE ("homeId");
