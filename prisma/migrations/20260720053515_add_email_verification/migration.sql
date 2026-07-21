-- AlterTable
ALTER TABLE "users" ADD COLUMN "email_verification_token" TEXT,
ADD COLUMN "email_verification_token_expires_at" TIMESTAMPTZ;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_verification_token_key" ON "users"("email_verification_token");
