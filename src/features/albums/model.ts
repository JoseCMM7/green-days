import { z } from "zod";

const optionalDate = z.union([z.literal(""), z.iso.date()]).transform((value) => value || undefined);

export const albumInputSchema = z.object({
  title: z.string().trim().min(2, "Ponle un título al álbum.").max(120),
  description: z.string().trim().max(500).optional(),
  layout: z.enum(["scrapbook", "film", "storybook"]),
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  fromDate: optionalDate,
  toDate: optionalDate,
  emotionSlug: z.string().trim().max(60).optional(),
}).superRefine((value, context) => {
  if (value.fromDate && value.toDate && value.fromDate > value.toDate) {
    context.addIssue({ code: "custom", path: ["toDate"], message: "La fecha final debe ir después de la inicial." });
  }
});

export type AlbumInput = z.infer<typeof albumInputSchema>;

export function albumRuleFromInput(input: AlbumInput) {
  const rule = {
    ...(input.fromDate ? { fromDate: input.fromDate } : {}),
    ...(input.toDate ? { toDate: input.toDate } : {}),
    ...(input.emotionSlug ? { emotionSlug: input.emotionSlug } : {}),
  };
  return Object.keys(rule).length ? rule : null;
}

export function entryMatchesAlbumRule(
  entry: { entryDate: string; emotionSlug?: string | null },
  rule: { fromDate?: string; toDate?: string; emotionSlug?: string } | null,
) {
  if (!rule) return false;
  if (rule.fromDate && entry.entryDate < rule.fromDate) return false;
  if (rule.toDate && entry.entryDate > rule.toDate) return false;
  if (rule.emotionSlug && entry.emotionSlug !== rule.emotionSlug) return false;
  return true;
}
