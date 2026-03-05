import {
  formatDuration,
  formatCoinAmount,
  progressPercentage,
} from "@/utils/formatters";

describe("formatDuration", () => {
  it("formats seconds to mm:ss", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(120)).toBe("2:00");
    expect(formatDuration(3661)).toBe("61:01");
  });
});

describe("formatCoinAmount", () => {
  it("formats small numbers as-is", () => {
    expect(formatCoinAmount(0)).toBe("0");
    expect(formatCoinAmount(999)).toBe("999");
  });

  it("formats thousands with K suffix", () => {
    expect(formatCoinAmount(1000)).toBe("1.0K");
    expect(formatCoinAmount(1500)).toBe("1.5K");
    expect(formatCoinAmount(10000)).toBe("10.0K");
  });
});

describe("progressPercentage", () => {
  it("calculates percentage correctly", () => {
    expect(progressPercentage(50, 100)).toBe(50);
    expect(progressPercentage(0, 100)).toBe(0);
    expect(progressPercentage(100, 100)).toBe(100);
  });

  it("handles zero duration", () => {
    expect(progressPercentage(50, 0)).toBe(0);
  });

  it("caps at 100%", () => {
    expect(progressPercentage(150, 100)).toBe(100);
  });
});
