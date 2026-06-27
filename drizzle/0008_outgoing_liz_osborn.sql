CREATE TABLE "studio_socials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"studio_id" uuid NOT NULL,
	"platform" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"icon_url" text
);
--> statement-breakpoint
ALTER TABLE "studio_socials" ADD CONSTRAINT "studio_socials_studio_id_studios_id_fk" FOREIGN KEY ("studio_id") REFERENCES "public"."studios"("id") ON DELETE cascade ON UPDATE no action;