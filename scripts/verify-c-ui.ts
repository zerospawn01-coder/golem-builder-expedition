import { EXPEDITION_REGIONS, calculateGolemStats, getGolemTraits, runExpeditionSimulation } from '../src/data/gameData';
import { cMultiAxisExperiment, evaluateCMultiAxis, ROUTE_LABELS } from '../src/data/cMultiAxis';
import type { BodyType, Golem } from '../src/types';

const region = EXPEDITION_REGIONS.find((candidate) => candidate.id === 'region_ruins');
if (!region) throw new Error('Ancient Ruins not found');

const expected: Record<BodyType, number> = { stone: 53, wood: 47, iron: 59, clay: 52 };

for (const body of Object.keys(expected) as BodyType[]) {
  const golem: Golem = {
    id: body,
    name: body,
    body,
    core: 'water',
    rune: 'attack',
    stats: calculateGolemStats(body, 'water', 'attack'),
    traits: getGolemTraits(body, 'water', 'attack'),
    createdAt: 0,
    expeditionsCount: 0,
    durability: 100,
  };
  const prediction = evaluateCMultiAxis(golem.stats, golem.traits.includes('heat_proof'), region);
  const report = runExpeditionSimulation(region, golem, () => 0, cMultiAxisExperiment(region));
  if (prediction.totalDamage !== expected[body] || report.totalDamage !== prediction.totalDamage) {
    throw new Error(`${body}: expected ${expected[body]}, predicted ${prediction.totalDamage}, actual ${report.totalDamage}`);
  }
  console.log(`${body}: ${prediction.route} ${ROUTE_LABELS[prediction.route].name}, predicted=${prediction.totalDamage}, actual=${report.totalDamage}, status=${report.status}`);
}

console.log('C_UI prediction/result consistency: PASS');
