-- `drizzle-kit push` partially created this additive schema before failing on an
-- unrelated subscription constraint. Keep this migration safe to run once the
-- migration process is repaired: it completes that partial state or creates it
-- from scratch, without touching subscription constraints.
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_type type
		JOIN pg_namespace namespace ON namespace.oid = type.typnamespace
		WHERE namespace.nspname = 'public' AND type.typname = 'news_status'
	) THEN
		CREATE TYPE "public"."news_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');
	END IF;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "news" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title_th" varchar(255) NOT NULL,
	"title_en" varchar(255) NOT NULL,
	"content_th" text NOT NULL,
	"content_en" text NOT NULL,
	"cover_image_url" text,
	"source_url" text,
	"source_name" varchar(255),
	"published_at" timestamp with time zone,
	"status" "news_status" DEFAULT 'DRAFT' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "news_slug_unique" UNIQUE("slug"),
	CONSTRAINT "news_published_state_check" CHECK (("news"."status" = 'PUBLISHED') = ("news"."published_at" IS NOT NULL))
);
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conrelid = 'public.news'::regclass AND conname = 'news_slug_unique'
	) THEN
		ALTER TABLE "news" ADD CONSTRAINT "news_slug_unique" UNIQUE("slug");
	END IF;
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conrelid = 'public.news'::regclass AND conname = 'news_published_state_check'
	) THEN
		ALTER TABLE "news" ADD CONSTRAINT "news_published_state_check" CHECK (("news"."status" = 'PUBLISHED') = ("news"."published_at" IS NOT NULL));
	END IF;
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conrelid = 'public.news'::regclass AND conname = 'news_created_by_users_id_fk'
	) THEN
		ALTER TABLE "news" ADD CONSTRAINT "news_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
	END IF;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "news_public_published_idx" ON "news" USING btree ("published_at" DESC NULLS LAST,"id") WHERE "news"."deleted_at" IS NULL AND "news"."status" = 'PUBLISHED';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "news_creator_idx" ON "news" USING btree ("created_by","created_at" DESC NULLS LAST);
