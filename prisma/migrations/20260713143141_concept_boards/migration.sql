-- CreateTable
CREATE TABLE "concept_boards" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "current_version_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "concept_boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concept_board_versions" (
    "id" UUID NOT NULL,
    "concept_board_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "source" VARCHAR(30) NOT NULL DEFAULT 'ai',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "concept_board_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "concept_boards_project_id_key" ON "concept_boards"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "concept_board_versions_concept_board_id_version_number_key" ON "concept_board_versions"("concept_board_id", "version_number");

-- AddForeignKey
ALTER TABLE "concept_boards" ADD CONSTRAINT "concept_boards_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concept_board_versions" ADD CONSTRAINT "concept_board_versions_concept_board_id_fkey" FOREIGN KEY ("concept_board_id") REFERENCES "concept_boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
