import { strict as assert } from 'node:assert';
import { calculateGolemStats, evaluateExpeditionDamage, EXPEDITION_REGIONS, getGolemTraits } from '../src/data/gameData';
import { fabricateGolem, type CanonicalFabricationState } from '../src/domain/fabrication';
import {
  EMPTY_BLUEPRINT_LIBRARY,
  appendBlueprintTelemetryEvent,
  assessBlueprintBehavioralEvidence,
  assertBlueprintMetricInvariants,
  calculateBlueprintMetrics,
  deserializeBlueprintLibrary,
  resolveBlueprint,
  saveBlueprint,
  serializeBlueprintLibrary,
  type Blueprint,
  type BlueprintTelemetryEvent,
} from '../src/domain/blueprintLibrary';

const blueprint: Blueprint = {
  blueprint_id: 'blueprint-r2-001',
  part_ids: { frame_id: 'stone', reactor_id: 'fire', control_sigil_id: 'attack' },
  purpose_tag_ids: ['MINING', 'LOW_DAMAGE'],
  expedition_record_refs: ['record-001'],
};

const canonical: CanonicalFabricationState = {
  inventory: {
    body: { stone: 2, iron: 0, wood: 0, clay: 0 },
    core: { fire: 2, water: 0, wind: 0, earth: 0 },
    rune: { attack: 2, defense: 0, speed: 0, regen: 0 },
  },
  actionsLeft: 2,
  units: [],
  maxUnits: 3,
};
const canonicalHash = JSON.stringify(canonical);

const saved = saveBlueprint(EMPTY_BLUEPRINT_LIBRARY, blueprint, 'CREATE');
assert.equal(JSON.stringify(canonical), canonicalHash, 'save mutated canonical state');
const raw = serializeBlueprintLibrary(saved);
const roundTrip = deserializeBlueprintLibrary(raw);
assert.deepEqual(roundTrip, saved, 'round-trip mismatch');
const loaded = resolveBlueprint(roundTrip, blueprint.blueprint_id, (id) => id === 'record-001');
assert.equal(loaded.ok, true, 'valid Blueprint did not load');
if (!loaded.ok) throw new Error('expected valid Blueprint');
assert.deepEqual(loaded.design, blueprint.part_ids, 'part reference mismatch');
assert.deepEqual(loaded.resolvedRecordIds, ['record-001'], 'record reference corruption');
assert.deepEqual(loaded.blueprint.purpose_tag_ids, ['MINING', 'LOW_DAMAGE'], 'purpose metadata mismatch');
assert.equal(JSON.stringify(canonical), canonicalHash, 'load/apply mutated canonical state');

const updated = saveBlueprint(roundTrip, {
  ...blueprint,
  part_ids: { frame_id: 'wood', reactor_id: 'wind', control_sigil_id: 'speed' },
  purpose_tag_ids: ['SCOUT'],
}, 'UPDATE');
assert.deepEqual(updated.blueprints[0].expedition_record_refs, ['record-001'], 'update corrupted record references');
assert.deepEqual(updated.blueprints[0].purpose_tag_ids, ['SCOUT'], 'purpose metadata did not update');

const missing = resolveBlueprint(roundTrip, blueprint.blueprint_id, () => false);
assert.deepEqual(missing, { ok: false, code: 'REFERENCE_UNAVAILABLE', unavailableIds: ['record-001'] });
assert.equal(JSON.stringify(canonical), canonicalHash, 'missing reference mutated canonical state');
assert.throws(() => saveBlueprint(saved, blueprint, 'CREATE'), /DUPLICATE_BLUEPRINT_ID/);

const wrongCategoryState = deserializeBlueprintLibrary(JSON.stringify({
  version: 1,
  blueprints: [{
    ...blueprint,
    part_ids: { frame_id: 'fire', reactor_id: 'stone', control_sigil_id: 'attack' },
    expedition_record_refs: [],
  }],
}));
assert.deepEqual(resolveBlueprint(wrongCategoryState, blueprint.blueprint_id), {
  ok: false,
  code: 'REFERENCE_UNAVAILABLE',
  unavailableIds: ['fire', 'stone'],
}, 'cross-category part references did not fail closed');

for (const forbidden of ['unit_id', 'durability', 'current_damage', 'inventory', 'cargo', 'current_expedition', 'actionsLeft', 'day', 'rng_state', 'progression']) {
  const contaminated = JSON.stringify({ version: 1, blueprints: [{ ...blueprint, [forbidden]: 1 }] });
  assert.throws(() => deserializeBlueprintLibrary(contaminated), /CANONICAL_STATE_DUPLICATION/);
}

