ALTER TABLE "sessions" ADD COLUMN "browser" varchar(50);--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "operating_system" varchar(50);--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "device_type" varchar(20);--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "masked_ip" varchar(64);--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "city" varchar(100);--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "country_code" varchar(2);--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "last_seen_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "sessions_user_expires_idx" ON "sessions" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "sessions_expires_idx" ON "sessions" USING btree ("expires_at");
