-- Add a confirmed flag so an uploaded-but-never-confirmed logo file can't
-- silently trigger the logo-preservation generation path.
ALTER TABLE "project_logo_assets" ADD COLUMN "confirmed" BOOLEAN NOT NULL DEFAULT false;
