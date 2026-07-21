-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN "is_public" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "inquiries_is_public_created_at_idx" ON "inquiries"("is_public", "created_at" DESC);
