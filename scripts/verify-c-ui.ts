import { EXPEDITION_REGIONS, calculateGolemStats, getGolemTraits, runExpeditionSimulation } from '../src/data/gameData';
import { cMultiAxisExperiment, evaluateCMultiAxis, ROUTE_LABELS } from '../src/data/cMultiAxis';
import type { BodyType, Golem } from '../src/types';

const region = EXPEDITION_REGIONS.find((candidate) => candidate.id === 'region_ruins');
if (!region) throw new Error('Ancient Ruins not found');

const expectedAtFullDurability: Record<BodyType, number> = { stone: 53, wood: 47, iron: 59, clay: 52 };
const durabilities = [100, 75, 50, 25];

for (const body of Object.keys(expectedAtFullDurability) as BodyType[]) {
  for (const durability of durabilities) {
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
      durability,
    };
    const prediction = evaluateCMultiAxis(golem.stats, golem.traits.includes('heat_proof'), region, durability);
    const report = runExpeditionSimulation(region, golem, () => 0, cMultiAxisExperiment(region));
    if (report.totalDamage !== prediction.totalDamage || prediction.status !== report.status) {
      throw new Error(`${body}@${durability}: predicted ${prediction.totalDamage}/${prediction.status}, actual ${report.totalDamage}/${report.status}`);
    }
    if (durability === 100 && prediction.totalDamage !== expectedAtFullDurability[body]) {
      throw new Error(`${body}@100: expected ${expectedAtFullDurability[body]}, predicted ${prediction.totalDamage}`);
    }
    console.log(`${body}@${durability}: ${prediction.route} ${ROUTE_LABELS[prediction.route].name}, predicted=${prediction.totalDamage}/${prediction.status}, actual=${report.totalDamage}/${report.status}`);
  }
}

console.log('C_UI prediction/result consistency: PASS');
