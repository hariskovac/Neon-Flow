// import { describe, expect, it } from "vitest";

// import type { EnemyType, WavePerformance } from "../types/game";
// import { classifyPerformance, resolveKillRatio } from "../dda/PerformanceEvaluator";

// interface WaveOverrides {
//   kills?: number;
//   livesLost?: number;
//   enemiesRemaining?: number;
//   enemiesSpawned?: number;
// }

// function wave(overrides: WaveOverrides = {}): WavePerformance {
//   const kills = overrides.kills ?? 0;
//   const killsByType: Record<EnemyType, number> = {
//     chaser: kills,
//     dodger: 0,
//     dasher: 0,
//   };

//   return {
//     waveNumber: 1,
//     killsByType,
//     livesLost: overrides.livesLost ?? 0,
//     shieldHitsAbsorbed: 0,
//     enemiesRemaining: overrides.enemiesRemaining ?? 6,
//     enemiesSpawned: overrides.enemiesSpawned ?? 20,
//     shotsFired: 100,
//     shotsHit: 40,
//     durationMs: 40000,
//     powerUpsSpawned: 0,
//     powerUpsCollected: 0,
//   };
// }

// describe("resolveKillRatio", () => {
//   it("expresses kills as proportion of spawned enemies", () => {
//     expect(resolveKillRatio(wave({ kills: 10, enemiesSpawned: 20 }))).toBeCloseTo(0.5, 10);
//   });

//   it("caps ratio at 1", () => {
//     expect(resolveKillRatio(wave({ kills: 30, enemiesSpawned: 20 }))).toBe(1);
//   });

//   it("counts all enemy types", () => {
//     const performance: WavePerformance = {
//       ...wave({ enemiesSpawned: 10 }),
//       killsByType: { chaser: 2, dodger: 3, dasher: 1 },
//     };

//     expect(resolveKillRatio(performance)).toBeCloseTo(0.6, 10);
//   });
// });

// describe("classifyPerformance", () => {
//   it("treats massive life loss as strong negative evidence", () => {
//     const result = classifyPerformance(wave({ kills: 20, livesLost: 3 }));

//     expect(result.evidence).toBe("strongDecrease");
//     expect(result.reasons).toEqual(["livesLost"]);
//   });

//   it("treats 1 life lost while clearing arena as a fair fight", () => {
//     const result = classifyPerformance(wave({ kills: 15, livesLost: 1 }));

//     expect(result.evidence).toBe("targetRange");
//   });

//   it("treats 1 life lost with poor kills as evidence to ease off", () => {
//     const result = classifyPerformance(wave({ kills: 6, livesLost: 1 }));

//     expect(result.evidence).toBe("decrease");
//   });

//   it("treats near clear with 0 deaths as strong positive evidence", () => {
//     const result = classifyPerformance(wave({ kills: 18, livesLost: 0 }));

//     expect(result.evidence).toBe("strongIncrease");
//     expect(result.reasons).toContain("noLivesLost");
//   });

//   it("treats good clear with 0 deaths as positive evidence", () => {
//     const result = classifyPerformance(wave({ kills: 15, livesLost: 0 }));

//     expect(result.evidence).toBe("increase");
//   });

//   it("treats a very low kill ratio as negative evidence", () => {
//     const result = classifyPerformance(wave({ kills: 4, livesLost: 0 }));

//     expect(result.evidence).toBe("decrease");
//   });

//   it("holds on average performance", () => {
//     const result = classifyPerformance(
//       wave({ kills: 11, livesLost: 0, enemiesRemaining: 6 }),
//     );

//     expect(result.evidence).toBe("targetRange");
//   });

//   it("uses enemies remaining as tie breaker toward easing off", () => {
//     const result = classifyPerformance(
//       wave({ kills: 8, livesLost: 0, enemiesRemaining: 14 }),
//     );

//     expect(result.evidence).toBe("decrease");
//     expect(result.reasons).toContain("highEnemiesRemaining");
//   });

//   it("uses nearly empty arena as tie breaker toward more pressure", () => {
//     const result = classifyPerformance(
//       wave({ kills: 11, livesLost: 0, enemiesRemaining: 2 }),
//     );

//     expect(result.evidence).toBe("increase");
//     expect(result.reasons).toContain("lowEnemiesRemaining");
//   });
// });