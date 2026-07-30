-- Marks a MockupTemplate as excluded from the picker/gallery while keeping
-- the row (mockup_projects/standalone_mockups reference it via FK RESTRICT,
-- so rows with real usage can't be hard-deleted). Used for templates whose
-- background photo bakes in a business name outside the logo-placement area
-- (mismatches the user's real logo) but that already have generated results
-- pointing at them.
ALTER TABLE "mockup_templates" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;
