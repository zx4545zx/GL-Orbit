-- Preserve existing full_name values by renaming them to full_name_th.
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'artists' AND column_name = 'full_name'
	) AND NOT EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'artists' AND column_name = 'full_name_th'
	) THEN
		ALTER TABLE "artists" RENAME COLUMN "full_name" TO "full_name_th";
	END IF;
END $$;

-- Add full_name_th if this database was created without the old full_name column.
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "full_name_th" varchar(255);

-- Add full_name_en with a temporary default so existing rows satisfy NOT NULL,
-- backfill empty rows from nickname, then drop the default so future inserts must provide it.
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "full_name_en" varchar(255) NOT NULL DEFAULT '';
UPDATE "artists" SET "full_name_en" = "nickname" WHERE "full_name_en" = '' OR "full_name_en" IS NULL;
ALTER TABLE "artists" ALTER COLUMN "full_name_en" DROP DEFAULT;
