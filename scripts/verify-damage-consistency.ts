import {
  BODIES,
  CORES,
  RUNES,
  calculateGolemStats,
  predictExpeditionOutcome,
  runExpeditionSimulation,
} from '../src/data/gameData';
import type { BodyType, CoreType, Golem, RuneType } from '../src/types';
import { regionsFor, simulationExperiment, traitsFor, VARIANTS } from './experiment-variants';

const durabilities = [100, 75, 50, 25, 1];
let checked = 0;

for (const variant of VARIANTS) {
  for (const region of regionsFor(variant)) {
    const experiment = simulationExperiment(variant, region);
    for (const body of Object.keys(BODIES) as BodyType[]) {
      for (const core of Object.keys(CORES) as CoreType[]) {
        for (const rune of Object.keys(RUNES) as RuneType[]) {
          for (const durability of durabilities) {
            const stats = calculateGolemStats(body, core, rune);
            const traits = traitsFor(variant, body, core, rune);
            const golem: Golem = {
              id: `${body}-${core}-${rune}`,
              name: `${body}-${core}-${rune}`,
              body,
              core,
              rune,
              stats,
              traits,
              durability,
              createdAt: 0,
              expeditionsCount: 0,
            };

            const prediction = predictExpeditionOutcome(region, stats, traits, durability, experiment);
            const report = runExpeditionSimulation(region, golem, () => 0, experiment);
            const expectedStatus = prediction.status === 'BLOCKED' ? 'FAILED' : prediction.status;
            const loggedDamage = report.logs.reduce((sum, event) => sum + (event.damageTaken ?? 0), 0);
            const context = `${variant}/${region.id}/${golem.id}@${durability}`;

            if (prediction.totalDamage !== report.totalDamage) {
              throw new Error(`${context}: predicted damage ${prediction.totalDamage}, actual ${report.totalDamage}`);
            }
            if (expectedStatus !== report.status) {
              throw new Error(`${context}: predicted status ${prediction.status}, actual ${report.status}`);
            }
            if (loggedDamage !== report.totalDamage) {
              throw new Error(`${context}: logged damage ${loggedDamage}, report total ${report.totalDamage}`);
            }
            checked += 1;
          }
        }
      }
    }
  }
}

console.log(`Prediction/result damage consistency: PASS (${checked} cases)`);
