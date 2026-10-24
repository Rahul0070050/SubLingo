import { describe, it, expect } from "vitest";

/**
 * Pure helper function mirroring the skip accumulator calculation
 */
function calculateAccumulatedSkip(
  baseTime: number,
  accumulatedDelta: number,
  duration: number
): number {
  return Math.max(0, Math.min(duration, baseTime + accumulatedDelta));
}

describe("Multi-Click Skip Accumulation Logic", () => {
  it("accumulates forward clicks correctly", () => {
    const baseTime = 10;
    const duration = 120;

    let delta = 0;
    delta += 3; // 1st click
    expect(calculateAccumulatedSkip(baseTime, delta, duration)).toBe(13);

    delta += 3; // 2nd click
    expect(calculateAccumulatedSkip(baseTime, delta, duration)).toBe(16);

    delta += 3; // 3rd click
    expect(calculateAccumulatedSkip(baseTime, delta, duration)).toBe(19);

    delta += 3; // 4th click
    expect(calculateAccumulatedSkip(baseTime, delta, duration)).toBe(22);
  });

  it("accumulates backward clicks correctly", () => {
    const baseTime = 30;
    const duration = 120;

    let delta = 0;
    delta += -3; // 1st click
    expect(calculateAccumulatedSkip(baseTime, delta, duration)).toBe(27);

    delta += -3; // 2nd click
    expect(calculateAccumulatedSkip(baseTime, delta, duration)).toBe(24);

    delta += -3; // 3rd click
    expect(calculateAccumulatedSkip(baseTime, delta, duration)).toBe(21);
  });

  it("clamps to 0 when skipping backward past beginning", () => {
    const baseTime = 5;
    const duration = 100;

    let delta = 0;
    delta += -3; // 2s
    delta += -3; // -1s -> clamped to 0
    expect(calculateAccumulatedSkip(baseTime, delta, duration)).toBe(0);
  });

  it("clamps to duration when skipping forward past end", () => {
    const baseTime = 95;
    const duration = 100;

    let delta = 0;
    delta += 3; // 98s
    delta += 3; // 101s -> clamped to 100
    expect(calculateAccumulatedSkip(baseTime, delta, duration)).toBe(100);
  });
});
