CREATE TYPE "public"."subscription_billing_unit" AS ENUM('DAY', 'MONTH', 'YEAR');--> statement-breakpoint
CREATE TYPE "public"."subscription_payment_kind" AS ENUM('INITIAL', 'RENEWAL', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('ACTIVE', 'CANCELED');--> statement-breakpoint
CREATE TABLE "subscription_budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"currency" varchar(3) NOT NULL,
	"monthly_limit" numeric(18, 4) NOT NULL,
	"warning_percent" integer DEFAULT 80 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_budgets_user_currency_unique" UNIQUE("user_id","currency"),
	CONSTRAINT "subscription_budgets_limit_positive" CHECK ("subscription_budgets"."monthly_limit" > 0),
	CONSTRAINT "subscription_budgets_currency_shape" CHECK ("subscription_budgets"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "subscription_budgets_warning_range" CHECK ("subscription_budgets"."warning_percent" BETWEEN 1 AND 100)
);
--> statement-breakpoint
CREATE TABLE "subscription_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"kind" "subscription_payment_kind" NOT NULL,
	"amount" numeric(18, 4) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"paid_date" date NOT NULL,
	"service_period_start" date NOT NULL,
	"service_period_end" date NOT NULL,
	"renewal_from_period_start" date,
	"renewal_from_period_end" date,
	"renewal_anchor_before" date,
	"renewal_sequence_before" integer,
	"billing_unit_snapshot" "subscription_billing_unit",
	"billing_interval_snapshot" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "subscription_payments_amount_non_negative" CHECK ("subscription_payments"."amount" >= 0),
	CONSTRAINT "subscription_payments_currency_shape" CHECK ("subscription_payments"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "subscription_payments_period_order" CHECK ("subscription_payments"."service_period_start" <= "subscription_payments"."service_period_end"),
	CONSTRAINT "subscription_payments_renewal_snapshots" CHECK (("subscription_payments"."kind" = 'RENEWAL' AND "subscription_payments"."renewal_from_period_start" IS NOT NULL AND "subscription_payments"."renewal_from_period_end" IS NOT NULL AND "subscription_payments"."renewal_anchor_before" IS NOT NULL AND "subscription_payments"."renewal_sequence_before" IS NOT NULL AND "subscription_payments"."billing_unit_snapshot" IS NOT NULL AND "subscription_payments"."billing_interval_snapshot" IS NOT NULL) OR ("subscription_payments"."kind" <> 'RENEWAL' AND "subscription_payments"."renewal_from_period_start" IS NULL AND "subscription_payments"."renewal_from_period_end" IS NULL AND "subscription_payments"."renewal_anchor_before" IS NULL AND "subscription_payments"."renewal_sequence_before" IS NULL AND "subscription_payments"."billing_unit_snapshot" IS NULL AND "subscription_payments"."billing_interval_snapshot" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform_id" uuid,
	"custom_platform_name" varchar(255),
	"plan_name" varchar(120),
	"account_label" varchar(120),
	"amount" numeric(18, 4) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"billing_unit" "subscription_billing_unit" NOT NULL,
	"billing_interval" integer NOT NULL,
	"current_period_start" date NOT NULL,
	"current_period_end" date NOT NULL,
	"renewal_anchor_date" date NOT NULL,
	"renewal_sequence" integer DEFAULT 0 NOT NULL,
	"renews_automatically" boolean DEFAULT true NOT NULL,
	"status" "subscription_status" DEFAULT 'ACTIVE' NOT NULL,
	"alert_days" integer[] DEFAULT ARRAY[]::integer[] NOT NULL,
	"canceled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "user_subscriptions_user_id_id_unique" UNIQUE("user_id","id"),
	CONSTRAINT "user_subscriptions_source_xor" CHECK ((("user_subscriptions"."platform_id" IS NOT NULL)::int + (NULLIF(BTRIM("user_subscriptions"."custom_platform_name"), '') IS NOT NULL)::int) = 1),
	CONSTRAINT "user_subscriptions_amount_non_negative" CHECK ("user_subscriptions"."amount" >= 0),
	CONSTRAINT "user_subscriptions_currency_shape" CHECK ("user_subscriptions"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "user_subscriptions_period_order" CHECK ("user_subscriptions"."current_period_start" <= "user_subscriptions"."current_period_end"),
	CONSTRAINT "user_subscriptions_interval_range" CHECK (("user_subscriptions"."billing_unit" = 'DAY' AND "user_subscriptions"."billing_interval" BETWEEN 1 AND 365) OR ("user_subscriptions"."billing_unit" = 'MONTH' AND "user_subscriptions"."billing_interval" BETWEEN 1 AND 120) OR ("user_subscriptions"."billing_unit" = 'YEAR' AND "user_subscriptions"."billing_interval" BETWEEN 1 AND 20)),
	CONSTRAINT "user_subscriptions_sequence_non_negative" CHECK ("user_subscriptions"."renewal_sequence" >= 0),
	CONSTRAINT "user_subscriptions_alert_days_range" CHECK (cardinality("user_subscriptions"."alert_days") <= 10 AND array_position("user_subscriptions"."alert_days", NULL) IS NULL AND 0 < ALL("user_subscriptions"."alert_days") AND 366 > ALL("user_subscriptions"."alert_days")),
	CONSTRAINT "user_subscriptions_canceled_state" CHECK (("user_subscriptions"."status" = 'CANCELED') = ("user_subscriptions"."canceled_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "subscription_budgets" ADD CONSTRAINT "subscription_budgets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_user_subscription_fk" FOREIGN KEY ("user_id","subscription_id") REFERENCES "public"."user_subscriptions"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscription_budgets_user_currency_idx" ON "subscription_budgets" USING btree ("user_id","currency");--> statement-breakpoint
CREATE INDEX "subscription_payments_user_paid_idx" ON "subscription_payments" USING btree ("user_id","paid_date" DESC NULLS LAST,"id") WHERE "subscription_payments"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "subscription_payments_subscription_history_idx" ON "subscription_payments" USING btree ("subscription_id","paid_date" DESC NULLS LAST,"created_at" DESC NULLS LAST,"id" DESC NULLS LAST) WHERE "subscription_payments"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_payments_live_renewal_unique" ON "subscription_payments" USING btree ("subscription_id","renewal_from_period_end") WHERE "subscription_payments"."kind" = 'RENEWAL' AND "subscription_payments"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "user_subscriptions_active_due_idx" ON "user_subscriptions" USING btree ("user_id","current_period_end") WHERE "user_subscriptions"."deleted_at" IS NULL AND "user_subscriptions"."status" = 'ACTIVE';--> statement-breakpoint
CREATE INDEX "user_subscriptions_user_lookup_idx" ON "user_subscriptions" USING btree ("user_id","id") WHERE "user_subscriptions"."deleted_at" IS NULL;