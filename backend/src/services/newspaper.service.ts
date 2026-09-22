import { BrainAgent } from "../engine/brain/BrainAgent.js";

import { NewspaperPage } from "../models/NewspaperPage.js";

import { AppError } from "../utils/errors.js";

/*
 * Approve a single page of an edition. The
 * user reviews each page on the edition
 * view and approves them one by one; once
 * every page is approved, the "Create full
 * newspaper" button compiles the whole paper.
 */
export async function approvePageService(
  editionId: string,
  pageNumber: number
): Promise<{
  pageId: string;
  pageNumber: number;
  status: string;
  approvedPages: number;
  totalPages: number;
}> {

  const page = await NewspaperPage.findOne({
    editionId,
    pageNumber,
  });

  if (!page) {
    throw AppError.notFound(
      `Page ${pageNumber} not found in edition ${editionId}`
    );
  }

  page.status = "approved";
  page.approvedAt = new Date();
  await page.save();

  const totalPages = await NewspaperPage.countDocuments({ editionId });

  const approvedPages = await NewspaperPage.countDocuments({
    editionId,
    status: "approved",
  });

  return {
    pageId: page.pageId,
    pageNumber: page.pageNumber,
    status: page.status,
    approvedPages,
    totalPages,
  };
}

/*
 * Run the newspaper-compiler agent: verifies
 * every page is human-approved, then
 * assembles the whole newspaper (status
 * "compiled"). Still not published —
 * publishing needs the separate human
 * approve + publish actions.
 */
export async function compileEditionService(
  editionId: string
): Promise<{
  editionId: string;
  pageCount: number;
  pageIds: string[];
  status: string;
}> {

  const brain = new BrainAgent();

  const task = await brain.createTask(
    "newspaper-compiler-agent",
    "compile-newspaper",
    { editionId }
  );

  const result = await brain.runTask(task.taskId);

  if (!result.success) {
    throw AppError.badRequest(
      result.error ?? "Newspaper compilation failed"
    );
  }

  const output = result.output as {
    pageCount: number;
    pageIds: string[];
    status: string;
  };

  return {
    editionId,
    pageCount: output.pageCount,
    pageIds: output.pageIds,
    status: output.status,
  };
}
