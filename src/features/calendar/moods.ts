export const moodCatalog = [
  { slug: "sereno", name: "Sereno", color: "#9eaa7b", icon: "😌" },
  { slug: "feliz", name: "Feliz", color: "#e6b93f", icon: "😊" },
  { slug: "sensible", name: "Sensible", color: "#c7a5b7", icon: "🥹" },
  { slug: "cansado", name: "Cansado", color: "#a8a39b", icon: "😮‍💨" },
  { slug: "triste", name: "Triste", color: "#86a4b2", icon: "😔" },
  { slug: "inquieto", name: "Inquieto", color: "#d58c68", icon: "😟" },
] as const;

export type MoodSlug = (typeof moodCatalog)[number]["slug"];
export type MoodOption = (typeof moodCatalog)[number];
export const moodSlugs = moodCatalog.map((mood) => mood.slug) as [MoodSlug, ...MoodSlug[]];

export function findMood(slug: string | null | undefined) {
  return moodCatalog.find((mood) => mood.slug === slug) ?? null;
}
