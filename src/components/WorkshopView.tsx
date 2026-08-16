import React, { useEffect, useState } from 'react';
import { Hammer, Zap, Shield, Sparkles, CheckCircle2, AlertTriangle, RefreshCw, Compass, Footprints, Pickaxe, Info, Lock, Check, Eye } from 'lucide-react';
import { BodyType, CoreType, RuneType, MaterialCount, Golem, TraitType } from '../types';
import {
  BODIES,
  CORES,
  RUNES,
  TRAITS,
  EXPEDITION_REGIONS,
  calculateGolemStats,
  getGolemTraits,
  generateGolemName,
  predictExpeditionOutcome,
} from '../data/gameData';
import { GolemVisual } from './GolemVisual';
import { soundFx } from '../utils/audio';
import {
  BLUEPRINT_PURPOSE_TAG_OPTIONS,
  isLegalDesign,
  resolveBlueprint,
  type Blueprint,
  type BlueprintPartIds,
  type BlueprintSource,
} from '../domain/blueprintLibrary';

interface WorkshopViewProps {
  inventory: MaterialCount;
  discoveredTraits: TraitType[];
  onFabricateGolem: (parts: BlueprintPartIds, source: BlueprintSource, blueprintId?: string) => Golem | null;
  onGoToExpedition: () => void;
  canAct: boolean;
  golemCount: number;
  maxGolems: number;
  blueprints: Blueprint[];
  onSaveOpportunityPresented: (designSignature: string) => { opportunityId: string; alreadySaved: boolean };
  onSaveBlueprint: (opportunityId: string, parts: BlueprintPartIds, purposeTagIds: string[], loadedBlueprintId?: string) => void;
  onBlueprintLoaded: (blueprintId: string) => void;
  onBlueprintApplied: (blueprintId: string) => void;
  onBlueprintModified: (blueprintId: string) => void;
}

