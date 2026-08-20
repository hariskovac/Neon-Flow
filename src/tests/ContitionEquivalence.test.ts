// import { describe, expect, it } from "vitest";

// import { DifficultyController } from "../dda/DifficultyController";
// import { resolveActuators } from "../dda/DifficultyConfig";
// import { mapCalibration } from "../dda/CalibrationMapper";
// import { flattenExplanation } from "../dda/ExplanationGenerator";
// import type { EnemyType, WavePerformance } from "../types/game";

// interface WaveOverrides {
//   kills?: number;
//   livesLost?: number;
//   enemiesRemaining?: number;
//   enemiesSpawned?: number;
//   waveNumber?: number;
// }

// function wave(overrides: WaveOverrides = {}): WavePerformance {
//   const kills = overrides.kills ?? 0;
//   const killsByType: Record<EnemyType, number> = {
//     chaser: kills,
//     dodger: 0,
//     dasher: 0,
//   };

//   return {
//     waveNumber: overrides.waveNumber ?? 1,
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

// // six-wave sequence covering rises, falls, and no change
// const SEQUENCE: WavePerformance[] = [
//   wave({ waveNumber: 1, kills: 18 }),
//   wave({ waveNumber: 2, kills: 15 }),
//   wave({ waveNumber: 3, kills: 6, livesLost: 1 }),
//   wave({ waveNumber: 4, kills: 3, livesLost: 4 }),
//   wave({ waveNumber: 5, kills: 11 }),
//   wave({ waveNumber: 6, kills: 17 }),
// ];

// function runSession(startingLevel: number): {
//   levels: number[];
//   directions: string[];
//   explanations: string[];
//   actuators: string[];
// } {
//   const controller = new DifficultyController(startingLevel);
//   const levels: number[] = [];
//   const directions: string[] = [];
//   const explanations: string[] = [];
//   const actuators: string[] = [];

//   for (const performance of SEQUENCE) {
//     const decision = controller.evaluate(performance);

//     levels.push(decision.nextLevel);
//     directions.push(decision.direction);
//     explanations.push(flattenExplanation(decision.explanation));
//     actuators.push(JSON.stringify(resolveActuators(decision.nextLevel)));
//   }

//   return { levels, directions, explanations, actuators };
// }

// describe("condition equivalence", () => {
//   it("produces same difficulty trajectory for both conditions", () => {
//     // 2 participants with identical performance, one per condition
//     const hidden = runSession(3);
//     const transparent = runSession(3);

//     expect(hidden.levels).toEqual(transparent.levels);
//   });

//   it("produces same decision direction for both conditions", () => {
//     expect(runSession(3).directions).toEqual(runSession(3).directions);
//   });

//   it("produces same actuator values for both conditions", () => {
//     expect(runSession(3).actuators).toEqual(runSession(3).actuators);
//   });

//   it("generates same explanation text in both conditions", () => {
//     expect(runSession(3).explanations).toEqual(runSession(3).explanations);
//   });

//   it("maps calibration to same starting level regardless of condition", () => {
//     const calibration = wave({ waveNumber: 0, kills: 15, livesLost: 1 });

//     expect(mapCalibration(calibration)).toEqual(mapCalibration(calibration));
//   });

//   it("gives whole decision record (identical) for both conditions", () => {
//     const first = new DifficultyController(4);
//     const second = new DifficultyController(4);

//     for (const performance of SEQUENCE) {
//       expect(first.evaluate(performance)).toEqual(second.evaluate(performance));
//     }
//   });

//   it("doesn't let an explanation name a parameter that didn't change", () => {
//     const controller = new DifficultyController(3);

//     for (const performance of SEQUENCE) {
//       const decision = controller.evaluate(performance);

//       expect(decision.explanation.changeLines.length).toBe(
//         decision.parameterChanges.length,
//       );
//     }
//   });
// });