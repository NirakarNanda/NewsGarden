import {
  Edition,
  type IEdition,
} from "../models/Edition.js";

import {
  NewspaperPage,
  type INewspaperPage,
} from "../models/NewspaperPage.js";

export interface CreateEditionInput
  extends Pick<
    IEdition,
    "editionId" | "title" | "date"
  > {

  status?: IEdition["status"];

  pageIds?: string[];

  articleIds?: string[];
}

export interface CreatePageInput
  extends Pick<
    INewspaperPage,
    "pageId" | "editionId" | "pageNumber"
  > {

  slots?: INewspaperPage["slots"];
}

export async function findEditionById(
  editionId: string
) {

  return Edition.findOne({ editionId }).lean();
}

export async function listEditions(
  limit: number
) {

  return Edition.find()
    .sort({ date: -1 })
    .limit(limit)
    .lean();
}

export async function createEdition(
  input: CreateEditionInput
) {

  return Edition.create(input);
}

export async function setEditionStatus(
  editionId: string,
  status: IEdition["status"]
) {

  return Edition.findOneAndUpdate(
    { editionId },
    { status },
    { new: true }
  ).lean();
}

export async function setEditionArticles(
  editionId: string,
  articleIds: string[]
) {

  return Edition.findOneAndUpdate(
    { editionId },
    { articleIds },
    { new: true }
  ).lean();
}

export async function setEditionPages(
  editionId: string,
  pageIds: string[]
) {

  return Edition.findOneAndUpdate(
    { editionId },
    { pageIds },
    { new: true }
  ).lean();
}

export async function findPagesByEditionId(
  editionId: string
) {

  return NewspaperPage.find({ editionId })
    .sort({ pageNumber: 1 })
    .lean();
}

// Batch lookup for several editions in one query.
export async function findPagesByEditionIds(
  editionIds: string[]
) {

  if (editionIds.length === 0) {

    return [];
  }

  return NewspaperPage.find({
    editionId: { $in: editionIds },
  })
    .sort({ editionId: 1, pageNumber: 1 })
    .lean();
}

export async function createPage(
  input: CreatePageInput
) {

  return NewspaperPage.create(input);
}
