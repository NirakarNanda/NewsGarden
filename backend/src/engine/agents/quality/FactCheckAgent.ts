import {
  BaseAgent,
  type AgentResult,
} from "../BaseAgent.js";

import type {
  AgentTask,
} from "../../../types/task.js";

import {
  AIService,
} from "../../tools/ai/AIService.js";

import {
  Article,
} from "../../../models/Article.js";

import {
  generateTextWithRetry,
  extractJson,
  aiProviderName,
} from "../../utils/ai.js";

interface FactCheckInput {

  articleId: string;
}

export interface FactCheckIssue {

  claim: string;

  issue: string;

  severity:
    | "low"
    | "medium"
    | "high";
}

interface FactCheckVerdict {

  verdict: "pass" | "flagged";

  issues: FactCheckIssue[];
}

/*
 * Fact-checks an article body against its
 * source material (summary + research).
 * Returns a verdict plus an issues list.
 *
 * On AI failure: retries once, then
 * returns verdict "unverified" with the
 * reason recorded and aiFallback: true.
 */
export class FactCheckAgent
  extends BaseAgent {

  id = "fact-check-agent";

  name = "Fact Check Agent";

  role =
    "Verify article claims against source material";

  department = "quality";

  private ai =
    new AIService();

  async execute(
    task: AgentTask
  ): Promise<AgentResult> {

    this.log(
      "Fact-checking article..."
    );

    const model =
      aiProviderName();

    let aiFallback = false;

    try {

      const input =
        task.input as FactCheckInput;

      const article =
        await Article.findOne({
          articleId:
            input.articleId,
        });

      if (!article) {

        throw new Error(
          `Article not found: ${input.articleId}`
        );
      }

      if (!article.body) {

        throw new Error(
          `Article has no body to fact-check: ${input.articleId}`
        );
      }

      let verdict: FactCheckVerdict;

      try {

        verdict =
          await this.checkFacts(
            article.title,
            article.summary,
            article.body
          );

      } catch (error) {

        this.log(
          `AI fact-check failed (${error instanceof Error ? error.message : "unknown"}). Marking unverified.`
        );

        aiFallback = true;

        verdict = {

          verdict: "flagged",

          issues: [

            {

              claim:
                "entire article",

              issue:
                "AI fact-check unavailable; claims not verified against source material",

              severity: "medium",
            },
          ],
        };
      }

      const passed =
        verdict.verdict ===
          "pass" &&
        verdict.issues.length ===
          0;

      if (passed) {

        article.status =
          "fact-checked";

        await article.save();
      }

      this.log(
        `Fact-check ${verdict.verdict}: ${verdict.issues.length} issue(s)`
      );

      return {

        success: true,

        output: {

          articleId:
            article.articleId,

          verdict:
            aiFallback
              ? "unverified"
              : verdict.verdict,

          passed,

          issues:
            verdict.issues,

          aiFallback,

          model,

          taskId: task.id,
        },
      };

    } catch (error) {

      this.log(
        "Fact-checking failed."
      );

      return {

        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      };
    }
  }

  private async checkFacts(
    title: string,
    summary: string | undefined,
    body: string
  ): Promise<FactCheckVerdict> {

    const prompt = `You are a fact-checker for a serious daily newspaper.

Check every factual claim in the ARTICLE against the SOURCE MATERIAL below. Flag anything that goes beyond the sources: invented numbers, quotes, dates, names, or causal claims.

TITLE: ${title}
SOURCE MATERIAL: ${summary ?? "No source material provided."}

ARTICLE:
${body}

Return ONLY valid JSON:
{"verdict": "pass", "issues": []}
or
{"verdict": "flagged", "issues": [{"claim": "the exact claim", "issue": "why it is unsupported", "severity": "low|medium|high"}]}

Rules:
- verdict is "pass" only with zero issues.
- severity "high" for invented facts, "medium" for unsupported specifics, "low" for hedged phrasing that still overreaches.
- Do not flag style or tone.
- No markdown, no prose.`;

    const response =
      await generateTextWithRetry(
        this.ai,
        prompt
      );

    const parsed =
      extractJson<FactCheckVerdict>(
        response
      );

    if (
      parsed.verdict !== "pass" &&
      parsed.verdict !== "flagged"
    ) {

      throw new Error(
        "Invalid fact-check verdict"
      );
    }

    if (
      !Array.isArray(
        parsed.issues
      )
    ) {

      throw new Error(
        "Invalid fact-check issues"
      );
    }

    return parsed;
  }
}
