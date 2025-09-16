import { describe, it, expect } from "vitest";
import { formatBytes } from "@/lib/utils";

describe("formatBytes utility", () => {
  it("formats bytes correctly", () => {
    expect(formatBytes(1024)).toBe("1 KB"); // Adjust based on your actual implementation
    expect(formatBytes(512)).toBe("512 B"); // Adjust based on your actual implementation
    expect(formatBytes(0)).toBe("0 B");
  });
});