export const WorkshopView: React.FC<WorkshopViewProps> = ({
  inventory,
  discoveredTraits,
  onFabricateGolem,
  onGoToExpedition,
  canAct,
  golemCount,
  maxGolems,
  blueprints,
  onSaveOpportunityPresented,
  onSaveBlueprint,
  onBlueprintLoaded,
  onBlueprintApplied,
  onBlueprintModified,
}) => {
  // Selection states
  const [selectedBody, setSelectedBody] = useState<BodyType>('stone');
  const [selectedCore, setSelectedCore] = useState<CoreType>('fire');
  const [selectedRune, setSelectedRune] = useState<RuneType>('attack');
  const [targetRegionId, setTargetRegionId] = useState<string>('region_quarry');
  const [showSynergyGuide, setShowSynergyGuide] = useState<boolean>(false);
  const [loadedBlueprintId, setLoadedBlueprintId] = useState<string | undefined>();
  const [blueprintModified, setBlueprintModified] = useState(false);
  const [selectedPurposeTagIds, setSelectedPurposeTagIds] = useState<string[]>(['GENERAL']);
  const [blueprintLoadError, setBlueprintLoadError] = useState<string | null>(null);
  const [saveOpportunity, setSaveOpportunity] = useState<{ opportunityId: string; alreadySaved: boolean }>();

  // Animation states
  const [isBuilding, setIsBuilding] = useState(false);
  const [builtSuccessGolem, setBuiltSuccessGolem] = useState<Golem | null>(null);

  // Check material availability
  const hasBodyMat = (inventory.body[selectedBody] || 0) > 0;
  const hasCoreMat = (inventory.core[selectedCore] || 0) > 0;
  const hasRuneMat = (inventory.rune[selectedRune] || 0) > 0;
  const hasFreeSlot = golemCount < maxGolems;
  const canBuild = hasBodyMat && hasCoreMat && hasRuneMat && canAct && hasFreeSlot;

  // Real-time projected stats, traits & name
  const projectedStats = calculateGolemStats(selectedBody, selectedCore, selectedRune);
  const projectedTraits = getGolemTraits(selectedBody, selectedCore, selectedRune);
  const projectedName = generateGolemName(selectedBody, selectedCore, selectedRune);

  useEffect(() => {
    const parts: BlueprintPartIds = {
      frame_id: selectedBody,
      reactor_id: selectedCore,
      control_sigil_id: selectedRune,
    };
    if (!isLegalDesign(parts)) {
      setSaveOpportunity(undefined);
      return;
    }
    const designSignature = `${parts.frame_id}:${parts.reactor_id}:${parts.control_sigil_id}`;
    setSaveOpportunity(onSaveOpportunityPresented(designSignature));
  }, [selectedBody, selectedCore, selectedRune, onSaveOpportunityPresented]);

  useEffect(() => {
    if (!loadedBlueprintId || blueprintModified) return;
    const loaded = blueprints.find((item) => item.blueprint_id === loadedBlueprintId);
    if (!loaded) return;
    const partsChanged = loaded.part_ids.frame_id !== selectedBody || loaded.part_ids.reactor_id !== selectedCore || loaded.part_ids.control_sigil_id !== selectedRune;
    const purposeChanged = loaded.purpose_tag_ids.length !== selectedPurposeTagIds.length
      || loaded.purpose_tag_ids.some((tagId) => !selectedPurposeTagIds.includes(tagId));
    const changed = partsChanged || purposeChanged;
    if (changed) {
      setBlueprintModified(true);
      onBlueprintModified(loadedBlueprintId);
    }
  }, [selectedBody, selectedCore, selectedRune, selectedPurposeTagIds, loadedBlueprintId, blueprintModified, blueprints, onBlueprintModified]);

  const loadBlueprint = (blueprint: Blueprint) => {
    const resolution = resolveBlueprint({ version: 1, blueprints }, blueprint.blueprint_id);
    if (resolution.ok === false) {
      setBlueprintLoadError(`REFERENCE UNAVAILABLE: ${resolution.unavailableIds.join(', ')}`);
      return;
    }
    setSelectedBody(resolution.design.frame_id);
    setSelectedCore(resolution.design.reactor_id);
    setSelectedRune(resolution.design.control_sigil_id);
    setSelectedPurposeTagIds(resolution.blueprint.purpose_tag_ids.length ? resolution.blueprint.purpose_tag_ids : ['GENERAL']);
    setLoadedBlueprintId(resolution.blueprint.blueprint_id);
    setBlueprintModified(false);
    setBlueprintLoadError(null);
    onBlueprintLoaded(resolution.blueprint.blueprint_id);
    onBlueprintApplied(resolution.blueprint.blueprint_id);
  };

  const togglePurposeTag = (tagId: string) => {
    setSelectedPurposeTagIds((current) => {
      if (tagId === 'GENERAL') return ['GENERAL'];
      const withoutGeneral = current.filter((id) => id !== 'GENERAL');
      const next = withoutGeneral.includes(tagId)
        ? withoutGeneral.filter((id) => id !== tagId)
        : [...withoutGeneral, tagId];
      return next.length ? next : ['GENERAL'];
    });
  };

  const saveCurrentBlueprint = (loadedId?: string) => {
    if (!saveOpportunity) return;
    onSaveBlueprint(
      saveOpportunity.opportunityId,
      { frame_id: selectedBody, reactor_id: selectedCore, control_sigil_id: selectedRune },
      selectedPurposeTagIds,
      loadedId,
    );
    setSaveOpportunity({ ...saveOpportunity, alreadySaved: true });
    if (loadedId) setBlueprintModified(false);
  };

  // Target Region Assessment Simulation Engine
  const targetRegion = EXPEDITION_REGIONS.find((r) => r.id === targetRegionId) || EXPEDITION_REGIONS[0];
  const prediction = predictExpeditionOutcome(targetRegion, projectedStats, projectedTraits);

  const handleBuild = () => {
    if (!canBuild || isBuilding) return;

    soundFx.playBuild();
    setIsBuilding(true);
    setBuiltSuccessGolem(null);

    setTimeout(() => {
      const fabricated = onFabricateGolem(
        { frame_id: selectedBody, reactor_id: selectedCore, control_sigil_id: selectedRune },
        loadedBlueprintId ? (blueprintModified ? 'BLUEPRINT_MODIFIED' : 'BLUEPRINT_DIRECT') : 'MANUAL_NEW',
        loadedBlueprintId,
      );
      setIsBuilding(false);
      setBuiltSuccessGolem(fabricated);
    }, 900);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-5">
      {/* Title banner */}
      <div className="bg-[#15181C] p-4 rounded-xs border border-[#2D3135] shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-mono text-[10px] uppercase tracking-widest mb-0.5">
              <Sparkles className="w-3.5 h-3.5" /> EXPERIMENTAL FOUNDRY — GOLEM BUILDER
            </div>
            <h2 className="text-lg font-bold text-[#E0E2E4] tracking-wider font-mono">
              異常区域に適合するゴーレム機を設計・製造
            </h2>
            <p className="text-xs text-[#8A8F98] font-mono mt-0.5">
              機体骨格・駆動炉心・制御刻印の組み合わせを検査し、適応特性を確定します。
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                soundFx.playClick();
                setShowSynergyGuide(!showSynergyGuide);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-[#1A1C1E] hover:bg-[#2D3135] text-amber-400 text-xs font-mono border border-amber-500/30 transition-all shadow shrink-0"
            >
              <Info className="w-3.5 h-3.5" />
              シナジー図鑑 ({discoveredTraits.length}/{Object.keys(TRAITS).length})
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                const bodies: BodyType[] = ['stone', 'iron', 'wood', 'clay'];
                const cores: CoreType[] = ['fire', 'water', 'wind', 'earth'];
                const runes: RuneType[] = ['attack', 'defense', 'speed', 'regen'];

                const availBodies = bodies.filter((b) => (inventory.body[b] || 0) > 0);
                const availCores = cores.filter((c) => (inventory.core[c] || 0) > 0);
                const availRunes = runes.filter((r) => (inventory.rune[r] || 0) > 0);

                if (availBodies.length > 0) setSelectedBody(availBodies[Math.floor(Math.random() * availBodies.length)]);
                if (availCores.length > 0) setSelectedCore(availCores[Math.floor(Math.random() * availCores.length)]);
                if (availRunes.length > 0) setSelectedRune(availRunes[Math.floor(Math.random() * availRunes.length)]);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-[#121417] hover:bg-[#1A1C1E] text-[#E0E2E4] text-xs font-mono border border-[#2D3135] transition-all shadow shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              ランダム選択
            </button>
          </div>
        </div>
      </div>

      <section className="bg-[#121417] border border-cyan-700/40 p-4 rounded-xs font-mono space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[10px] text-cyan-400 tracking-widest">R2_BLUEPRINT_LIBRARY / CANONICAL HOLD</div>
            <h3 className="text-sm font-bold text-[#E0E2E4]">設計知ライブラリ</h3>
            <div className="text-[10px] text-[#8A8F98]">PART IDS ONLY · BLUEPRINT ≠ UNIT · SAVE/LOAD COST 0</div>
          </div>
          <div className="flex gap-2">
            {loadedBlueprintId && blueprintModified && <button onClick={() => saveCurrentBlueprint(loadedBlueprintId)} disabled={!saveOpportunity} className="px-3 py-1.5 text-xs border border-cyan-600 text-cyan-300 disabled:opacity-40">UPDATE LOADED</button>}
            <button onClick={() => saveCurrentBlueprint()} disabled={!saveOpportunity || saveOpportunity.alreadySaved} className="px-3 py-1.5 text-xs border border-cyan-600 text-cyan-300 disabled:opacity-40">SAVE AS NEW</button>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="text-[10px] text-[#8A8F98]">INTENDED USE · DESIGN KNOWLEDGE ONLY · NO GAMEPLAY EFFECT</div>
          <div className="flex flex-wrap gap-1.5">
            {BLUEPRINT_PURPOSE_TAG_OPTIONS.map((tag) => {
              const selected = selectedPurposeTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  title={tag.description}
                  aria-pressed={selected}
                  onClick={() => togglePurposeTag(tag.id)}
                  className={`px-2 py-1 text-[10px] border ${selected ? 'border-cyan-500 bg-cyan-950/50 text-cyan-200' : 'border-[#2D3135] text-[#8A8F98]'}`}
                >
                  {tag.label} / {tag.id}
                </button>
              );
            })}
          </div>
        </div>
        {loadedBlueprintId && <div className="text-[10px] text-cyan-300">{blueprintModified ? 'MODIFIED AFTER LOAD' : `LOADED / APPLIED: ${loadedBlueprintId}`}</div>}
        {blueprintLoadError && <div role="alert" className="text-[10px] text-rose-300 border border-rose-800/70 bg-rose-950/30 px-2 py-1.5">{blueprintLoadError}</div>}
        {blueprints.length === 0 ? <div className="text-xs text-[#596069]">NO SAVED BLUEPRINTS</div> : <div className="grid md:grid-cols-2 gap-2">{blueprints.map((blueprint) => (
          <div key={blueprint.blueprint_id} className="border border-[#2D3135] p-2 flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0"><strong className="break-all">{blueprint.blueprint_id}</strong><div className="text-[10px] text-[#8A8F98]">{blueprint.part_ids.frame_id} / {blueprint.part_ids.reactor_id} / {blueprint.part_ids.control_sigil_id}</div><div className="text-[9px] text-cyan-400 mt-1">{blueprint.purpose_tag_ids.length ? blueprint.purpose_tag_ids.join(' · ') : 'GENERAL'}</div></div>
            <button onClick={() => loadBlueprint(blueprint)} className="px-2 py-1 border border-[#596069] text-[#B8BDC4]">LOAD</button>
          </div>
        ))}</div>}
      </section>

      {/* Synergy Recipe Guide Modal/Drawer (Discovery based) */}
      {showSynergyGuide && (
        <div className="bg-[#121417] border border-amber-500/40 p-4 rounded-xs font-mono space-y-3 animate-fade-in shadow-xl">
          <div className="flex items-center justify-between border-b border-[#2D3135] pb-2">
            <h3 className="text-xs font-bold text-amber-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> パーツ組み合わせ・シナジー特性発見図鑑
            </h3>
            <button
              onClick={() => setShowSynergyGuide(false)}
              className="text-[#8A8F98] hover:text-[#E0E2E4] text-xs font-bold"
            >
              [閉じる]
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {Object.values(TRAITS).map((t) => {
              const isDiscovered = discoveredTraits.includes(t.id);

              return (
                <div key={t.id} className="p-2.5 bg-[#0F1113] rounded-xs border border-[#2D3135] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${t.badgeBg} ${t.badgeBorder} ${t.textColor}`}>
                      {t.icon} 【{t.name}】
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-[#1A1C1E] text-[#8A8F98]">
                      {isDiscovered ? '🔓 発見済' : '🔒 未発見ヒント'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8A8F98]">{t.description}</p>

                  <div className="text-[10px] bg-[#1A1C1E] p-1.5 rounded-xs border border-[#2D3135]">
                    {isDiscovered ? (
                      <span className="text-amber-300 font-semibold">
                        発現レシピ: {t.synergyRecipe}
                      </span>
                    ) : (
                      <span className="text-[#8A8F98] italic">
                        ヒント: {t.description.slice(0, 15)}...と特定の素材を掛け合わせると発現
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid: Selectors vs Live Visual Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Area: 3 Vertical Slotted Material Selectors (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* 1. BODY Selector */}
          <div className="bg-[#121417] rounded-xs border border-[#2D3135] shadow-sm overflow-hidden flex flex-col">
            <div className="bg-[#1A1C1E] px-3 py-2 border-b border-[#2D3135] flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-[#E0E2E4] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-xs bg-amber-500/20 text-amber-400 font-mono text-[10px] flex items-center justify-center border border-amber-500/30">
                  1
                </span>
                1. 機体骨格 (FRAME)
              </label>
              <span className="text-[10px] font-mono text-[#8A8F98]">
                在庫:<strong className="text-amber-400 font-bold ml-1">{inventory.body[selectedBody] || 0}</strong>
              </span>
            </div>

            <div className="p-2 space-y-1.5 flex-1">
              {(Object.keys(BODIES) as BodyType[]).map((key) => {
                const b = BODIES[key];
                const count = inventory.body[key] || 0;
                const isSelected = selectedBody === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedBody(key);
                    }}
                    className={`w-full p-2 rounded-xs border text-left transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-[#1A1C1E] border-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.12)]'
                        : 'bg-[#0F1113] border-[#2D3135] hover:border-[#42464D] hover:bg-[#15181C]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold font-mono text-[#E0E2E4] text-xs">{b.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-xs font-mono ${
                          count > 0
                            ? 'bg-[#121417] text-amber-400 border border-amber-500/30'
                            : 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
                        }`}
                      >
                        x{count}
                      </span>
                    </div>

                    <div className="text-[10px] text-[#8A8F98] font-mono flex items-center justify-between gap-1 border-t border-[#2D3135]/40 pt-1">
                      <span className="text-rose-400">P:{b.stats.power}</span>
                      <span className="text-blue-400">A:{b.stats.armor}</span>
                      <span className="text-emerald-400">M:{b.stats.mobility}</span>
                      <span className="text-amber-400">W:{b.stats.work}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. CORE Selector */}
          <div className="bg-[#121417] rounded-xs border border-[#2D3135] shadow-sm overflow-hidden flex flex-col">
            <div className="bg-[#1A1C1E] px-3 py-2 border-b border-[#2D3135] flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-[#E0E2E4] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-xs bg-cyan-500/20 text-cyan-400 font-mono text-[10px] flex items-center justify-center border border-cyan-500/30">
                  2
                </span>
                2. 駆動炉心 (REACTOR)
              </label>
              <span className="text-[10px] font-mono text-[#8A8F98]">
                在庫:<strong className="text-cyan-400 font-bold ml-1">{inventory.core[selectedCore] || 0}</strong>
              </span>
            </div>

            <div className="p-2 space-y-1.5 flex-1">
              {(Object.keys(CORES) as CoreType[]).map((key) => {
                const c = CORES[key];
                const count = inventory.core[key] || 0;
                const isSelected = selectedCore === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedCore(key);
                    }}
                    className={`w-full p-2 rounded-xs border text-left transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-[#1A1C1E] border-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.12)]'
                        : 'bg-[#0F1113] border-[#2D3135] hover:border-[#42464D] hover:bg-[#15181C]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold font-mono text-[#E0E2E4] text-xs flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: c.glowColor }}
                        />
                        {c.name}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-xs font-mono ${
                          count > 0
                            ? 'bg-[#121417] text-cyan-400 border border-cyan-500/30'
                            : 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
                        }`}
                      >
                        x{count}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8A8F98] leading-tight">{c.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. RUNE Selector */}
          <div className="bg-[#121417] rounded-xs border border-[#2D3135] shadow-sm overflow-hidden flex flex-col">
            <div className="bg-[#1A1C1E] px-3 py-2 border-b border-[#2D3135] flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-[#E0E2E4] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-xs bg-purple-500/20 text-purple-400 font-mono text-[10px] flex items-center justify-center border border-purple-500/30">
                  3
                </span>
                3. 制御刻印 (CONTROL SIGIL)
              </label>
              <span className="text-[10px] font-mono text-[#8A8F98]">
                在庫:<strong className="text-purple-400 font-bold ml-1">{inventory.rune[selectedRune] || 0}</strong>
              </span>
            </div>

            <div className="p-2 space-y-1.5 flex-1">
              {(Object.keys(RUNES) as RuneType[]).map((key) => {
                const r = RUNES[key];
                const count = inventory.rune[key] || 0;
                const isSelected = selectedRune === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedRune(key);
                    }}
                    className={`w-full p-2 rounded-xs border text-left transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-[#1A1C1E] border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.12)]'
                        : 'bg-[#0F1113] border-[#2D3135] hover:border-[#42464D] hover:bg-[#15181C]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold font-mono text-[#E0E2E4] text-xs flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: r.symbolColor }}
                        />
                        {r.name}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-xs font-mono ${
                          count > 0
                            ? 'bg-[#121417] text-purple-400 border border-purple-500/30'
                            : 'bg-rose-950/40 text-rose-400 border border-rose-800/40'
                        }`}
                      >
                        x{count}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8A8F98] leading-tight">{r.traitEffect}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Golem Preview & Target Destination Assessment (5 cols) */}
        <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-20">
          <div className="bg-[#121417] border border-[#2D3135] rounded-xs shadow-md p-3.5 space-y-3 font-mono">
            {/* Combination Title Banner */}
            <div className="bg-[#1A1C1E] border-b border-[#2D3135] p-2.5 -mx-3.5 -mt-3.5 text-center flex flex-col items-center justify-center gap-1">
              <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">
                [設計中のゴーレム]
              </div>
              <h3 className="text-base font-extrabold text-[#E0E2E4] tracking-wide uppercase">
                {projectedName}
              </h3>

              {/* Trait badges active */}
              <div className="flex items-center gap-1 flex-wrap justify-center pt-0.5 min-h-[22px]">
                {projectedTraits.length === 0 ? (
                  <span className="text-[10px] text-[#8A8F98] italic">発現シナジー特性なし (標準型)</span>
                ) : (
                  projectedTraits.map((t) => (
                    <span
                      key={t}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-xs border flex items-center gap-1 ${TRAITS[t].badgeBg} ${TRAITS[t].badgeBorder} ${TRAITS[t].textColor}`}
                    >
                      <span>{TRAITS[t].icon}</span>
                      <span>【{TRAITS[t].name}】</span>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Split layout: Visual Display & Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
              {/* Visual Golem Display */}
              <div className="sm:col-span-5 bg-[#0F1113] p-2 rounded-xs border border-[#2D3135] flex flex-col items-center justify-center relative overflow-hidden min-h-[170px]">
                <div
                  className="absolute w-36 h-36 rounded-full blur-2xl opacity-20 pointer-events-none"
                  style={{ backgroundColor: CORES[selectedCore].glowColor }}
                />

                <GolemVisual
                  body={selectedBody}
                  core={selectedCore}
                  rune={selectedRune}
                  size="md"
                  animationState={isBuilding ? 'damaged' : 'idle'}
                />
              </div>

              {/* Parameters Breakdown */}
              <div className="sm:col-span-7 space-y-1.5 bg-[#0F1113] p-2 rounded-xs border border-[#2D3135]">
                <div className="text-[10px] text-[#8A8F98] uppercase tracking-wider font-bold border-b border-[#2D3135] pb-1">
                  4大能力値
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <Zap className="w-3 h-3" /> POWER
                    </span>
                    <span className="text-[#E0E2E4] font-bold">{projectedStats.power}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-blue-400 font-semibold flex items-center gap-1">
                      <Shield className="w-3 h-3" /> ARMOR
                    </span>
                    <span className="text-[#E0E2E4] font-bold">{projectedStats.armor}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Footprints className="w-3 h-3" /> MOBILITY
                    </span>
                    <span className="text-[#E0E2E4] font-bold">{projectedStats.mobility}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <Pickaxe className="w-3 h-3" /> WORK
                    </span>
                    <span className="text-[#E0E2E4] font-bold">{projectedStats.work}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Destination Assessment Engine */}
            <div className="bg-[#1A1C1E] p-3 rounded-xs border border-[#2D3135] space-y-2.5 font-mono">
              <div className="flex items-center justify-between border-b border-[#2D3135] pb-1.5">
                <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-400" /> 🎯 攻略シミュレーター
                </span>
                <select
                  value={targetRegionId}
                  onChange={(e) => setTargetRegionId(e.target.value)}
                  className="bg-[#0F1113] border border-[#2D3135] text-xs font-bold text-[#E0E2E4] px-2 py-0.5 rounded-xs focus:outline-none focus:border-amber-500"
                >
                  {EXPEDITION_REGIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.icon} {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Real-time Status Prediction Badge */}
              <div className="flex items-center justify-between p-2 rounded-xs bg-[#0F1113] border border-[#2D3135]">
                <div className="text-[10px] text-[#8A8F98]">予測判定結果:</div>
                <div>
                  {prediction.statusPrediction === 'BLOCKED' && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-xs bg-rose-950/80 text-rose-300 border border-rose-600/80 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> 出撃不能 (必須キー不保持)
                    </span>
                  )}
                  {prediction.statusPrediction === 'DANGER' && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-xs bg-rose-900/60 text-rose-300 border border-rose-500/80 flex items-center gap-1">
                      🚨 大破危険 (全損可能性高)
                    </span>
                  )}
                  {prediction.statusPrediction === 'PARTIAL' && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-xs bg-amber-900/60 text-amber-300 border border-amber-500/80 flex items-center gap-1">
                      ⚠️ 中破注意 (受傷多・素材回収減)
                    </span>
                  )}
                  {prediction.statusPrediction === 'SAFE' && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-xs bg-emerald-950/80 text-emerald-300 border border-emerald-500/80 flex items-center gap-1">
                      👍 安全生還 (安定回収可能)
                    </span>
                  )}
                </div>
              </div>

              {/* Predicted Damage Range */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-[#8A8F98]">予測受傷度:</span>
                <span
                  className={`font-extrabold font-mono text-xs ${
                    prediction.maxEstimatedDamage >= 100
                      ? 'text-rose-400 animate-pulse'
                      : prediction.maxEstimatedDamage >= 50
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  約 {prediction.minEstimatedDamage}% 〜 {prediction.maxEstimatedDamage}%
                </span>
              </div>

              {/* Stat breakdown match grid */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-1 border-t border-[#2D3135]">
                <div className="flex items-center justify-between p-1 bg-[#0F1113] rounded-xs">
                  <span className="text-rose-400">POWER</span>
                  <span className={prediction.statAnalysis.power.ok ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {prediction.statAnalysis.power.current} / {prediction.statAnalysis.power.required} {prediction.statAnalysis.power.ok ? '✓' : '✕'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-1 bg-[#0F1113] rounded-xs">
                  <span className="text-blue-400">ARMOR</span>
                  <span className={prediction.statAnalysis.armor.ok ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {prediction.statAnalysis.armor.current} / {prediction.statAnalysis.armor.required} {prediction.statAnalysis.armor.ok ? '✓' : '✕'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-1 bg-[#0F1113] rounded-xs">
                  <span className="text-emerald-400">MOBILITY</span>
                  <span className={prediction.statAnalysis.mobility.ok ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {prediction.statAnalysis.mobility.current} / {prediction.statAnalysis.mobility.required} {prediction.statAnalysis.mobility.ok ? '✓' : '✕'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-1 bg-[#0F1113] rounded-xs">
                  <span className="text-amber-400">WORK</span>
                  <span className={prediction.statAnalysis.work.ok ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {prediction.statAnalysis.work.current} / {prediction.statAnalysis.work.required} {prediction.statAnalysis.work.ok ? '✓' : '✕'}
                  </span>
                </div>
              </div>
            </div>

            {/* Build Button or Material Warning */}
            <div>
              {!canBuild ? (
                <div className="bg-rose-950/40 border border-rose-800/80 p-3 rounded-xs text-rose-300 text-xs text-left font-mono space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-200">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    {!canAct ? '本日のACTIONを使い切りました' : !hasFreeSlot ? `保有枠が満杯です（${golemCount}/${maxGolems}）` : '選択中パーツの素材が不足しています'}
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {!hasFreeSlot ? '保管所で既存ゴーレムを解体して空き枠を作ってください。' : !canAct ? '「次の日へ」でACTIONを回復してください。' : '在庫のある他の素材を選択するか、遠征で素材を獲得してください。'}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleBuild}
                  disabled={isBuilding}
                  className={`w-full py-3.5 px-4 rounded-xs font-mono font-extrabold text-xs tracking-widest uppercase transition-all border ${
                    isBuilding
                      ? 'bg-amber-600/50 text-black border-amber-500 cursor-wait'
                      : 'border-amber-500/80 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                  }`}
                >
                  {isBuilding ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      パーツ組み上げ中...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Hammer className="w-4 h-4" />
                      ゴーレムを錬成・構築する
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Completion Success Banner */}
            {builtSuccessGolem && (
              <div className="bg-[#121417] border border-emerald-500/60 p-3.5 rounded-xs text-left space-y-2.5 font-mono shadow-lg">
                <div className="flex items-center justify-between text-emerald-400 font-bold text-xs">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 錬成完了！
                  </span>
                </div>
                <p className="text-xs text-[#E0E2E4]">
                  <strong className="text-amber-400">{builtSuccessGolem.name}</strong> を組み上げました。
                </p>
                <button
                  onClick={() => {
                    soundFx.playClick();
                    onGoToExpedition();
                  }}
                  className="w-full py-2 px-3 rounded-xs bg-amber-500 text-black font-extrabold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all shadow flex items-center justify-center gap-1.5"
                >
                  <Compass className="w-4 h-4" /> 遠征地図へ出撃
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
