-- DropForeignKey
ALTER TABLE "brand_brief_versions" DROP CONSTRAINT "brand_brief_versions_brand_brief_id_fkey";

-- DropForeignKey
ALTER TABLE "brand_brief_versions" DROP CONSTRAINT "brand_brief_versions_created_by_fkey";

-- DropForeignKey
ALTER TABLE "brand_briefs" DROP CONSTRAINT "brand_briefs_project_id_fkey";

-- DropTable
DROP TABLE "brand_brief_versions";

-- DropTable
DROP TABLE "brand_briefs";

