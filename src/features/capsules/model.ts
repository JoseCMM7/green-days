import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-f]{6}$/i);

export const capsuleInputSchema = z.object({
  title: z.string().trim().min(2, "Ponle un título a tu cápsula.").max(120),
  message: z.string().trim().min(1, "Escribe un mensaje para tu yo del futuro.").max(50_000),
  unlockDate: z.iso.date(),
  paperColor: hexColor,
  revealStyle: z.enum(["letter", "box", "book"]),
  sealStickerId: z.string().trim().max(40).optional(),
  sourceEntryId: z
    .union([z.literal(""), z.uuid()])
    .transform((value) => value || undefined),
});

export type CapsuleInput = z.infer<typeof capsuleInputSchema>;

export function unlockDateFromInput(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

export function isFutureUnlockDate(value: string, now = new Date()) {
  const unlocksAt = unlockDateFromInput(value);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12));
  return Number.isFinite(unlocksAt.getTime()) && unlocksAt > today;
}

export function canOpenCapsule(unlocksAt: Date, now = new Date()) {
  return unlocksAt.getTime() <= now.getTime();
}

export function daysUntilCapsule(unlocksAt: Date, now = new Date()) {
  return Math.max(0, Math.ceil((unlocksAt.getTime() - now.getTime()) / 86_400_000));
}
