-- Satella Home deletion requests
CREATE TABLE "HomeDeletionRequest" (
  "id" TEXT NOT NULL,
  "homeId" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "partnerDecision" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "respondedAt" TIMESTAMP(3),
  CONSTRAINT "HomeDeletionRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HomeDeletionRequest_homeId_idx" ON "HomeDeletionRequest"("homeId");
CREATE INDEX "HomeDeletionRequest_partnerId_partnerDecision_idx" ON "HomeDeletionRequest"("partnerId", "partnerDecision");
CREATE INDEX "HomeDeletionRequest_requesterId_idx" ON "HomeDeletionRequest"("requesterId");

ALTER TABLE "HomeDeletionRequest"
  ADD CONSTRAINT "HomeDeletionRequest_homeId_fkey"
  FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HomeDeletionRequest"
  ADD CONSTRAINT "HomeDeletionRequest_requesterId_fkey"
  FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HomeDeletionRequest"
  ADD CONSTRAINT "HomeDeletionRequest_partnerId_fkey"
  FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
