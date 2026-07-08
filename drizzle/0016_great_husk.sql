CREATE TABLE "ship_series" (
	"ship_id" uuid NOT NULL,
	"series_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"artist_1_id" uuid NOT NULL,
	"artist_2_id" uuid NOT NULL,
	"pair_key" varchar(80) NOT NULL,
	"image_url" text,
	"description" text,
	"started_at" timestamp with time zone,
	"hashtags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ships_slug_unique" UNIQUE("slug"),
	CONSTRAINT "ships_pair_key_unique" UNIQUE("pair_key")
);
--> statement-breakpoint
ALTER TABLE "ship_series" ADD CONSTRAINT "ship_series_ship_id_ships_id_fk" FOREIGN KEY ("ship_id") REFERENCES "public"."ships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ship_series" ADD CONSTRAINT "ship_series_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ships" ADD CONSTRAINT "ships_artist_1_id_artists_id_fk" FOREIGN KEY ("artist_1_id") REFERENCES "public"."artists"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ships" ADD CONSTRAINT "ships_artist_2_id_artists_id_fk" FOREIGN KEY ("artist_2_id") REFERENCES "public"."artists"("id") ON DELETE restrict ON UPDATE no action;