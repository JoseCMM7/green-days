import { pgEnum } from "drizzle-orm/pg-core";

export const entryContentStatus = pgEnum("entry_content_status", [
  "pending",
  "ready",
  "sync_failed",
]);

export const mediaKind = pgEnum("media_kind", ["photo", "audio"]);
export const mediaStatus = pgEnum("media_status", [
  "pending",
  "ready",
  "failed",
]);

export const capsuleStatus = pgEnum("capsule_status", [
  "draft",
  "sealed",
  "unlocked",
]);

export const albumVisibility = pgEnum("album_visibility", [
  "private",
  "shared_link",
]);

export const outboxStatus = pgEnum("outbox_status", [
  "pending",
  "processing",
  "processed",
  "failed",
]);
