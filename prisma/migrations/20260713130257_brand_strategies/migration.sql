-- CreateTable
CREATE TABLE "brand_strategies" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "current_version_id" UUID,
    "approved_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "brand_strategies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_strategy_versions" (
    "id" UUID NOT NULL,
    "brand_strategy_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "reasoning_summary" TEXT,
    "confidence" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_strategy_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brand_strategies_project_id_key" ON "brand_strategies"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "brand_strategy_versions_brand_strategy_id_version_number_key" ON "brand_strategy_versions"("brand_strategy_id", "version_number");

-- AddForeignKey
ALTER TABLE "brand_strategies" ADD CONSTRAINT "brand_strategies_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_strategy_versions" ADD CONSTRAINT "brand_strategy_versions_brand_strategy_id_fkey" FOREIGN KEY ("brand_strategy_id") REFERENCES "brand_strategies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
