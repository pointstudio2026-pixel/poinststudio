-- AlterTable
ALTER TABLE "gift_codes" ADD COLUMN "max_redemptions" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "gift_code_redemptions" (
    "id" UUID NOT NULL,
    "gift_code_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "redeemed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_code_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gift_code_redemptions_gift_code_id_user_id_key" ON "gift_code_redemptions"("gift_code_id", "user_id");

-- AddForeignKey
ALTER TABLE "gift_code_redemptions" ADD CONSTRAINT "gift_code_redemptions_gift_code_id_fkey" FOREIGN KEY ("gift_code_id") REFERENCES "gift_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_code_redemptions" ADD CONSTRAINT "gift_code_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: any code already redeemed under the old single-redeemer model gets one matching row here too.
INSERT INTO "gift_code_redemptions" ("id", "gift_code_id", "user_id", "redeemed_at")
SELECT gen_random_uuid(), "id", "redeemed_by_user_id", COALESCE("redeemed_at", CURRENT_TIMESTAMP)
FROM "gift_codes"
WHERE "redeemed_by_user_id" IS NOT NULL;
