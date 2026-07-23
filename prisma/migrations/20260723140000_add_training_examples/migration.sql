-- CreateTable
CREATE TABLE "training_examples" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "prompt" TEXT NOT NULL,
    "deliverable_type" VARCHAR(30) NOT NULL,
    "image_storage_key" TEXT NOT NULL,
    "image_content_type" VARCHAR(50) NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_examples_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "training_examples_deliverable_type_idx" ON "training_examples"("deliverable_type");

-- AddForeignKey
ALTER TABLE "training_examples" ADD CONSTRAINT "training_examples_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
