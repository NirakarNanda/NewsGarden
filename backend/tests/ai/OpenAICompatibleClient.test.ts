import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { OpenAICompatibleClient } from "../../src/engine/tools/ai/OpenAICompatibleClient.js";
import { AIService } from "../../src/engine/tools/ai/AIService.js";
import { LocalModelClient } from "../../src/engine/tools/ai/LocalModelClient.js";
import { GeminiClient } from "../../src/engine/tools/ai/GeminiClient.js";

// ---------------------------------------------------------------------------
// Offline-safety: this suite must never touch the network.
// fetch is stubbed per-test; the client under test only
// ever talks through fetch.
// ---------------------------------------------------------------------------

function setOpenAIEnv(): void {
  process.env.AI_BASE_URL = "https://api.groq.com/openai/v1";
  process.env.AI_API_KEY = "test-key";
  process.env.AI_MODEL = "llama-3.3-70b-versatile";
}

function clearOpenAIEnv(): void {
  delete process.env.AI_BASE_URL;
  delete process.env.AI_API_KEY;
  delete process.env.AI_MODEL;
}

function okResponse(content: string): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content } }],
    }),
    text: async () => "",
  } as Response;
}

function errorResponse(status: number, body: string): Response {
  return {
    ok: false,
    status,
    json: async () => ({}),
    text: async () => body,
  } as Response;
}

describe("OpenAICompatibleClient", () => {
  beforeEach(() => {
    setOpenAIEnv();
  });

  afterEach(() => {
    clearOpenAIEnv();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("posts an OpenAI chat-completions request and returns trimmed text", async () => {
    const fetchMock = vi.fn(async () => okResponse("  hello world  "));
    vi.stubGlobal("fetch", fetchMock);

    const client = new OpenAICompatibleClient();
    const text = await client.generateText("Say hi");

    expect(text).toBe("hello world");
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(
      "https://api.groq.com/openai/v1/chat/completions"
    );
    expect(init.method).toBe("POST");
    expect(
      (init.headers as Record<string, string>)["Authorization"]
    ).toBe("Bearer test-key");

    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("llama-3.3-70b-versatile");
    expect(body.stream).toBe(false);
    expect(body.messages).toEqual([
      { role: "user", content: "Say hi" },
    ]);
  });

  it("strips trailing slashes from the base URL", async () => {
    process.env.AI_BASE_URL =
      "https://openrouter.ai/api/v1///";
    const fetchMock = vi.fn(async () => okResponse("ok"));
    vi.stubGlobal("fetch", fetchMock);

    await new OpenAICompatibleClient().generateText("hi");

    const [url] = fetchMock.mock.calls[0] as unknown as [string];
    expect(url).toBe(
      "https://openrouter.ai/api/v1/chat/completions"
    );
  });

  it("throws a clear error when AI_BASE_URL is missing", async () => {
    delete process.env.AI_BASE_URL;

    await expect(
      new OpenAICompatibleClient().generateText("hi")
    ).rejects.toThrow("AI_BASE_URL is not set");
  });

  it("throws a clear error when AI_API_KEY is missing", async () => {
    delete process.env.AI_API_KEY;

    await expect(
      new OpenAICompatibleClient().generateText("hi")
    ).rejects.toThrow("AI_API_KEY is not set");
  });

  it("throws a clear error when AI_MODEL is missing", async () => {
    delete process.env.AI_MODEL;

    await expect(
      new OpenAICompatibleClient().generateText("hi")
    ).rejects.toThrow("AI_MODEL is not set");
  });

  it("surfaces 401 as a rejected-key error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        errorResponse(401, "invalid api key")
      )
    );

    await expect(
      new OpenAICompatibleClient().generateText("hi")
    ).rejects.toThrow(/rejected the API key.*401/);
  });

  it("surfaces 429 as a rate-limit error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        errorResponse(429, "rate limit exceeded")
      )
    );

    await expect(
      new OpenAICompatibleClient().generateText("hi")
    ).rejects.toThrow(/rate limit exceeded.*429/);
  });

  it("throws on an empty model response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => okResponse("   "))
    );

    await expect(
      new OpenAICompatibleClient().generateText("hi")
    ).rejects.toThrow("empty response");
  });

  it("throws on a provider-level error payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          error: { message: "model overloaded" },
        }),
        text: async () => "",
      }) as Response)
    );

    await expect(
      new OpenAICompatibleClient().generateText("hi")
    ).rejects.toThrow("model overloaded");
  });

  it("wraps network failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("socket hang up");
      })
    );

    await expect(
      new OpenAICompatibleClient().generateText("hi")
    ).rejects.toThrow(/AI provider request failed/);
  });
});

describe("AIService provider selection", () => {
  const OLD_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...OLD_ENV };
  });

  it("selects OpenAICompatibleClient for AI_PROVIDER=openai", () => {
    process.env.AI_PROVIDER = "openai";
    const service = new AIService();
    expect(
      (service as unknown as { client: unknown }).client
    ).toBeInstanceOf(OpenAICompatibleClient);
  });

  it("still selects LocalModelClient by default", () => {
    delete process.env.AI_PROVIDER;
    const service = new AIService();
    expect(
      (service as unknown as { client: unknown }).client
    ).toBeInstanceOf(LocalModelClient);
  });

  it("still selects GeminiClient for AI_PROVIDER=gemini", () => {
    process.env.AI_PROVIDER = "gemini";
    const service = new AIService();
    expect(
      (service as unknown as { client: unknown }).client
    ).toBeInstanceOf(GeminiClient);
  });
});
