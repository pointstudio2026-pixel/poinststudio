-- CreateTable
CREATE TABLE "gift_codes" (
    "id" UUID NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "plan_code" "plan_code" NOT NULL,
    "grant_days" INTEGER NOT NULL DEFAULT 31,
    "batch_label" VARCHAR(100),
    "expires_at" TIMESTAMPTZ,
    "redeemed_by_user_id" UUID,
    "redeemed_at" TIMESTAMPTZ,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gift_codes_code_key" ON "gift_codes"("code");

-- CreateIndex
CREATE INDEX "gift_codes_batch_label_idx" ON "gift_codes"("batch_label");

-- AddForeignKey
ALTER TABLE "gift_codes" ADD CONSTRAINT "gift_codes_redeemed_by_user_id_fkey" FOREIGN KEY ("redeemed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_codes" ADD CONSTRAINT "gift_codes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
