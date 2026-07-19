CREATE INDEX CONCURRENTLY IF NOT EXISTS "favorites_series_user_idx" ON "favorites" USING btree ("series_id","user_id");--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "notifications_unread_user_idx" ON "notifications" USING btree ("user_id") WHERE "notifications"."is_read" = false;--> statement-breakpoint
CREATE INDEX CONCURRENTLY IF NOT EXISTS "push_subscriptions_user_idx" ON "push_subscriptions" USING btree ("user_id");
