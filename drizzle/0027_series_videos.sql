CREATE TABLE "series_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"series_id" uuid NOT NULL,
	"type" varchar(32) NOT NULL,
	"youtube_url" text NOT NULL,
	"youtube_video_id" varchar(32) NOT NULL,
	"title_th" varchar(255) NOT NULL,
	"title_en" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "series_videos_series_video_unique" UNIQUE("series_id","youtube_video_id")
);
--> statement-breakpoint
ALTER TABLE "series_videos" ADD CONSTRAINT "series_videos_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "series_videos_order_idx" ON "series_videos" USING btree ("series_id","type","sort_order","created_at");