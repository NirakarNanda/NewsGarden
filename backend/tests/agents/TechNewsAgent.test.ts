import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";

// ---------------------------------------------------------------------------
// Offline-safety: this suite must never touch the network, a real database,
// or a real AI provider. RSS reading and Mongo access are mocked below, and
// AIService is stubbed with canned responses in case the agent ever calls it.
// ---------------------------------------------------------------------------

vi.mock(
  "../../src/engine/tools/web/RssReader.js",
  () => ({
    RssReader: vi.fn(),
  })
);

vi.mock(
  "../../src/models/Article.js",
  () => ({
    Article: {
      findOne: vi.fn(),
      create: vi.fn(),
    },
  })
);

vi.mock(
  "../../src/engine/tools/ai/AIService.js",
  () => ({
    AIService: vi.fn().mockImplementation(
      // Regular function (not an arrow): constructible with `new`.
      function (this: unknown) {
        return {
          generateText: vi.fn().mockResolvedValue(
            "[mocked ai text]"
          ),
        };
      }
    ),
  })
);

import {
  RssReader,
  type RssStory,
} from "../../src/engine/tools/web/RssReader.js";

import {
  Article,
} from "../../src/models/Article.js";

import {
  TechNewsAgent,
} from "../../src/engine/agents/discovery/TechNewsAgent.js";

import type {
  AgentTask,
} from "../../src/types/task.js";

const mockReadFeeds = vi.fn();

const findOne =
  Article.findOne as unknown as Mock;

const create =
  Article.create as unknown as Mock;

function makeTask(): AgentTask {
  return {
    id: "task-1",
    agentId: "tech-news-agent",
    type: "discover-tech-news",
    status: "pending",
    createdAt: new Date(),
    retryCount: 0,
  };
}

function makeStories(): RssStory[] {
  return [
    {
      title: "Story A",
      url: "https://example.com/a",
      source: "TechCrunch",
      summary: "Summary A",
    },
    {
      title: "Story B",
      url: "https://example.com/b",
      source: "The Verge",
      summary: "Summary B",
    },
  ];
}

beforeEach(() => {
  vi.clearAllMocks();

  (
    RssReader as unknown as Mock
  ).mockImplementation(
    // Regular function (not an arrow): the agent constructs it with `new`.
    function (this: unknown) {
      return { readFeeds: mockReadFeeds };
    }
  );

  mockReadFeeds.mockResolvedValue([]);

  findOne.mockResolvedValue(null);

  create.mockImplementation(
    (doc: unknown) =>
      Promise.resolve(doc)
  );
});

describe("TechNewsAgent", () => {
  it("saves every new story and reports counts", async () => {
    mockReadFeeds.mockResolvedValue(
      makeStories()
    );

    const agent = new TechNewsAgent();

    const result = await agent.execute(
      makeTask()
    );

    expect(result.success).toBe(true);

    expect(result.output).toMatchObject({
      discovered: 2,
      newStories: 2,
      duplicateStories: 0,
      taskId: "task-1",
    });

    expect(create).toHaveBeenCalledTimes(2);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://example.com/a",
        category: "technology",
        status: "discovered",
      })
    );
  });

  it("dedupes stories by URL and skips existing articles", async () => {
    mockReadFeeds.mockResolvedValue(
      makeStories()
    );

    findOne.mockImplementation(
      (query: { url: string }) =>
        Promise.resolve(
          query.url === "https://example.com/a"
            ? { _id: "existing-id" }
            : null
        )
    );

    const agent = new TechNewsAgent();

    const result = await agent.execute(
      makeTask()
    );

    expect(result.success).toBe(true);

    expect(result.output).toMatchObject({
      discovered: 2,
      newStories: 1,
      duplicateStories: 1,
    });

    // Dedup check happens per story URL.
    expect(findOne).toHaveBeenCalledWith({
      url: "https://example.com/a",
    });

    expect(findOne).toHaveBeenCalledWith({
      url: "https://example.com/b",
    });

    // Only the unseen story is persisted.
    expect(create).toHaveBeenCalledTimes(1);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://example.com/b",
      })
    );
  });

  it("stores the fields the newspaper pipeline needs", async () => {
    const [story] = makeStories();

    if (!story) {
      throw new Error("fixture empty");
    }

    mockReadFeeds.mockResolvedValue([
      story,
    ]);

    const agent = new TechNewsAgent();

    await agent.execute(makeTask());

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: story.title,
        url: story.url,
        source: story.source,
        summary: story.summary,
        category: "technology",
        status: "discovered",
      })
    );

    const saved = create.mock.calls[0]?.[0] as
      | Record<string, unknown>
      | undefined;

    expect(typeof saved?.["articleId"]).toBe(
      "string"
    );

    expect(saved?.["discoveredAt"]).toBeInstanceOf(
      Date
    );
  });

  it("returns failure when feed reading throws", async () => {
    mockReadFeeds.mockRejectedValue(
      new Error("network down")
    );

    const agent = new TechNewsAgent();

    const result = await agent.execute(
      makeTask()
    );

    expect(result.success).toBe(false);

    expect(result.error).toBe(
      "network down"
    );

    expect(create).not.toHaveBeenCalled();
  });
});
