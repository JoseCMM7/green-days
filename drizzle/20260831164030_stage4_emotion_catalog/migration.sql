INSERT INTO "emotions" ("id", "user_id", "slug", "name", "color", "icon")
VALUES
  ('41000000-0000-4000-8000-000000000001', NULL, 'sereno', 'Sereno', '#9eaa7b', '😌'),
  ('41000000-0000-4000-8000-000000000002', NULL, 'feliz', 'Feliz', '#e6b93f', '😊'),
  ('41000000-0000-4000-8000-000000000003', NULL, 'sensible', 'Sensible', '#c7a5b7', '🥹'),
  ('41000000-0000-4000-8000-000000000004', NULL, 'cansado', 'Cansado', '#a8a39b', '😮‍💨'),
  ('41000000-0000-4000-8000-000000000005', NULL, 'triste', 'Triste', '#86a4b2', '😔'),
  ('41000000-0000-4000-8000-000000000006', NULL, 'inquieto', 'Inquieto', '#d58c68', '😟')
ON CONFLICT ("id") DO UPDATE SET
  "slug" = EXCLUDED."slug",
  "name" = EXCLUDED."name",
  "color" = EXCLUDED."color",
  "icon" = EXCLUDED."icon";
