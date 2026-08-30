ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_id_auth_users_id_fkey"
  FOREIGN KEY ("id") REFERENCES "auth"."users"("id")
  ON DELETE CASCADE;

ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "journal_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "emotions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "entry_emotions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "entry_tags" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "media_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "entry_media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "time_capsules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "capsule_media" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "albums" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "album_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "outbox_events" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM "anon";

GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "profiles",
  "journal_entries",
  "emotions",
  "entry_emotions",
  "tags",
  "entry_tags",
  "media_assets",
  "entry_media",
  "time_capsules",
  "capsule_media",
  "albums",
  "album_entries",
  "user_preferences"
TO "authenticated";

CREATE POLICY "profiles_select_own" ON "profiles"
  FOR SELECT TO "authenticated"
  USING ((SELECT auth.uid()) = "id");
CREATE POLICY "profiles_update_own" ON "profiles"
  FOR UPDATE TO "authenticated"
  USING ((SELECT auth.uid()) = "id")
  WITH CHECK ((SELECT auth.uid()) = "id");

CREATE POLICY "journal_entries_own" ON "journal_entries"
  FOR ALL TO "authenticated"
  USING ((SELECT auth.uid()) = "user_id")
  WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "emotions_read_available" ON "emotions"
  FOR SELECT TO "authenticated"
  USING ("user_id" IS NULL OR (SELECT auth.uid()) = "user_id");
CREATE POLICY "emotions_write_own" ON "emotions"
  FOR ALL TO "authenticated"
  USING ((SELECT auth.uid()) = "user_id")
  WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "entry_emotions_own" ON "entry_emotions"
  FOR ALL TO "authenticated"
  USING (EXISTS (
    SELECT 1 FROM "journal_entries"
    WHERE "journal_entries"."id" = "entry_emotions"."entry_id"
      AND "journal_entries"."user_id" = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "journal_entries"
    WHERE "journal_entries"."id" = "entry_emotions"."entry_id"
      AND "journal_entries"."user_id" = (SELECT auth.uid())
  ));

CREATE POLICY "tags_own" ON "tags"
  FOR ALL TO "authenticated"
  USING ((SELECT auth.uid()) = "user_id")
  WITH CHECK ((SELECT auth.uid()) = "user_id");
CREATE POLICY "entry_tags_own" ON "entry_tags"
  FOR ALL TO "authenticated"
  USING (EXISTS (
    SELECT 1 FROM "journal_entries"
    WHERE "journal_entries"."id" = "entry_tags"."entry_id"
      AND "journal_entries"."user_id" = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "journal_entries"
    WHERE "journal_entries"."id" = "entry_tags"."entry_id"
      AND "journal_entries"."user_id" = (SELECT auth.uid())
  ));

CREATE POLICY "media_assets_own" ON "media_assets"
  FOR ALL TO "authenticated"
  USING ((SELECT auth.uid()) = "user_id")
  WITH CHECK ((SELECT auth.uid()) = "user_id");
CREATE POLICY "entry_media_own" ON "entry_media"
  FOR ALL TO "authenticated"
  USING (EXISTS (
    SELECT 1 FROM "journal_entries"
    WHERE "journal_entries"."id" = "entry_media"."entry_id"
      AND "journal_entries"."user_id" = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "journal_entries"
    WHERE "journal_entries"."id" = "entry_media"."entry_id"
      AND "journal_entries"."user_id" = (SELECT auth.uid())
  ));

CREATE POLICY "time_capsules_own" ON "time_capsules"
  FOR ALL TO "authenticated"
  USING ((SELECT auth.uid()) = "user_id")
  WITH CHECK ((SELECT auth.uid()) = "user_id");
CREATE POLICY "capsule_media_own" ON "capsule_media"
  FOR ALL TO "authenticated"
  USING (EXISTS (
    SELECT 1 FROM "time_capsules"
    WHERE "time_capsules"."id" = "capsule_media"."capsule_id"
      AND "time_capsules"."user_id" = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "time_capsules"
    WHERE "time_capsules"."id" = "capsule_media"."capsule_id"
      AND "time_capsules"."user_id" = (SELECT auth.uid())
  ));

CREATE POLICY "albums_own" ON "albums"
  FOR ALL TO "authenticated"
  USING ((SELECT auth.uid()) = "user_id")
  WITH CHECK ((SELECT auth.uid()) = "user_id");
CREATE POLICY "album_entries_own" ON "album_entries"
  FOR ALL TO "authenticated"
  USING (EXISTS (
    SELECT 1 FROM "albums"
    WHERE "albums"."id" = "album_entries"."album_id"
      AND "albums"."user_id" = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "albums"
    WHERE "albums"."id" = "album_entries"."album_id"
      AND "albums"."user_id" = (SELECT auth.uid())
  ));

CREATE POLICY "user_preferences_own" ON "user_preferences"
  FOR ALL TO "authenticated"
  USING ((SELECT auth.uid()) = "user_id")
  WITH CHECK ((SELECT auth.uid()) = "user_id");

REVOKE ALL ON TABLE "outbox_events" FROM "authenticated";
