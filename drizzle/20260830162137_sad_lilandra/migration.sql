CREATE TYPE "album_visibility" AS ENUM('private', 'shared_link');--> statement-breakpoint
CREATE TYPE "capsule_status" AS ENUM('draft', 'sealed', 'unlocked');--> statement-breakpoint
CREATE TYPE "entry_content_status" AS ENUM('pending', 'ready', 'sync_failed');--> statement-breakpoint
CREATE TYPE "media_kind" AS ENUM('photo', 'audio');--> statement-breakpoint
CREATE TYPE "media_status" AS ENUM('pending', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "outbox_status" AS ENUM('pending', 'processing', 'processed', 'failed');--> statement-breakpoint
CREATE TABLE "album_entries" (
	"album_id" uuid,
	"entry_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "album_entries_pkey" PRIMARY KEY("album_id","entry_id")
);
--> statement-breakpoint
CREATE TABLE "albums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"cover_media_id" uuid,
	"visibility" "album_visibility" DEFAULT 'private'::"album_visibility" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capsule_media" (
	"capsule_id" uuid,
	"media_id" uuid,
	CONSTRAINT "capsule_media_pkey" PRIMARY KEY("capsule_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "time_capsules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"source_entry_id" uuid,
	"title" text NOT NULL,
	"status" "capsule_status" DEFAULT 'draft'::"capsule_status" NOT NULL,
	"unlocks_at" timestamp with time zone NOT NULL,
	"sealed_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"icon" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entry_emotions" (
	"entry_id" uuid,
	"emotion_id" uuid,
	"intensity" integer DEFAULT 3 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	CONSTRAINT "entry_emotions_pkey" PRIMARY KEY("entry_id","emotion_id")
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"entry_date" date NOT NULL,
	"title" text,
	"day_color" text,
	"content_status" "entry_content_status" DEFAULT 'pending'::"entry_content_status" NOT NULL,
	"current_revision" integer DEFAULT 1 NOT NULL,
	"can_resurface" boolean DEFAULT true NOT NULL,
	"is_sensitive" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "entry_media" (
	"entry_id" uuid,
	"media_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"alt_text" text,
	CONSTRAINT "entry_media_pkey" PRIMARY KEY("entry_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"kind" "media_kind" NOT NULL,
	"status" "media_status" DEFAULT 'pending'::"media_status" NOT NULL,
	"bucket" text DEFAULT 'journal-media' NOT NULL,
	"storage_path" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" bigint NOT NULL,
	"width" integer,
	"height" integer,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"aggregate_type" text NOT NULL,
	"aggregate_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "outbox_status" DEFAULT 'pending'::"outbox_status" NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY,
	"default_book_theme" text DEFAULT 'warm-paper' NOT NULL,
	"week_starts_on" integer DEFAULT 1 NOT NULL,
	"reduced_motion" boolean DEFAULT false NOT NULL,
	"resurfacing_enabled" boolean DEFAULT true NOT NULL,
	"reminder_settings" jsonb DEFAULT '{"enabled":false}' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY,
	"display_name" text NOT NULL,
	"avatar_path" text,
	"time_zone" text DEFAULT 'America/Mexico_City' NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entry_tags" (
	"entry_id" uuid,
	"tag_id" uuid,
	CONSTRAINT "entry_tags_pkey" PRIMARY KEY("entry_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "albums_user_updated_idx" ON "albums" ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "time_capsules_user_unlock_idx" ON "time_capsules" ("user_id","unlocks_at");--> statement-breakpoint
CREATE INDEX "emotions_user_idx" ON "emotions" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "journal_entries_user_date_unique" ON "journal_entries" ("user_id","entry_date");--> statement-breakpoint
CREATE INDEX "journal_entries_user_updated_idx" ON "journal_entries" ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "media_assets_user_created_idx" ON "media_assets" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "outbox_events_pending_idx" ON "outbox_events" ("status","available_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_name_unique" ON "tags" ("user_id","name");--> statement-breakpoint
CREATE INDEX "tags_user_idx" ON "tags" ("user_id");--> statement-breakpoint
ALTER TABLE "album_entries" ADD CONSTRAINT "album_entries_album_id_albums_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "album_entries" ADD CONSTRAINT "album_entries_entry_id_journal_entries_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_cover_media_id_media_assets_id_fkey" FOREIGN KEY ("cover_media_id") REFERENCES "media_assets"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "capsule_media" ADD CONSTRAINT "capsule_media_capsule_id_time_capsules_id_fkey" FOREIGN KEY ("capsule_id") REFERENCES "time_capsules"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "capsule_media" ADD CONSTRAINT "capsule_media_media_id_media_assets_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "time_capsules" ADD CONSTRAINT "time_capsules_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "time_capsules" ADD CONSTRAINT "time_capsules_source_entry_id_journal_entries_id_fkey" FOREIGN KEY ("source_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "emotions" ADD CONSTRAINT "emotions_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "entry_emotions" ADD CONSTRAINT "entry_emotions_entry_id_journal_entries_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "entry_emotions" ADD CONSTRAINT "entry_emotions_emotion_id_emotions_id_fkey" FOREIGN KEY ("emotion_id") REFERENCES "emotions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "entry_media" ADD CONSTRAINT "entry_media_entry_id_journal_entries_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "entry_media" ADD CONSTRAINT "entry_media_media_id_media_assets_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "entry_tags" ADD CONSTRAINT "entry_tags_entry_id_journal_entries_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "entry_tags" ADD CONSTRAINT "entry_tags_tag_id_tags_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_profiles_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE;