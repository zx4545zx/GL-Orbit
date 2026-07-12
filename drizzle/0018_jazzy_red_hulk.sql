ALTER TYPE "public"."moment_status" ADD VALUE 'UPLOADING' BEFORE 'PUBLISHED';--> statement-breakpoint
ALTER TABLE "moments" ALTER COLUMN "source_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "moments" ALTER COLUMN "source_canonical_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "moments" ADD COLUMN "pending_media_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "moments" ADD CONSTRAINT "moments_pending_media_count_non_negative" CHECK ("moments"."pending_media_count" >= 0);