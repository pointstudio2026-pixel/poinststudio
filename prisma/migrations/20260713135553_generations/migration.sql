-- CreateTable
CREATE TABLE "generations" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "current_version_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_versions" (
    "id" UUID NOT NULL,
    "generation_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "prompt_version_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "provider" VARCHAR(30),
    "images" JSONB NOT NULL DEFAULT '[]',
    "error_message" TEXT,
    "cost_amount" DECIMAL(12,6),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "generation_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "generations_project_id_key" ON "generations"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "generation_versions_generation_id_version_number_key" ON "generation_versions"("generation_id", "version_number");

-- AddForeignKey
ALTER TABLE "generations" ADD CONSTRAINT "generations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_versions" ADD CONSTRAINT "generation_versions_generation_id_fkey" FOREIGN KEY ("generation_id") REFERENCES "generations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
