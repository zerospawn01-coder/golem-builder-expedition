import React, { useEffect, useMemo, useState } from 'react';
import { BODIES, CORES, RUNES } from '../../data/gameData';
import type { BodyType, CoreType, RuneType } from '../../types';
import {
  ALL_BUILD_PARTS,
  createGravityUnit,
  evaluateGravityDepth,
  PROTOTYPE_MATERIALS,
  snapshotUnit,
} from './engine';
import { createInitialGravityState, loadGravityState, saveGravityState } from './state';
import { advanceGravityRun, recoverGravityCargo, startGravityRun } from './model';
import type {
  GravityDepth,
  GravityDepthEvaluation,
  GravityExperimentState,
  GravityExperimentUnit,
  GravityRoute,
  PrototypeMaterialId,
} from './types';

const DEPTH_NAMES: Record<GravityDepth, string> = {
  1: 'OUTER FIELD / 外縁区域',
  2: 'MASS DISTORTION / 質量歪曲域',
  3: 'FRACTURED WORKSITE / 断裂作業区',
  4: 'GRAVITY WELL / 重力井戸',
};

const panel = 'border border-[#3B4046] bg-[#15181C] p-4 rounded-xs';
const button = 'border border-[#596069] px-4 py-2 text-xs font-bold hover:border-amber-400 disabled:opacity-40 disabled:cursor-not-allowed';

function statusColor(status: GravityDepthEvaluation['status']) {
  return status === 'CRITICAL' ? 'text-rose-400' : status === 'WARNING' ? 'text-amber-400' : 'text-emerald-400';
}

function DamageBreakdown({ evaluation }: { evaluation: GravityDepthEvaluation }) {
  const major = [...evaluation.damageSources].filter((source) => source.amount > 0).sort((a, b) => b.amount - a.amount)[0];
  return <div className="space-y-2 text-xs">
    <div className="flex justify-between"><span>PREDICTED DAMAGE</span><strong className={statusColor(evaluation.status)}>{evaluation.totalDamage}% / {evaluation.status}</strong></div>
    {evaluation.damageSources.map((source) => <div key={source.id} className="flex justify-between text-[#B8BDC4]"><span>{source.label}</span><span>+{source.amount}</span></div>)}
    <div className="border-t border-[#34383D] pt-2 flex justify-between"><span>AFTER</span><span>{evaluation.durabilityAfter}%</span></div>
    {major && <div className="text-[10px] text-[#8A8F98]">MAJOR CONTRIBUTOR: {major.label} (+{major.amount})</div>}
  </div>;
}

function UnitFacts({ unit }: { unit: GravityExperimentUnit }) {
  return <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
    <span>POWER {unit.stats.power}</span><span>ARMOR {unit.stats.armor}</span><span>MOBILITY {unit.stats.mobility}</span><span>WORK {unit.stats.work}</span><span>MASS {unit.frameMass}</span><span>GRAVITY CONTROL {unit.gravityControl ? 'YES' : 'NO'}</span>
  </div>;
}

