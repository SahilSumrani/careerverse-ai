import { describe, expect, it } from "vitest";
import { isCareerChatOffTopic, CHAT_INPUT_MAX_CHARS } from "@/lib/ai/chat-guard";

describe("career chat guard", () => {
  it("allows career questions", () => {
    expect(isCareerChatOffTopic("What are my skill gaps?")).toBe(false);
    expect(isCareerChatOffTopic("How do I improve my resume for internships?")).toBe(false);
  });

  it("refuses encyclopedic / off-topic", () => {
    expect(isCareerChatOffTopic("What is the capital of France?")).toBe(true);
    expect(isCareerChatOffTopic("Write me a poem about cats")).toBe(true);
    expect(isCareerChatOffTopic("What's the weather today?")).toBe(true);
  });

  it("refuses long messages with no career signal", () => {
    const long =
      "Please help me understand quantum chromodynamics in detail including all force carriers and symmetry groups for my physics class assignment tonight.";
    expect(long.length).toBeGreaterThanOrEqual(80);
    expect(isCareerChatOffTopic(long)).toBe(true);
  });

  it("keeps a hard input cap constant", () => {
    expect(CHAT_INPUT_MAX_CHARS).toBe(300);
  });
});
