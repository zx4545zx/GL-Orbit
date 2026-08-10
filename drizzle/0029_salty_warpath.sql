CREATE TYPE "public"."ai_provider_type" AS ENUM('OPENROUTER', 'GOOGLE', 'OPENAI_COMPATIBLE');--> statement-breakpoint
CREATE TABLE "ai_model_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider_config_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"model_id" varchar(255) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_provider_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "ai_provider_type" NOT NULL,
	"name" varchar(120) NOT NULL,
	"base_url" text,
	"credential" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_provider_configs_user_id_id_unique" UNIQUE("user_id","id")
);
--> statement-breakpoint
ALTER TABLE "chat_conversation_messages" ADD COLUMN "parts" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_conversation_messages" ADD COLUMN "provider_type" "ai_provider_type";--> statement-breakpoint
ALTER TABLE "chat_conversation_messages" ADD COLUMN "model_id" varchar(255);--> statement-breakpoint
ALTER TABLE "ai_model_profiles" ADD CONSTRAINT "ai_model_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_model_profiles" ADD CONSTRAINT "ai_model_profiles_user_provider_fk" FOREIGN KEY ("user_id","provider_config_id") REFERENCES "public"."ai_provider_configs"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_provider_configs" ADD CONSTRAINT "ai_provider_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_model_profiles_user_idx" ON "ai_model_profiles" USING btree ("user_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "ai_model_profiles_one_default_per_user" ON "ai_model_profiles" USING btree ("user_id") WHERE "ai_model_profiles"."is_default" = true;--> statement-breakpoint
CREATE INDEX "ai_provider_configs_user_idx" ON "ai_provider_configs" USING btree ("user_id","updated_at" DESC NULLS LAST);