export default function GravityDepthExperiment() {
  const [state, setState] = useState<GravityExperimentState>(() => loadGravityState(localStorage));
  const [buildBody, setBuildBody] = useState<BodyType>('wood');
  const [buildCore, setBuildCore] = useState<CoreType>('wind');
  const [buildRune, setBuildRune] = useState<RuneType>('speed');
  const [buildMaterial, setBuildMaterial] = useState<PrototypeMaterialId | ''>('');
  const [decisionReason, setDecisionReason] = useState('');

  useEffect(() => saveGravityState(localStorage, state), [state]);
  const activeUnit = state.units.find((unit) => unit.id === state.activeUnitId) ?? state.units[0];
  const currentResult = state.run?.depthResults[state.run.depthResults.length - 1];
  const cargoWeight = state.run?.unsecuredCargo.reduce((sum, item) => sum + item.weight * item.count, 0) ?? 0;
  const capacity = activeUnit ? activeUnit.stats.work * 2 : 0;
  const selectedWeight = state.run?.unsecuredCargo.filter((item) => state.selectedCargoIds.includes(item.id)).reduce((sum, item) => sum + item.weight * item.count, 0) ?? 0;

  const depthOnePreview = useMemo(() => activeUnit ? evaluateGravityDepth(1, snapshotUnit(activeUnit)) : null, [activeUnit]);

  const applyDepth = (depth: GravityDepth, route?: GravityRoute) => {
    setState((previous) => advanceGravityRun(previous, depth, route));
  };

  const deploy = () => {
    setState((previous) => startGravityRun(previous));
  };

  const recordDecision = (choice: 'RETURN' | 'CONTINUE' | GravityRoute) => {
    if (!state.run) return;
    setState((previous) => ({ ...previous, playtestRecords: [...previous.playtestRecords, { depth: previous.run!.currentDepth, choice, reason: decisionReason, recordedAt: Date.now() }] }));
    setDecisionReason('');
  };

  const continueRun = () => {
    if (!state.run) return;
    recordDecision('CONTINUE');
    if (state.run.currentDepth === 1) applyDepth(2);
    else if (state.run.currentDepth === 3) applyDepth(4);
  };

  const beginReturn = () => {
    recordDecision('RETURN');
    setState((previous) => previous.run ? ({ ...previous, run: { ...previous.run, phase: 'RETURNING' } }) : previous);
  };

  const confirmReturn = () => {
    setState((previous) => recoverGravityCargo(previous));
  };

  const finishReport = () => setState((previous) => ({ ...previous, run: null, selectedCargoIds: [] }));

  const buildUnit = () => {
    const material = buildMaterial || undefined;
    if (state.actionsLeft <= 0 || state.units.length >= 3) return;
    if (state.inventory.body[buildBody] <= 0 || state.inventory.core[buildCore] <= 0 || state.inventory.rune[buildRune] <= 0) return;
    if (material && state.inventory.prototype[material] <= 0) return;
    setState((previous) => {
      const inventory = structuredClone(previous.inventory);
      inventory.body[buildBody] -= 1; inventory.core[buildCore] -= 1; inventory.rune[buildRune] -= 1;
      if (material) inventory.prototype[material] -= 1;
      const unit = createGravityUnit(`g-${Date.now()}`, buildBody, buildCore, buildRune, material);
      return { ...previous, inventory, units: [unit, ...previous.units], activeUnitId: unit.id, actionsLeft: previous.actionsLeft - 1 };
    });
  };

  const pinBuildCandidate = () => {
    const material = buildMaterial || undefined;
    const candidate = createGravityUnit(`candidate-${Date.now()}`, buildBody, buildCore, buildRune, material);
    setState((previous) => ({ ...previous, comparisonCandidates: [...previous.comparisonCandidates.slice(-1), candidate] }));
  };

  const repair = (unit: GravityExperimentUnit) => setState((previous) => {
    if (previous.actionsLeft <= 0 || previous.inventory.body[unit.body] <= 0 || unit.durability >= 100) return previous;
    const inventory = structuredClone(previous.inventory); inventory.body[unit.body] -= 1;
    return { ...previous, inventory, actionsLeft: previous.actionsLeft - 1, units: previous.units.map((item) => item.id === unit.id ? { ...item, durability: Math.min(100, item.durability + 25) } : item) };
  });

  const disassemble = (unit: GravityExperimentUnit) => setState((previous) => {
    if (unit.isStarter) return previous;
    const inventory = structuredClone(previous.inventory); inventory.body[unit.body] += 1; inventory.core[unit.core] += 1;
    if (unit.prototypeMaterial) inventory.prototype[unit.prototypeMaterial] += 1;
    const units = previous.units.filter((item) => item.id !== unit.id);
    return { ...previous, inventory, units, activeUnitId: units[0]?.id ?? '' };
  });

  const resetExperiment = () => {
    localStorage.removeItem('golem_builder_gravity_depth_v0_state');
    setState(createInitialGravityState());
  };

  const renderDecision = () => {
    if (!state.run || !activeUnit || !currentResult) return null;
    const nextDepth = (state.run.currentDepth + 1) as GravityDepth;
    const nextEvaluation = state.run.currentDepth < 4 ? evaluateGravityDepth(nextDepth, snapshotUnit(activeUnit, state.run.durability)) : null;
    return <section className={`${panel} space-y-4`}>
      <div className="flex justify-between"><div><div className="text-[10px] text-amber-400">DEPTH {currentResult.depth} COMPLETE</div><h2 className="font-bold">{DEPTH_NAMES[currentResult.depth]}</h2></div><div className="text-right"><div>UNIT CONDITION {state.run.durability}%</div><div>UNSECURED CARGO {cargoWeight} / {capacity}</div></div></div>
      <DamageBreakdown evaluation={currentResult} />
      {nextEvaluation && <div className="border-t border-[#34383D] pt-4"><div className="text-[10px] text-[#8A8F98] mb-2">NEXT DEPTH — {DEPTH_NAMES[nextDepth]}</div><DamageBreakdown evaluation={nextEvaluation} /><div className="mt-2 text-xs">DETECTED MATERIAL: {nextEvaluation.rewardPreview[0]?.prototypeMaterialId && state.knownMaterials.includes(nextEvaluation.rewardPreview[0].prototypeMaterialId) ? nextEvaluation.rewardPreview[0].name : 'UNCLASSIFIED MATERIAL'}</div></div>}
      <label className="block text-xs">DECISION REASON (TEST RECORD)<input className="mt-1 w-full bg-[#0F1113] border border-[#596069] p-2" value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} /></label>
      <div className="flex gap-2"><button className={button} onClick={beginReturn}>RETURN</button><button className={button} onClick={continueRun}>CONTINUE</button></div>
    </section>;
  };

  const renderRouteChoice = () => {
    if (!state.run || !activeUnit) return null;
    return <section className={`${panel} space-y-4`}><div><div className="text-[10px] text-amber-400">DEPTH 3 ROUTE CHOICE</div><h2 className="font-bold">FRACTURED WORKSITE / 断裂作業区</h2></div><label className="block text-xs">ROUTE REASON (TEST RECORD)<input className="mt-1 w-full bg-[#0F1113] border border-[#596069] p-2" value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} /></label><div className="grid md:grid-cols-2 gap-3">{(['POWER', 'WORK'] as GravityRoute[]).map((route) => { const evaluation = evaluateGravityDepth(3, snapshotUnit(activeUnit, state.run!.durability), route); return <button key={route} onClick={() => { recordDecision(route); applyDepth(3, route); }} className="text-left border border-[#596069] p-4 hover:border-amber-400"><div className="font-bold mb-2">{route} ROUTE</div><div className="text-xs mb-3">{route === 'POWER' ? `POWER ${activeUnit.stats.power} / 10 — force the collapsed gate` : `WORK ${activeUnit.stats.work} / 9 · MOBILITY ${activeUnit.stats.mobility} / 6 — use the service shaft`}</div><DamageBreakdown evaluation={evaluation} /><div className="text-xs mt-3">REWARD: {evaluation.rewardPreview[0].name}</div></button>; })}</div><button className={button} onClick={beginReturn}>RETURN FROM DEPTH 2</button></section>;
  };

  const renderReturn = () => {
    if (!state.run || !activeUnit) return null;
    return <section className={`${panel} space-y-4`}><div><div className="text-[10px] text-amber-400">RETURN / CARGO CONFIRMATION</div><h2 className="font-bold">REACHED DEPTH {state.run.currentDepth}{state.run.chosenRoute ? ` · ${state.run.chosenRoute} ROUTE` : ''}</h2></div><div className="space-y-2">{state.run.depthResults.map((result) => <div key={result.depth} className="border-b border-[#34383D] pb-2"><div className="font-bold text-xs">DEPTH {result.depth} — DAMAGE {result.totalDamage}</div><div className="text-[10px] text-[#8A8F98]">{result.damageSources.map((source) => `${source.label} +${source.amount}`).join(' · ')}</div></div>)}</div><div><div className="text-xs font-bold mb-2">UNSECURED CARGO — SELECTED {selectedWeight} / {capacity}</div>{state.run.unsecuredCargo.map((item) => { const selected = state.selectedCargoIds.includes(item.id); const exceeds = !selected && selectedWeight + item.weight * item.count > capacity; return <label key={item.id} className="flex gap-2 py-2 text-xs"><input type="checkbox" checked={selected} disabled={exceeds} onChange={() => setState((previous) => ({ ...previous, selectedCargoIds: selected ? previous.selectedCargoIds.filter((id) => id !== item.id) : [...previous.selectedCargoIds, item.id] }))} />{state.knownMaterials.includes(item.prototypeMaterialId as PrototypeMaterialId) || !item.prototypeMaterialId ? item.name : 'UNCLASSIFIED MATERIAL'} ×{item.count} ({item.weight * item.count} weight)</label>; })}</div><button className={button} onClick={confirmReturn}>CONFIRM RECOVERY</button></section>;
  };

  if (!activeUnit) return null;
  return <div className="min-h-screen bg-[#0F1113] text-[#E0E2E4] font-mono p-4">
    <div className="max-w-6xl mx-auto space-y-4">
      <header className="border border-rose-700 bg-rose-950/20 p-3 flex flex-wrap justify-between gap-2"><div><strong>EXPERIMENT: GRAVITY_DEPTH_V0</strong><div className="text-xs text-rose-300">NON-CANONICAL / SAVE ISOLATED</div></div><div className="flex items-center gap-3 text-xs"><span>DAY {state.day} · ACTION {state.actionsLeft}/3 · UNIT SLOTS {state.units.length}/3</span><button className={button} disabled={state.actionsLeft > 0 || !!state.run} onClick={() => setState((previous) => ({ ...previous, day: previous.day + 1, actionsLeft: 3 }))}>NEXT DAY</button></div></header>
      {state.run?.phase === 'IN_PROGRESS' && renderDecision()}
      {state.run?.phase === 'ROUTE_CHOICE' && renderRouteChoice()}
      {state.run?.phase === 'RETURNING' && renderReturn()}
      {state.run?.phase === 'DESTROYED' && <section className={`${panel} space-y-3`}><h2 className="text-rose-400 font-bold">UNIT DESTROYED — UNSECURED CARGO LOST</h2><DamageBreakdown evaluation={currentResult!} /><button className={button} onClick={() => setState((previous) => ({ ...previous, units: previous.units.map((unit) => unit.id === previous.run?.golemId ? { ...unit, durability: 0 } : unit), run: null }))}>RETURN TO FOUNDRY</button></section>}
      {state.run?.phase === 'COMPLETE' && <section className={`${panel} space-y-3`}><h2 className="font-bold">DISASSEMBLY OF RESULTS / 帰還報告</h2><div>UNIT CONDITION {state.run.durability}% · DEPTH {state.run.currentDepth}</div><label className="block text-xs">MY NEXT HYPOTHESIS<textarea className="mt-2 w-full bg-[#0F1113] border border-[#596069] p-3" value={state.nextHypothesis} onChange={(event) => setState((previous) => ({ ...previous, nextHypothesis: event.target.value }))} placeholder="このUNITで次に改善できる点" /></label><button className={button} onClick={finishReport}>CLOSE REPORT</button></section>}
      {!state.run && <>
        <section className={`${panel} space-y-3`}><div className="flex justify-between"><div><div className="text-[10px] text-amber-400">ANOMALOUS ZONE G-01</div><h1 className="text-xl font-bold">重力異常区域</h1></div><button className={button} onClick={resetExperiment}>RESET EXPERIMENT</button></div><select className="bg-[#0F1113] border border-[#596069] p-2" value={state.activeUnitId} onChange={(event) => setState((previous) => ({ ...previous, activeUnitId: event.target.value }))}>{state.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name} · DUR {unit.durability}%</option>)}</select><UnitFacts unit={activeUnit} />{depthOnePreview && <DamageBreakdown evaluation={depthOnePreview} />}<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-[#B8BDC4]">{([1,2,3,4] as GravityDepth[]).map((depth) => <div key={depth} className="border border-[#34383D] p-2">DEPTH {depth}<br />{DEPTH_NAMES[depth]}</div>)}</div><button className={button} disabled={state.actionsLeft <= 0 || activeUnit.durability <= 0} onClick={deploy}>DEPLOY — 1 ACTION</button></section>
        <section className={`${panel} space-y-3`}><h2 className="font-bold">TEMPORARY UNIT COMPARISON</h2><div className="text-[10px] text-[#8A8F98]">CURRENT UNIT + UP TO 2 PRE-FABRICATION CANDIDATES · NO SCORE / NO WINNER</div><div className="grid md:grid-cols-3 gap-2">{[activeUnit, ...state.comparisonCandidates].map((unit) => <div key={unit.id} className="border border-[#34383D] p-3"><div className="font-bold text-xs mb-2">{unit.id === activeUnit.id ? 'CURRENT UNIT' : 'CANDIDATE'} — {unit.name}</div><UnitFacts unit={unit} />{([1, 2, 4] as GravityDepth[]).map((depth) => { const evaluation = evaluateGravityDepth(depth, snapshotUnit(unit)); return <div key={depth} className="text-[10px] mt-2">D{depth}: {evaluation.damageSources.map((source) => `${source.label} +${source.amount}`).join(' · ')}</div>; })}</div>)}</div></section>
        <section className={`${panel} space-y-3`}><h2 className="font-bold">EXPERIMENTAL FABRICATION</h2><div className="grid sm:grid-cols-4 gap-2"><select value={buildBody} onChange={(e) => setBuildBody(e.target.value as BodyType)} className="bg-[#0F1113] border border-[#596069] p-2">{ALL_BUILD_PARTS.bodies.map((id) => <option key={id} value={id}>{BODIES[id].nameEn} ×{state.inventory.body[id]}</option>)}</select><select value={buildCore} onChange={(e) => setBuildCore(e.target.value as CoreType)} className="bg-[#0F1113] border border-[#596069] p-2">{ALL_BUILD_PARTS.cores.map((id) => <option key={id} value={id}>{CORES[id].nameEn} ×{state.inventory.core[id]}</option>)}</select><select value={buildRune} onChange={(e) => setBuildRune(e.target.value as RuneType)} className="bg-[#0F1113] border border-[#596069] p-2">{ALL_BUILD_PARTS.runes.map((id) => <option key={id} value={id}>{RUNES[id].nameEn} ×{state.inventory.rune[id]}</option>)}</select><select value={buildMaterial} onChange={(e) => setBuildMaterial(e.target.value as PrototypeMaterialId | '')} className="bg-[#0F1113] border border-[#596069] p-2"><option value="">NO PROTOTYPE MATERIAL</option>{Object.entries(PROTOTYPE_MATERIALS).map(([id, material]) => <option key={id} value={id}>{state.knownMaterials.includes(id as PrototypeMaterialId) ? material.name : 'UNCLASSIFIED MATERIAL'} ×{state.inventory.prototype[id as PrototypeMaterialId]}</option>)}</select></div><div className="flex gap-2"><button className={button} onClick={pinBuildCandidate}>PIN CANDIDATE</button><button className={button} onClick={buildUnit} disabled={state.actionsLeft <= 0 || state.units.length >= 3}>FABRICATE — 1 ACTION</button></div><div className="space-y-2">{state.units.map((unit) => <div key={unit.id} className="flex flex-wrap justify-between gap-2 border-t border-[#34383D] pt-2 text-xs"><span>{unit.name} · DUR {unit.durability}% · {unit.body}/{unit.core}/{unit.rune}</span><span className="flex gap-2"><button className={button} onClick={() => repair(unit)}>REPAIR</button><button className={button} disabled={unit.isStarter} onClick={() => disassemble(unit)}>DISASSEMBLE</button></span></div>)}</div></section>
      </>}
    </div>
  </div>;
}
