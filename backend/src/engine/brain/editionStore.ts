import {
  Edition,
  type IEdition,
} from "../../models/Edition.js";

export type EditionStatus =
  IEdition["status"];

export interface EditionRecord {

  editionId: string;

  title: string;

  date: Date;

  status: EditionStatus;

  articleIds: string[];

  pageIds: string[];

  stagesCompleted: string[];

  createdAt: Date;

  updatedAt: Date;
}

export interface EditionStore {

  create(
    record: Omit<
      EditionRecord,
      "createdAt" | "updatedAt"
    >
  ): Promise<EditionRecord>;

  findById(
    editionId: string
  ): Promise<EditionRecord | null>;

  update(
    editionId: string,
    patch: Partial<EditionRecord>
  ): Promise<EditionRecord | null>;
}

function toRecord(
  doc: IEdition
): EditionRecord {

  // timestamps: true adds these at
  // runtime; the interface omits them.
  const timed =
    doc as unknown as {
      createdAt?: Date;
      updatedAt?: Date;
    };

  return {

    editionId:
      doc.editionId,

    title: doc.title,

    date: doc.date,

    status: doc.status,

    articleIds: [
      ...doc.articleIds,
    ],

    pageIds: [
      ...doc.pageIds,
    ],

    stagesCompleted: [
      ...(doc.stagesCompleted ?? []),
    ],

    createdAt:
      timed.createdAt ??
      new Date(),

    updatedAt:
      timed.updatedAt ??
      new Date(),
  };
}

class MongoEditionStore
  implements EditionStore {

  async create(
    record: Omit<
      EditionRecord,
      "createdAt" | "updatedAt"
    >
  ): Promise<EditionRecord> {

    const doc =
      await Edition.create(
        record
      );

    return toRecord(doc);
  }

  async findById(
    editionId: string
  ): Promise<EditionRecord | null> {

    const doc =
      await Edition.findOne({
        editionId,
      });

    return doc
      ? toRecord(doc)
      : null;
  }

  async update(
    editionId: string,
    patch: Partial<EditionRecord>
  ): Promise<EditionRecord | null> {

    const doc =
      await Edition.findOneAndUpdate(

        { editionId },

        {
          ...patch,

          updatedAt:
            new Date(),
        },

        { new: true }
      );

    return doc
      ? toRecord(doc)
      : null;
  }
}

let cached: EditionStore | null =
  null;

export async function getEditionStore(): Promise<EditionStore> {

  if (!cached) {

    cached =
      new MongoEditionStore();
  }

  return cached;
}
