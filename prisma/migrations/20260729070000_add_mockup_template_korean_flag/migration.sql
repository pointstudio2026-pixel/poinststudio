-- Marks whether a MockupTemplate's background photo has Korean text baked
-- into the actual image pixels (not just the DB name/keywords). Used to
-- hide such templates from non-Korean-locale users in list/search results.
ALTER TABLE "mockup_templates" ADD COLUMN "contains_korean_text" BOOLEAN NOT NULL DEFAULT false;
