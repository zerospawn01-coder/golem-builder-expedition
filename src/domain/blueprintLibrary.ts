import { BODIES, CORES, RUNES } from '../data/gameData';
import type { BodyType, CoreType, RuneType } from '../types';

export const R2_BLUEPRINT_STORAGE_VERSION = 1;

export const BLUEPRINT_PURPOSE_TAG_OPTIONS = [
  { id: 'GENERAL', label: '汎用', description: '用途を限定しない設計記録' },
  { id: 'MINING', label: '採掘', description: '採掘・回収を意図した設計記録' },
  { id: 'SCOUT', label: '偵察', description: '観測・踏査を意図した設計記録' },
  { id: 'RUINS', label: '遺跡', description: '遺跡への適用を検討した設計記録' },
  { id: 'HIGH_CARGO', label: '高積載', description: '回収量を重視した設計記録' },
  { id: 'LOW_DAMAGE', label: '低損傷', description: '損傷抑制を意図した設計記録' },
] as const;

export interface BlueprintPartIds {
  frame_id: BodyType;
  reactor_id: CoreType;
  control_sigil_id: RuneType;
}

export interface Blueprint {
  blueprint_id: string;
  part_ids: BlueprintPartIds;
  purpose_tag_ids: string[];
  expedition_record_refs: string[];
}

export interface BlueprintLibraryState {
  version: 1;
  blueprints: Blueprint[];
}

export type BlueprintResolution =
  | { ok: true; blueprint: Blueprint; design: BlueprintPartIds; resolvedRecordIds: string[] }
  | { ok: false; code: 'REFERENCE_UNAVAILABLE' | 'BLUEPRINT_NOT_FOUND'; unavailableIds: string[] };

export type BlueprintSource = 'MANUAL_NEW' | 'BLUEPRINT_DIRECT' | 'BLUEPRINT_MODIFIED';
export type BlueprintTelemetryEvent =
  | { type: 'blueprint_save_opportunity'; opportunity_id: string }
  | { type: 'blueprint_saved'; blueprint_id: string; opportunity_id: string }
  | { type: 'blueprint_load_opportunity'; opportunity_id: string }
  | { type: 'blueprint_loaded'; blueprint_id: string; opportunity_id: string }
  | { type: 'blueprint_applied'; blueprint_id: string; opportunity_index: number }
  | { type: 'blueprint_modified'; blueprint_id: string }
  | { type: 'blueprint_resaved'; blueprint_id: string }
  | { type: 'redeploy_decision'; opportunity_id: string; blueprint_available: boolean }
  | { type: 'expedition_started'; source: BlueprintSource; opportunity_id: string; blueprint_id?: string };

export interface BlueprintMetrics {
  save_rate: number | null;
  reuse_rate: number | null;
  median_time_to_first_reuse: number | null;
  blueprint_redeploy_rate: number | null;
  modified_resave_rate: number | null;
  eligible_save_opportunities: number;
  eligible_redeploy_decisions: number;
}

export const EMPTY_BLUEPRINT_LIBRARY: BlueprintLibraryState = { version: R2_BLUEPRINT_STORAGE_VERSION, blueprints: [] };

function cloneBlueprint(blueprint: Blueprint): Blueprint {
  return {
    blueprint_id: blueprint.blueprint_id,
    part_ids: { ...blueprint.part_ids },
    purpose_tag_ids: [...blueprint.purpose_tag_ids],
    expedition_record_refs: [...blueprint.expedition_record_refs],
  };
}

export function isLegalDesign(parts: BlueprintPartIds): boolean {
  return parts.frame_id in BODIES && parts.reactor_id in CORES && parts.control_sigil_id in RUNES;
}

