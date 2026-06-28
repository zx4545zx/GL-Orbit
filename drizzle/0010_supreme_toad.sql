CREATE TABLE "chat_conversation_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(120) DEFAULT 'New chat' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_conversation_messages" ADD CONSTRAINT "chat_conversation_messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
DO $$
DECLARE
	legacy record;
	conv_id uuid;
BEGIN
	FOR legacy IN
		SELECT id, user_id, question, reply, created_at, expires_at
		FROM chat_messages
	LOOP
		INSERT INTO chat_conversations (user_id, title, created_at, updated_at, expires_at)
		VALUES (
			legacy.user_id,
			CASE
				WHEN length(legacy.question) > 48 THEN substring(legacy.question from 1 for 45) || '...'
				ELSE legacy.question
			END,
			legacy.created_at,
			legacy.created_at,
			legacy.expires_at
		)
		RETURNING id INTO conv_id;

		INSERT INTO chat_conversation_messages (conversation_id, role, content, created_at)
		VALUES
			(conv_id, 'USER', legacy.question, legacy.created_at),
			(conv_id, 'ASSISTANT', legacy.reply, legacy.created_at + interval '1 millisecond');
	END LOOP;
END $$;
