import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";

// ---------------------------------------------------------------------------
// Offline-safety: this suite must never touch a real database. The Mongoose
// models are mocked; the agent's logic (approval gating, page ordering,
// compiled status) is exercised through the mocks.
// ---------------------------------------------------------------------------

vi.mock(
  "../../src/models/Edition.js",
  () => ({
    Edition: {
      findOne: vi.fn(),
    },
  })
);

vi.mock(
  "../../src/models/NewspaperPage.js",
  () => ({
    NewspaperPage: {
      find: vi.fn(),
    },
  })
);

vi.mock(
  "../../src/engine/events/EventBus.js",
  () => ({
    eventBus: {
      emit: vi.fn(),
    },
  })
);

import {
  Edition,
} from "../../src/models/Edition.js";

import {
  NewspaperPage,
} from "../../src/models/NewspaperPage.js";

import {
  eventBus,
} from "../../src/engine/events/EventBus.js";

import {
  NewspaperCompilerAgent,
} from "../../src/engine/agents/design/NewspaperCompilerAgent.js";

function task(
  input: unknown
) {

  return {
    id: "task-1",
    taskId: "task-1",
    agentId: "newspaper-compiler-agent",
    type: "compile-newspaper",
    input,
    status: "running",
  } as never;
}

describe("NewspaperCompilerAgent", () => {

  beforeEach(() => {

    vi.clearAllMocks();
  });

  it("compiles when every page is approved", async () => {

    const save = vi.fn();

    (Edition.findOne as Mock).mockResolvedValue({
      editionId: "ed-1",
      pageIds: [],
      status: "in-review",
      save,
    });

    (NewspaperPage.find as Mock).mockReturnValue({
      sort: vi.fn().mockResolvedValue([
        { pageId: "ed-1-page-1", pageNumber: 1, status: "approved" },
        { pageId: "ed-1-page-2", pageNumber: 2, status: "approved" },
      ]),
    });

    const agent = new NewspaperCompilerAgent();

    const result = await agent.execute(
      task({ editionId: "ed-1" })
    );

    expect(result.success).toBe(true);

    expect(
      (result.output as { status: string }).status
    ).toBe("compiled");

    expect(
      (result.output as { pageCount: number }).pageCount
    ).toBe(2);

    expect(save).toHaveBeenCalled();

    expect(eventBus.emit).toHaveBeenCalledWith(
      "NEWSPAPER_COMPILED",
      expect.objectContaining({ editionId: "ed-1" })
    );
  });

  it("refuses when a page is not approved", async () => {

    (Edition.findOne as Mock).mockResolvedValue({
      editionId: "ed-1",
      status: "in-review",
      save: vi.fn(),
    });

    (NewspaperPage.find as Mock).mockReturnValue({
      sort: vi.fn().mockResolvedValue([
        { pageId: "ed-1-page-1", pageNumber: 1, status: "approved" },
        { pageId: "ed-1-page-2", pageNumber: 2, status: "draft" },
      ]),
    });

    const agent = new NewspaperCompilerAgent();

    const result = await agent.execute(
      task({ editionId: "ed-1" })
    );

    expect(result.success).toBe(false);

    expect(result.error).toMatch(/not approved yet/);
  });

  it("fails when the edition has no pages", async () => {

    (Edition.findOne as Mock).mockResolvedValue({
      editionId: "ed-1",
      status: "in-review",
      save: vi.fn(),
    });

    (NewspaperPage.find as Mock).mockReturnValue({
      sort: vi.fn().mockResolvedValue([]),
    });

    const agent = new NewspaperCompilerAgent();

    const result = await agent.execute(
      task({ editionId: "ed-1" })
    );

    expect(result.success).toBe(false);

    expect(result.error).toMatch(/no pages/);
  });

  it("fails when the edition does not exist", async () => {

    (Edition.findOne as Mock).mockResolvedValue(null);

    const agent = new NewspaperCompilerAgent();

    const result = await agent.execute(
      task({ editionId: "missing" })
    );

    expect(result.success).toBe(false);

    expect(result.error).toMatch(/not found/);
  });
});
