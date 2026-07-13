-- CreateTable
CREATE TABLE "edit_history" (
    "id" UUID NOT NULL,
    "generation_id" UUID NOT NULL,
    "source_version_id" UUID NOT NULL,
    "source_image_index" INTEGER NOT NULL,
    "preset_key" VARCHAR(40) NOT NULL,
    "result_version_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "edit_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "edit_history_generation_id_created_at_idx" ON "edit_history"("generation_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "edit_history" ADD CONSTRAINT "edit_history_generation_id_fkey" FOREIGN KEY ("generation_id") REFERENCES "generations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