export function saveBlueprint(state: BlueprintLibraryState, blueprint: Blueprint, mode: 'CREATE' | 'UPDATE'): BlueprintLibraryState {
  if (!isLegalDesign(blueprint.part_ids)) throw new Error('REFERENCE_UNAVAILABLE');
  const index = state.blueprints.findIndex(({ blueprint_id }) => blueprint_id === blueprint.blueprint_id);
  if (mode === 'CREATE' && index >= 0) throw new Error('DUPLICATE_BLUEPRINT_ID');
  if (mode === 'UPDATE' && index < 0) throw new Error('BLUEPRINT_NOT_FOUND');
  const next = state.blueprints.map(cloneBlueprint);
  if (mode === 'UPDATE') next[index] = cloneBlueprint(blueprint);
  else next.push(cloneBlueprint(blueprint));
  return { version: 1, blueprints: next };
}

export function resolveBlueprint(
  state: BlueprintLibraryState,
  blueprintId: string,
  recordExists: (recordId: string) => boolean = () => false,
): BlueprintResolution {
  const blueprint = state.blueprints.find(({ blueprint_id }) => blueprint_id === blueprintId);
  if (!blueprint) return { ok: false, code: 'BLUEPRINT_NOT_FOUND', unavailableIds: [blueprintId] };
  const unavailableIds = [
    ...(blueprint.part_ids.frame_id in BODIES ? [] : [blueprint.part_ids.frame_id]),
    ...(blueprint.part_ids.reactor_id in CORES ? [] : [blueprint.part_ids.reactor_id]),
    ...(blueprint.part_ids.control_sigil_id in RUNES ? [] : [blueprint.part_ids.control_sigil_id]),
    ...blueprint.expedition_record_refs.filter((id) => !recordExists(id)),
  ];
  if (unavailableIds.length) return { ok: false, code: 'REFERENCE_UNAVAILABLE', unavailableIds };
  return { ok: true, blueprint: cloneBlueprint(blueprint), design: { ...blueprint.part_ids }, resolvedRecordIds: [...blueprint.expedition_record_refs] };
}

export function serializeBlueprintLibrary(state: BlueprintLibraryState): string {
  return JSON.stringify({ version: 1, blueprints: state.blueprints.map(cloneBlueprint) });
}

const blueprintKeys = ['blueprint_id', 'part_ids', 'purpose_tag_ids', 'expedition_record_refs'];
const partKeys = ['frame_id', 'reactor_id', 'control_sigil_id'];

export function deserializeBlueprintLibrary(raw: string | null): BlueprintLibraryState {
  if (!raw) return EMPTY_BLUEPRINT_LIBRARY;
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') throw new Error('INVALID_BLUEPRINT_LIBRARY');
  const root = parsed as Record<string, unknown>;
  if (root.version !== 1 || !Array.isArray(root.blueprints)) throw new Error('INVALID_BLUEPRINT_LIBRARY');
  const ids = new Set<string>();
  const blueprints = root.blueprints.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('INVALID_BLUEPRINT');
    const value = item as Record<string, unknown>;
    if (Object.keys(value).some((key) => !blueprintKeys.includes(key))) throw new Error('CANONICAL_STATE_DUPLICATION');
    if (typeof value.blueprint_id !== 'string' || ids.has(value.blueprint_id)) throw new Error('DUPLICATE_BLUEPRINT_ID');
    ids.add(value.blueprint_id);
    if (!value.part_ids || typeof value.part_ids !== 'object') throw new Error('INVALID_PART_REFS');
    const parts = value.part_ids as Record<string, unknown>;
    if (Object.keys(parts).some((key) => !partKeys.includes(key)) || !partKeys.every((key) => typeof parts[key] === 'string')) throw new Error('INVALID_PART_REFS');
    if (!Array.isArray(value.purpose_tag_ids) || !value.purpose_tag_ids.every((id) => typeof id === 'string')) throw new Error('INVALID_TAG_REFS');
    if (!Array.isArray(value.expedition_record_refs) || !value.expedition_record_refs.every((id) => typeof id === 'string')) throw new Error('INVALID_RECORD_REFS');
    return cloneBlueprint({ blueprint_id: value.blueprint_id, part_ids: parts as unknown as BlueprintPartIds, purpose_tag_ids: value.purpose_tag_ids as string[], expedition_record_refs: value.expedition_record_refs as string[] });
  });
  return { version: 1, blueprints };
}

