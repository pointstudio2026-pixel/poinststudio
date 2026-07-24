-- AlterTable: mood reference image for Style Engine leaf styles (level=3
-- only; level 0-2 rows stay null since they're browse-only category
-- buttons, not individually selectable). Nullable + no default so existing
-- rows are unaffected until re-seeded.
ALTER TABLE "styles" ADD COLUMN "sample_image_url" TEXT;
