import "server-only";

import {
  MongoNetworkError,
  MongoServerSelectionError,
  MongoTopologyClosedError,
} from "mongodb";
import { resetMongoConnection } from "./client";
import { getMongoCollections } from "./collections";
import { entryDocumentSchema, entryVersionSchema, type EntryDocument } from "./schemas";

function isTransientConnectionError(error: unknown) {
  return (
    error instanceof MongoTopologyClosedError
    || error instanceof MongoServerSelectionError
    || error instanceof MongoNetworkError
  );
}

export async function findEntryDocument(entryId: string, userId: string) {
  async function find() {
    const { entryDocuments } = await getMongoCollections();
    return entryDocuments.findOne({ _id: entryId, userId });
  }

  let document;
  try {
    document = await find();
  } catch (error) {
    if (!isTransientConnectionError(error)) throw error;
    await resetMongoConnection();
    document = await find();
  }

  return document ? entryDocumentSchema.parse(document) : null;
}

export async function insertEntryDocument(input: EntryDocument) {
  const document = entryDocumentSchema.parse(input);
  const { entryDocuments } = await getMongoCollections();

  await entryDocuments.insertOne(document);
  return document;
}

export async function replaceEntryDocument(input: EntryDocument, expectedRevision: number) {
  const document = entryDocumentSchema.parse(input);

  if (document.revision !== expectedRevision + 1) {
    throw new Error("La nueva revisión debe avanzar exactamente una versión.");
  }

  const { _id, ...replacement } = document;
  const { entryDocuments, entryVersions } = await getMongoCollections();

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

export async function listEntryVersions(entryId: string, userId: string, limit = 30) {
  const { entryVersions } = await getMongoCollections();
  const versions = await entryVersions.find({ entryId, userId }).sort({ revision: -1 }).limit(limit).toArray();
  return versions.map((version) => entryVersionSchema.parse(version));
}

export async function findEntryVersion(entryId: string, userId: string, revision: number) {
  const { entryVersions } = await getMongoCollections();
  const version = await entryVersions.findOne({ entryId, userId, revision });
  return version ? entryVersionSchema.parse(version) : null;
}
