import "server-only";

import { getMongoCollections } from "./collections";
import { entryDocumentSchema, type EntryDocument } from "./schemas";

export async function findEntryDocument(entryId: string, userId: string) {
  const { entryDocuments } = getMongoCollections();
  const document = await entryDocuments.findOne({ _id: entryId, userId });

  return document ? entryDocumentSchema.parse(document) : null;
}

export async function insertEntryDocument(input: EntryDocument) {
  const document = entryDocumentSchema.parse(input);
  const { entryDocuments } = getMongoCollections();

  await entryDocuments.insertOne(document);
  return document;
}

export async function replaceEntryDocument(input: EntryDocument, expectedRevision: number) {
  const document = entryDocumentSchema.parse(input);

  if (document.revision !== expectedRevision + 1) {
    throw new Error("La nueva revisión debe avanzar exactamente una versión.");
  }

  const { _id, ...replacement } = document;
  const { entryDocuments, entryVersions } = getMongoCollections();

  const current = await entryDocuments.findOne({
    _id,
    userId: document.userId,
    revision: expectedRevision,
  });

  if (!current) {
    throw new Error("La entrada cambió en otro lugar. Recarga el libro antes de guardar.");
  }

  await entryVersions.insertOne({
    _id: crypto.randomUUID(),
    entryId: current._id,
    userId: current.userId,
    revision: current.revision,
    schemaVersion: current.schemaVersion,
    book: current.book,
    savedAt: new Date(),
  });

  const result = await entryDocuments.replaceOne(
    { _id, userId: document.userId, revision: expectedRevision },
    replacement,
  );

  if (result.modifiedCount !== 1) {
    throw new Error("No fue posible guardar la nueva revisión del libro.");
  }

  return document;
}