// Loading only restores a draft. Fabrication remains the unchanged canonical command.
const fabricated = fabricateGolem(canonical, { body: loaded.design.frame_id, core: loaded.design.reactor_id, rune: loaded.design.control_sigil_id }, 100);
assert.equal(fabricated.ok, true);
assert.equal(fabricated.ok && fabricated.state.actionsLeft, 1);
assert.equal(fabricated.ok && fabricated.state.inventory.body.stone, 1);

// Purpose tags identify player intent only. They never alter the canonical request or outcome.
const alternatePurpose = saveBlueprint(EMPTY_BLUEPRINT_LIBRARY, {
  ...blueprint,
  blueprint_id: 'blueprint-r2-purpose-control',
  purpose_tag_ids: ['HIGH_CARGO'],
  expedition_record_refs: [],
}, 'CREATE');
const purposeLoaded = resolveBlueprint(alternatePurpose, 'blueprint-r2-purpose-control');
assert.equal(purposeLoaded.ok, true);
if (!purposeLoaded.ok) throw new Error('expected purpose-control Blueprint');
assert.deepEqual(purposeLoaded.design, blueprint.part_ids, 'purpose metadata changed the design request');
const purposeFabricated = fabricateGolem(canonical, { body: purposeLoaded.design.frame_id, core: purposeLoaded.design.reactor_id, rune: purposeLoaded.design.control_sigil_id }, 100);
assert.deepEqual(purposeFabricated, fabricated, 'purpose metadata changed canonical fabrication');

// A Blueprint remains loadable when materials are missing; fabrication alone owns the blocker.
const emptyInventoryState: CanonicalFabricationState = {
  ...canonical,
  inventory: {
    body: { stone: 0, iron: 0, wood: 0, clay: 0 },
    core: { fire: 0, water: 0, wind: 0, earth: 0 },
    rune: { attack: 0, defense: 0, speed: 0, regen: 0 },
  },
};
assert.equal(purposeLoaded.ok, true, 'missing materials blocked Blueprint load');
const blockedFabrication = fabricateGolem(emptyInventoryState, { body: purposeLoaded.design.frame_id, core: purposeLoaded.design.reactor_id, rune: purposeLoaded.design.control_sigil_id }, 100);
assert.equal(blockedFabrication.ok, false);
assert.equal(blockedFabrication.ok ? undefined : blockedFabrication.reason, 'MISSING_FRAME');
assert.deepEqual(blockedFabrication.state, emptyInventoryState, 'blocked fabrication mutated canonical state');

let regressionMismatches = 0;
for (const region of EXPEDITION_REGIONS) {
  for (const parts of [
    ['stone', 'fire', 'attack'], ['wood', 'wind', 'speed'], ['iron', 'earth', 'defense'], ['clay', 'water', 'regen'],
  ] as const) {
    const [body, core, rune] = parts;
    const stats = calculateGolemStats(body, core, rune);
    const traits = getGolemTraits(body, core, rune);
    const before = evaluateExpeditionDamage(region, { stats, traits, durability: 100 });
    serializeBlueprintLibrary(EMPTY_BLUEPRINT_LIBRARY);
    const after = evaluateExpeditionDamage(region, { stats, traits, durability: 100 });
    if (JSON.stringify(before) !== JSON.stringify(after)) regressionMismatches += 1;
  }
}
assert.equal(regressionMismatches, 0, 'old-path regression');

const metrics = calculateBlueprintMetrics([]);
assert.equal(metrics.eligible_save_opportunities, 0);
assert.equal(metrics.eligible_redeploy_decisions, 0);
assert.equal(assessBlueprintBehavioralEvidence([]).verdict, 'INSUFFICIENT EVIDENCE');

// R2-BEH-01: eligible opportunities are emitted independently from actual saves.
const saveRateEvents: BlueprintTelemetryEvent[] = Array.from({ length: 10 }, (_, index) => ({
  type: 'blueprint_save_opportunity', opportunity_id: `beh-01-save-${index}`,
}));
for (let index = 0; index < 3; index += 1) {
  saveRateEvents.push({ type: 'blueprint_saved', blueprint_id: `beh-01-blueprint-${index}`, opportunity_id: `beh-01-save-${index}` });
}
assert.equal(calculateBlueprintMetrics(saveRateEvents).save_rate, 0.3, 'R2-BEH-01');

