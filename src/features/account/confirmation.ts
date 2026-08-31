export const deletionPhrase = "ELIMINAR";

export function isDeletionConfirmed(value: unknown) {
  return typeof value === "string" && value.trim() === deletionPhrase;
}

