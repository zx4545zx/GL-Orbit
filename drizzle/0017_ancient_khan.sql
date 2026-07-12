CREATE TYPE "public"."moment_comment_status" AS ENUM('PUBLISHED', 'HIDDEN', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."moment_embed_status" AS ENUM('READY', 'FALLBACK', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."moment_media_source" AS ENUM('EXTERNAL', 'UPLOAD');--> statement-breakpoint
CREATE TYPE "public"."moment_media_type" AS ENUM('IMAGE');--> statement-breakpoint
CREATE TYPE "public"."moment_report_reason" AS ENUM('SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'COPYRIGHT', 'MISLEADING', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."moment_report_status" AS ENUM('PENDING', 'REVIEWED', 'DISMISSED', 'ACTIONED');--> statement-breakpoint
CREATE TYPE "public"."moment_source_provider" AS ENUM('YOUTUBE', 'TIKTOK', 'X', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."moment_status" AS ENUM('PUBLISHED', 'HIDDEN', 'DELETED');--> statement-breakpoint
CREATE TABLE "moment_artists" (
	"moment_id" uuid NOT NULL,
	"artist_id" uuid NOT NULL,
	CONSTRAINT "moment_artists_moment_id_artist_id_pk" PRIMARY KEY("moment_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "moment_bookmarks" (
	"moment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "moment_bookmarks_moment_id_user_id_pk" PRIMARY KEY("moment_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "moment_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moment_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"parent_id" uuid,
	"body" text NOT NULL,
	"status" "moment_comment_status" DEFAULT 'PUBLISHED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "moment_comments_parent_not_self" CHECK ("moment_comments"."parent_id" IS NULL OR "moment_comments"."parent_id" <> "moment_comments"."id")
);
--> statement-breakpoint
CREATE TABLE "moment_likes" (
	"moment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "moment_likes_moment_id_user_id_pk" PRIMARY KEY("moment_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "moment_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moment_id" uuid NOT NULL,
	"media_type" "moment_media_type" DEFAULT 'IMAGE' NOT NULL,
	"source_type" "moment_media_source" DEFAULT 'EXTERNAL' NOT NULL,
	"external_url" text,
	"storage_key" text,
	"alt_text" varchar(500),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "moment_media_external_only" CHECK (("moment_media"."source_type" <> 'EXTERNAL') OR ("moment_media"."external_url" IS NOT NULL AND "moment_media"."storage_key" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "moment_moderation_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moment_id" uuid NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"action" varchar(20) NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moment_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"moment_id" uuid,
	"comment_id" uuid,
	"reason" "moment_report_reason" NOT NULL,
	"details" text,
	"status" "moment_report_status" DEFAULT 'PENDING' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "moment_reports_target_check" CHECK (("moment_reports"."moment_id" IS NOT NULL)::int + ("moment_reports"."comment_id" IS NOT NULL)::int = 1)
);
--> statement-breakpoint
CREATE TABLE "moment_series" (
	"moment_id" uuid NOT NULL,
	"series_id" uuid NOT NULL,
	CONSTRAINT "moment_series_moment_id_series_id_pk" PRIMARY KEY("moment_id","series_id")
);
--> statement-breakpoint
CREATE TABLE "moment_ships" (
	"moment_id" uuid NOT NULL,
	"ship_id" uuid NOT NULL,
	CONSTRAINT "moment_ships_moment_id_ship_id_pk" PRIMARY KEY("moment_id","ship_id")
);
--> statement-breakpoint
CREATE TABLE "moments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"body" text,
	"source_url" text NOT NULL,
	"source_canonical_url" text NOT NULL,
	"source_provider" "moment_source_provider" NOT NULL,
	"source_external_id" varchar(255),
	"embed_status" "moment_embed_status" DEFAULT 'FALLBACK' NOT NULL,
	"embed_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "moment_status" DEFAULT 'PUBLISHED' NOT NULL,
	"language" varchar(10),
	"like_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "moments_like_count_non_negative" CHECK ("moments"."like_count" >= 0),
	CONSTRAINT "moments_comment_count_non_negative" CHECK ("moments"."comment_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "rate_limit_windows" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limit_windows_request_count_non_negative" CHECK ("rate_limit_windows"."request_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "series_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "actor_user_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "moment_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "comment_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "moment_artists" ADD CONSTRAINT "moment_artists_moment_id_moments_id_fk" FOREIGN KEY ("moment_id") REFERENCES "public"."moments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_artists" ADD CONSTRAINT "moment_artists_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_bookmarks" ADD CONSTRAINT "moment_bookmarks_moment_id_moments_id_fk" FOREIGN KEY ("moment_id") REFERENCES "public"."moments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_bookmarks" ADD CONSTRAINT "moment_bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_comments" ADD CONSTRAINT "moment_comments_moment_id_moments_id_fk" FOREIGN KEY ("moment_id") REFERENCES "public"."moments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_comments" ADD CONSTRAINT "moment_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_likes" ADD CONSTRAINT "moment_likes_moment_id_moments_id_fk" FOREIGN KEY ("moment_id") REFERENCES "public"."moments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_likes" ADD CONSTRAINT "moment_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_media" ADD CONSTRAINT "moment_media_moment_id_moments_id_fk" FOREIGN KEY ("moment_id") REFERENCES "public"."moments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_moderation_actions" ADD CONSTRAINT "moment_moderation_actions_moment_id_moments_id_fk" FOREIGN KEY ("moment_id") REFERENCES "public"."moments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_moderation_actions" ADD CONSTRAINT "moment_moderation_actions_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_reports" ADD CONSTRAINT "moment_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_reports" ADD CONSTRAINT "moment_reports_moment_id_moments_id_fk" FOREIGN KEY ("moment_id") REFERENCES "public"."moments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_reports" ADD CONSTRAINT "moment_reports_comment_id_moment_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."moment_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_reports" ADD CONSTRAINT "moment_reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_series" ADD CONSTRAINT "moment_series_moment_id_moments_id_fk" FOREIGN KEY ("moment_id") REFERENCES "public"."moments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_series" ADD CONSTRAINT "moment_series_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_ships" ADD CONSTRAINT "moment_ships_moment_id_moments_id_fk" FOREIGN KEY ("moment_id") REFERENCES "public"."moments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moment_ships" ADD CONSTRAINT "moment_ships_ship_id_ships_id_fk" FOREIGN KEY ("ship_id") REFERENCES "public"."ships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moments" ADD CONSTRAINT "moments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "moment_artists_artist_idx" ON "moment_artists" USING btree ("artist_id","moment_id");--> statement-breakpoint
CREATE INDEX "moment_bookmarks_user_idx" ON "moment_bookmarks" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "moment_comments_moment_idx" ON "moment_comments" USING btree ("moment_id","created_at","id");--> statement-breakpoint
CREATE INDEX "moment_comments_parent_idx" ON "moment_comments" USING btree ("parent_id","created_at","id");--> statement-breakpoint
CREATE INDEX "moment_likes_user_idx" ON "moment_likes" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "moment_media_moment_idx" ON "moment_media" USING btree ("moment_id","sort_order");--> statement-breakpoint
CREATE INDEX "moment_moderation_actions_moment_idx" ON "moment_moderation_actions" USING btree ("moment_id","created_at");--> statement-breakpoint
CREATE INDEX "moment_reports_pending_idx" ON "moment_reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "moment_reports_reporter_moment_unique" ON "moment_reports" USING btree ("reporter_id","moment_id") WHERE "moment_reports"."moment_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "moment_reports_reporter_comment_unique" ON "moment_reports" USING btree ("reporter_id","comment_id") WHERE "moment_reports"."comment_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "moment_series_series_idx" ON "moment_series" USING btree ("series_id","moment_id");--> statement-breakpoint
CREATE INDEX "moment_ships_ship_idx" ON "moment_ships" USING btree ("ship_id","moment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "moments_author_source_unique" ON "moments" USING btree ("author_id","source_canonical_url");--> statement-breakpoint
CREATE INDEX "moments_feed_idx" ON "moments" USING btree ("status","created_at","id");--> statement-breakpoint
CREATE INDEX "moments_author_idx" ON "moments" USING btree ("author_id","created_at","id");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_moment_id_moments_id_fk" FOREIGN KEY ("moment_id") REFERENCES "public"."moments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_comment_id_moment_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."moment_comments"("id") ON DELETE cascade ON UPDATE no action;