const opportunityDefinitionTypes = new Set<BlueprintTelemetryEvent['type']>([
  'blueprint_save_opportunity',
  'blueprint_load_opportunity',
  'redeploy_decision',
]);

function sameOpportunityDefinition(left: BlueprintTelemetryEvent, right: BlueprintTelemetryEvent): boolean {
  if (left.type !== right.type || !('opportunity_id' in left) || !('opportunity_id' in right)) return false;
  if (left.opportunity_id !== right.opportunity_id) return false;
  if (left.type === 'redeploy_decision' && right.type === 'redeploy_decision') {
    return left.blueprint_available === right.blueprint_available;
  }
  return true;
}

export function appendBlueprintTelemetryEvent(
  events: readonly BlueprintTelemetryEvent[],
  event: BlueprintTelemetryEvent,
): BlueprintTelemetryEvent[] {
  if (opportunityDefinitionTypes.has(event.type) && 'opportunity_id' in event) {
    const existing = events.find((candidate) => opportunityDefinitionTypes.has(candidate.type)
      && 'opportunity_id' in candidate
      && candidate.opportunity_id === event.opportunity_id);
    if (existing) {
      if (sameOpportunityDefinition(existing, event)) return [...events];
      throw new Error(`DUPLICATE_OPPORTUNITY_ID: ${event.opportunity_id}`);
    }
  }
  return [...events, event];
}

export function countEligibleRedeployOpportunities(events: readonly BlueprintTelemetryEvent[]): number {
  return new Set(events.filter(
    (event): event is Extract<BlueprintTelemetryEvent, { type: 'redeploy_decision' }> => event.type === 'redeploy_decision' && event.blueprint_available,
  ).map(({ opportunity_id }) => opportunity_id)).size;
}

export function assertBlueprintMetricInvariants(metrics: BlueprintMetrics): void {
  for (const [name, value] of [
    ['save_rate', metrics.save_rate],
    ['reuse_rate', metrics.reuse_rate],
    ['blueprint_redeploy_rate', metrics.blueprint_redeploy_rate],
  ] as const) {
    if (value !== null && (value < 0 || value > 1)) throw new Error(`INVALID_METRIC_RANGE: ${name}`);
  }
  if (metrics.median_time_to_first_reuse !== null && metrics.median_time_to_first_reuse < 0) {
    throw new Error('INVALID_METRIC_RANGE: median_time_to_first_reuse');
  }
}