// R2-BEH-02: reuse time is relative to the Blueprint save point, not the global index.
const reuseDeltaEvents: BlueprintTelemetryEvent[] = [];
for (let index = 1; index <= 40; index += 1) {
  reuseDeltaEvents.push({ type: 'redeploy_decision', opportunity_id: `beh-02-redeploy-${index}`, blueprint_available: true });
  reuseDeltaEvents.push({ type: 'expedition_started', opportunity_id: `beh-02-redeploy-${index}`, source: 'MANUAL_NEW' });
}
reuseDeltaEvents.push({ type: 'blueprint_save_opportunity', opportunity_id: 'beh-02-save' });
reuseDeltaEvents.push({ type: 'blueprint_saved', blueprint_id: 'beh-02-blueprint', opportunity_id: 'beh-02-save' });
for (let index = 41; index <= 42; index += 1) {
  reuseDeltaEvents.push({ type: 'redeploy_decision', opportunity_id: `beh-02-redeploy-${index}`, blueprint_available: true });
  reuseDeltaEvents.push({ type: 'expedition_started', opportunity_id: `beh-02-redeploy-${index}`, source: 'MANUAL_NEW' });
}
reuseDeltaEvents.push({ type: 'blueprint_applied', blueprint_id: 'beh-02-blueprint', opportunity_index: 42 });
assert.equal(calculateBlueprintMetrics(reuseDeltaEvents).median_time_to_first_reuse, 2, 'R2-BEH-02');

// R2-BEH-03: numerator and denominator share one redeploy opportunity domain.
const redeployRateEvents: BlueprintTelemetryEvent[] = [];
const redeploySources = [
  ...Array.from({ length: 3 }, () => 'BLUEPRINT_DIRECT' as const),
  ...Array.from({ length: 2 }, () => 'BLUEPRINT_MODIFIED' as const),
  ...Array.from({ length: 5 }, () => 'MANUAL_NEW' as const),
];
redeploySources.forEach((source, index) => {
  const opportunityId = `beh-03-redeploy-${index}`;
  redeployRateEvents.push({ type: 'redeploy_decision', opportunity_id: opportunityId, blueprint_available: true });
  redeployRateEvents.push({ type: 'expedition_started', opportunity_id: opportunityId, source });
});
assert.equal(calculateBlueprintMetrics(redeployRateEvents).blueprint_redeploy_rate, 0.5, 'R2-BEH-03');

// R2-BEH-04: duplicates and multiple result events count once by opportunity ID.
const duplicateEvents: BlueprintTelemetryEvent[] = [
  { type: 'redeploy_decision', opportunity_id: 'beh-04-redeploy', blueprint_available: true },
  { type: 'redeploy_decision', opportunity_id: 'beh-04-redeploy', blueprint_available: true },
  { type: 'expedition_started', opportunity_id: 'beh-04-redeploy', source: 'BLUEPRINT_DIRECT' },
  { type: 'expedition_started', opportunity_id: 'beh-04-redeploy', source: 'BLUEPRINT_MODIFIED' },
  { type: 'redeploy_decision', opportunity_id: 'beh-04-final-manual', blueprint_available: true },
  { type: 'expedition_started', opportunity_id: 'beh-04-final-manual', source: 'BLUEPRINT_DIRECT' },
  { type: 'expedition_started', opportunity_id: 'beh-04-final-manual', source: 'MANUAL_NEW' },
  { type: 'expedition_started', opportunity_id: 'unrelated-redeploy', source: 'BLUEPRINT_DIRECT' },
];
const duplicateMetrics = calculateBlueprintMetrics(duplicateEvents);
assert.equal(duplicateMetrics.eligible_redeploy_decisions, 2, 'R2-BEH-04 denominator');
assert.equal(duplicateMetrics.blueprint_redeploy_rate, 0.5, 'R2-BEH-04 final decision');

// R2-BEH-05: impossible metric values fail closed.
assert.throws(() => assertBlueprintMetricInvariants({
  ...duplicateMetrics,
  blueprint_redeploy_rate: 1.01,
}), /INVALID_METRIC_RANGE: blueprint_redeploy_rate/, 'R2-BEH-05');
assert.ok((duplicateMetrics.blueprint_redeploy_rate ?? 0) <= 1, 'R2-BEH-05 calculated invariant');

