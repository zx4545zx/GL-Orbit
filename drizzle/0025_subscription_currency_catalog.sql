CREATE TABLE "currencies" (
	"code" varchar(3) PRIMARY KEY NOT NULL,
	"name_th" varchar(100) NOT NULL,
	"name_en" varchar(100) NOT NULL,
	"minor_unit" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "currencies_code_shape" CHECK ("currencies"."code" ~ '^[A-Z]{3}$'),
	CONSTRAINT "currencies_minor_unit_range" CHECK ("currencies"."minor_unit" BETWEEN 0 AND 4),
	CONSTRAINT "currencies_sort_order_nonnegative" CHECK ("currencies"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE INDEX "currencies_active_order_idx" ON "currencies" USING btree ("is_active","sort_order","code");--> statement-breakpoint
INSERT INTO "currencies" ("code", "name_th", "name_en", "minor_unit", "is_active", "sort_order") VALUES
	('THB', 'บาทไทย', 'Thai Baht', 2, true, 10),
	('USD', 'ดอลลาร์สหรัฐ', 'US Dollar', 2, true, 20),
	('EUR', 'ยูโร', 'Euro', 2, true, 30),
	('GBP', 'ปอนด์สเตอร์ลิง', 'Pound Sterling', 2, true, 40),
	('JPY', 'เยนญี่ปุ่น', 'Japanese Yen', 0, true, 50),
	('KRW', 'วอนเกาหลีใต้', 'South Korean Won', 0, true, 60),
	('CNY', 'หยวนจีน', 'Chinese Yuan', 2, true, 70),
	('TWD', 'ดอลลาร์ไต้หวันใหม่', 'New Taiwan Dollar', 2, true, 80),
	('HKD', 'ดอลลาร์ฮ่องกง', 'Hong Kong Dollar', 2, true, 90),
	('SGD', 'ดอลลาร์สิงคโปร์', 'Singapore Dollar', 2, true, 100),
	('MYR', 'ริงกิตมาเลเซีย', 'Malaysian Ringgit', 2, true, 110),
	('PHP', 'เปโซฟิลิปปินส์', 'Philippine Peso', 2, true, 120),
	('IDR', 'รูเปียห์อินโดนีเซีย', 'Indonesian Rupiah', 2, true, 130),
	('VND', 'ดองเวียดนาม', 'Vietnamese Dong', 0, true, 140),
	('AUD', 'ดอลลาร์ออสเตรเลีย', 'Australian Dollar', 2, true, 150)
ON CONFLICT ("code") DO NOTHING;--> statement-breakpoint
-- Apply this migration in one transaction. This lock prevents 0024-era writes from
-- introducing a currency code between legacy preservation and FK creation.
LOCK TABLE "user_subscriptions", "subscription_payments", "subscription_budgets" IN SHARE ROW EXCLUSIVE MODE;--> statement-breakpoint
WITH "legacy_codes" AS (
	SELECT "currency" AS "code" FROM "user_subscriptions"
	UNION
	SELECT "currency" AS "code" FROM "subscription_payments"
	UNION
	SELECT "currency" AS "code" FROM "subscription_budgets"
), "missing_codes" AS (
	SELECT "legacy_codes"."code"
	FROM "legacy_codes"
	LEFT JOIN "currencies" ON "currencies"."code" = "legacy_codes"."code"
	WHERE "currencies"."code" IS NULL
)
INSERT INTO "currencies" ("code", "name_th", "name_en", "minor_unit", "is_active", "sort_order")
SELECT "code", "code", "code", 2, false, 1000 + row_number() OVER (ORDER BY "code")
FROM "missing_codes"
ON CONFLICT ("code") DO NOTHING;--> statement-breakpoint
ALTER TABLE "subscription_budgets" ADD CONSTRAINT "subscription_budgets_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_currency_currencies_code_fk" FOREIGN KEY ("currency") REFERENCES "public"."currencies"("code") ON DELETE restrict ON UPDATE cascade;
