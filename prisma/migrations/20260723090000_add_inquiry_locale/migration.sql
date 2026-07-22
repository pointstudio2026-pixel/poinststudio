-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN "locale" VARCHAR(5) NOT NULL DEFAULT 'ko';

-- CreateIndex
CREATE INDEX "inquiries_locale_is_public_created_at_idx" ON "inquiries"("locale", "is_public", "created_at" DESC);
