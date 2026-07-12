ALTER TABLE "moments" DROP CONSTRAINT "moments_pending_media_count_non_negative";--> statement-breakpoint
ALTER TABLE "moments" ADD CONSTRAINT "moments_pending_media_count_range" CHECK ("moments"."pending_media_count" BETWEEN 0 AND 4);--> statement-breakpoint
ALTER TABLE "moments" ADD CONSTRAINT "moments_pending_media_status" CHECK ("moments"."status" <> 'UPLOADING' OR "moments"."pending_media_count" > 0);
