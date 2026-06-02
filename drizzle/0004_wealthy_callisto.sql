CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "genres_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "series_genres" (
	"series_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "series_genres" ADD CONSTRAINT "series_genres_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "series_genres" ADD CONSTRAINT "series_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;