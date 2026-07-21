-- CreateTable
CREATE TABLE "color_palette_selections" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "preset_slug" VARCHAR(60),
    "swatches" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "color_palette_selections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "color_palette_selections_project_id_created_at_idx" ON "color_palette_selections"("project_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "color_palette_selections" ADD CONSTRAINT "color_palette_selections_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