const oneSaveOpportunity: BlueprintTelemetryEvent = { type: 'blueprint_save_opportunity', opportunity_id: 'stable-save-opportunity' };
const appendedOnce = appendBlueprintTelemetryEvent([], oneSaveOpportunity);
const appendedDuplicate = appendBlueprintTelemetryEvent(appendedOnce, oneSaveOpportunity);
assert.equal(appendedDuplicate.length, 1, 'duplicate opportunity event was not ignored');
assert.throws(() => appendBlueprintTelemetryEvent(appendedOnce, {
  type: 'redeploy_decision', opportunity_id: 'stable-save-opportunity', blueprint_available: true,
}), /DUPLICATE_OPPORTUNITY_ID/, 'conflicting opportunity ID was not rejected');
assert.throws(() => calculateBlueprintMetrics([
  { type: 'redeploy_decision', opportunity_id: 'conflicting-redeploy', blueprint_available: false },
  { type: 'redeploy_decision', opportunity_id: 'conflicting-redeploy', blueprint_available: true },
]), /DUPLICATE_OPPORTUNITY_ID/, 'conflicting raw opportunity definitions were not rejected');

const thresholdEvents: BlueprintTelemetryEvent[] = [];
for (let index = 0; index < 30; index += 1) {
  thresholdEvents.push({ type: 'blueprint_save_opportunity', opportunity_id: `save-${index}` });
  if (index < 10) thresholdEvents.push({ type: 'blueprint_saved', blueprint_id: `blueprint-${index}`, opportunity_id: `save-${index}` });
}
for (let index = 0; index < 30; index += 1) {
  const opportunityId = `redeploy-${index}`;
  thresholdEvents.push({ type: 'redeploy_decision', opportunity_id: opportunityId, blueprint_available: true });
  thresholdEvents.push({
    type: 'expedition_started',
    opportunity_id: opportunityId,
    source: index < 9 ? 'BLUEPRINT_DIRECT' : 'MANUAL_NEW',
    blueprint_id: index < 9 ? `blueprint-${index % 3}` : undefined,
  });
  if (index < 3) thresholdEvents.push({ type: 'blueprint_applied', blueprint_id: `blueprint-${index}`, opportunity_index: index + 1 });
}
const thresholdMetrics = calculateBlueprintMetrics(thresholdEvents);
assert.equal(thresholdMetrics.eligible_save_opportunities, 30);
assert.equal(thresholdMetrics.eligible_redeploy_decisions, 30);
assert.equal(thresholdMetrics.reuse_rate, 0.3);
assert.equal(thresholdMetrics.blueprint_redeploy_rate, 0.3);
assert.equal(thresholdMetrics.median_time_to_first_reuse, 2);
assert.equal(assessBlueprintBehavioralEvidence(thresholdEvents).verdict, 'PASS — PREFERRED CANDIDATE / CANONICAL HOLD');

const rejectedEvents = [
  ...Array.from({ length: 30 }, (_, index) => ({ type: 'blueprint_save_opportunity' as const, opportunity_id: `rejected-save-${index}` })),
  ...Array.from({ length: 30 }, (_, index) => [
    { type: 'redeploy_decision' as const, opportunity_id: `rejected-redeploy-${index}`, blueprint_available: true },
    { type: 'expedition_started' as const, opportunity_id: `rejected-redeploy-${index}`, source: 'MANUAL_NEW' as const },
  ]).flat(),
];
assert.equal(assessBlueprintBehavioralEvidence(rejectedEvents).verdict, 'FAIL — REJECT');

console.log(JSON.stringify({
  experiment: 'R2_BLUEPRINT_LIBRARY_V1',
  automated_gates: { actionability: 'PASS', persistence: 'PASS', state_isolation: 'PASS', regression: 'PASS' },
  behavioral_metric_regression: {
    'R2-BEH-01_SAVE_RATE': 'PASS',
    'R2-BEH-02_RELATIVE_REUSE': 'PASS',
    'R2-BEH-03_REDEPLOY_JOIN': 'PASS',
    'R2-BEH-04_DUPLICATE_ID': 'PASS',
    'R2-BEH-05_METRIC_INVARIANT': 'PASS',
  },
  behavioral_collection: 'NOT STARTED',
  eligible_save_opportunities: 0,
  eligible_redeploy_decisions: 0,
  verdict: 'INSUFFICIENT EVIDENCE',
  canonical: 'HOLD',
}, null, 2));
