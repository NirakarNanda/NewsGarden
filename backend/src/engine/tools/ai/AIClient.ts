export interface AIClient {
  generateText(prompt: string): Promise<string>;
}