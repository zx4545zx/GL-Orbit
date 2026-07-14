CREATE INDEX IF NOT EXISTS "episode_schedules_episode_idx" ON "episode_schedules" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "episode_schedules_air_date_idx" ON "episode_schedules" USING btree ("air_date") WHERE "episode_schedules"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "episodes_series_idx" ON "episodes" USING btree ("series_id");
