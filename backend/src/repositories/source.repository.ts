import {
  Source,
  type ISource,
} from "../models/Source.js";

export interface CreateSourceInput
  extends Pick<
    ISource,
    "sourceId" | "name" | "url" | "category"
  > {

  enabled?: boolean;
}

export async function listSources() {

  return Source.find()
    .sort({ name: 1 })
    .lean();
}

export async function listEnabledSources() {

  return Source.find({ enabled: true })
    .sort({ name: 1 })
    .lean();
}

export async function findSourceById(
  sourceId: string
) {

  return Source.findOne({ sourceId }).lean();
}

export async function createSource(
  input: CreateSourceInput
) {

  return Source.create(input);
}

export async function setSourceEnabled(
  sourceId: string,
  enabled: boolean
) {

  return Source.findOneAndUpdate(
    { sourceId },
    { enabled },
    { new: true }
  ).lean();
}