export function calculateBlueprintMetrics(events: readonly BlueprintTelemetryEvent[]): BlueprintMetrics {
  const opportunityDefinitions = new Map<string, BlueprintTelemetryEvent>();
  for (const event of events) {
    if (!opportunityDefinitionTypes.has(event.type) || !('opportunity_id' in event)) continue;
    const existing = opportunityDefinitions.get(event.opportunity_id);
    if (existing && !sameOpportunityDefinition(existing, event)) {
      throw new Error(`DUPLICATE_OPPORTUNITY_ID: ${event.opportunity_id}`);
    }
    if (!existing) opportunityDefinitions.set(event.opportunity_id, event);
  }

  const saveOpportunities = new Set<string>();
  const savedOpportunities = new Set<string>();
  const savedOpportunityBlueprint = new Map<string, string>();
  const savedBlueprints = new Map<string, { eventIndex: number; eligibleRedeployIndex: number }>();
  const reusedBlueprints = new Set<string>();
  const firstReuse: number[] = [];
  const eligibleRedeploy = new Map<string, Extract<BlueprintTelemetryEvent, { type: 'redeploy_decision' }>>();
  const finalRedeployDecision = new Map<string, Extract<BlueprintTelemetryEvent, { type: 'expedition_started' }>>();

  events.forEach((event, eventIndex) => {
    if (event.type === 'blueprint_save_opportunity') {
      saveOpportunities.add(event.opportunity_id);
      return;
    }
    if (event.type === 'redeploy_decision') {
      if (event.blueprint_available && !eligibleRedeploy.has(event.opportunity_id)) eligibleRedeploy.set(event.opportunity_id, event);
      return;
    }
    if (event.type === 'blueprint_saved') {
      if (!saveOpportunities.has(event.opportunity_id)) {
        throw new Error(`UNKNOWN_SAVE_OPPORTUNITY: ${event.opportunity_id}`);
      }
      const existingBlueprintId = savedOpportunityBlueprint.get(event.opportunity_id);
      if (existingBlueprintId && existingBlueprintId !== event.blueprint_id) {
        throw new Error(`CONFLICTING_SAVE_RESULT: ${event.opportunity_id}`);
      }
      savedOpportunityBlueprint.set(event.opportunity_id, event.blueprint_id);
      savedOpportunities.add(event.opportunity_id);
      if (!savedBlueprints.has(event.blueprint_id)) {
        savedBlueprints.set(event.blueprint_id, {
          eventIndex,
          eligibleRedeployIndex: eligibleRedeploy.size,
        });
      }
      return;
    }
    if (event.type === 'blueprint_applied') {
      const savedAt = savedBlueprints.get(event.blueprint_id);
      if (!savedAt || eventIndex <= savedAt.eventIndex || reusedBlueprints.has(event.blueprint_id)) return;
      if (event.opportunity_index !== eligibleRedeploy.size || event.opportunity_index < savedAt.eligibleRedeployIndex) {
        throw new Error(`INVALID_REUSE_OPPORTUNITY_INDEX: ${event.blueprint_id}`);
      }
      reusedBlueprints.add(event.blueprint_id);
      firstReuse.push(event.opportunity_index - savedAt.eligibleRedeployIndex);
      return;
    }
    if (event.type === 'expedition_started' && eligibleRedeploy.has(event.opportunity_id)) {
      finalRedeployDecision.set(event.opportunity_id, event);
    }
  });

  const assistedRedeployOpportunities = [...finalRedeployDecision.entries()].filter(([opportunityId, event]) => (
    eligibleRedeploy.has(opportunityId) && event.source !== 'MANUAL_NEW'
  )).length;
  const modified = events.filter((event) => event.type === 'blueprint_modified').length;
  const resaved = events.filter((event) => event.type === 'blueprint_resaved').length;
  firstReuse.sort((a, b) => a - b);
  const median = firstReuse.length ? firstReuse[Math.floor((firstReuse.length - 1) / 2)] : null;
  const metrics: BlueprintMetrics = {
    save_rate: saveOpportunities.size ? savedOpportunities.size / saveOpportunities.size : null,
    reuse_rate: savedBlueprints.size ? reusedBlueprints.size / savedBlueprints.size : null,
    median_time_to_first_reuse: median,
    blueprint_redeploy_rate: eligibleRedeploy.size ? assistedRedeployOpportunities / eligibleRedeploy.size : null,
    modified_resave_rate: modified ? resaved / modified : null,
    eligible_save_opportunities: saveOpportunities.size,
    eligible_redeploy_decisions: eligibleRedeploy.size,
  };
  assertBlueprintMetricInvariants(metrics);
  return metrics;
}

export function assessBlueprintBehavioralEvidence(events: readonly BlueprintTelemetryEvent[]) {
  const metrics = calculateBlueprintMetrics(events);
  const sampleSufficient = metrics.eligible_save_opportunities >= 30
    && metrics.eligible_redeploy_decisions >= 30;
  const behavioralPass = sampleSufficient
    && metrics.reuse_rate !== null
    && metrics.reuse_rate >= 0.3
    && metrics.blueprint_redeploy_rate !== null
    && metrics.blueprint_redeploy_rate >= 0.3
    && metrics.median_time_to_first_reuse !== null
    && metrics.median_time_to_first_reuse <= 3;
  const verdict = !sampleSufficient
    ? 'INSUFFICIENT EVIDENCE' as const
    : behavioralPass
      ? 'PASS — PREFERRED CANDIDATE / CANONICAL HOLD' as const
      : 'FAIL — REJECT' as const;

  return { metrics, sample_sufficient: sampleSufficient, behavioral_pass: behavioralPass, verdict };
}
