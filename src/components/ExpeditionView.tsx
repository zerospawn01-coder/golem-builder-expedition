import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  Shield,
  Zap,
  Footprints,
  Pickaxe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Hammer,
  RotateCcw,
  Package,
  Lock,
} from 'lucide-react';
import {
  ExpeditionRegion,
  Golem,
  MaterialCount,
  MaterialCategory,
  ExpeditionReport,
} from '../types';
import {
  EXPEDITION_REGIONS,
  TRAITS,
  predictExpeditionOutcome,
  runExpeditionSimulation,
} from '../data/gameData';
import { GolemVisual } from './GolemVisual';
import { soundFx } from '../utils/audio';
import { cMultiAxisExperiment, evaluateCMultiAxis, ROUTE_LABELS, type CMultiAxisEvaluation } from '../data/cMultiAxis';

interface ExpeditionViewProps {
  golemList: Golem[];
  inventory: MaterialCount;
  onAddMaterials: (
    loots: Array<{ category: MaterialCategory; id: string; name: string; count: number }>
  ) => void;
  onUpdateGolem: (updatedGolem: Golem) => void;
  onGoToWorkshop: () => void;
  canAct: boolean;
  onConsumeAction: () => boolean;
}

export const ExpeditionView: React.FC<ExpeditionViewProps> = ({
  golemList,
  onAddMaterials,
  onUpdateGolem,
  onGoToWorkshop,
  canAct,
  onConsumeAction,
}) => {
  // Region selection
  const [selectedRegionId, setSelectedRegionId] = useState<string>('region_quarry');
  const [selectedGolemId, setSelectedGolemId] = useState<string>(golemList[0]?.id || '');

  // Simulation execution & report
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentReport, setCurrentReport] = useState<ExpeditionReport | null>(null);
  const [selectedLootIndexes, setSelectedLootIndexes] = useState<number[]>([]);
  const [lootClaimed, setLootClaimed] = useState(false);
  const [expeditionCargoCapacity, setExpeditionCargoCapacity] = useState(0);
  const [reportRoute, setReportRoute] = useState<CMultiAxisEvaluation | null>(null);
  const cUiExperiment = new URLSearchParams(window.location.search).get('experiment') === 'C_UI_COMPREHENSION';

  const selectedRegion =
    EXPEDITION_REGIONS.find((r) => r.id === selectedRegionId) || EXPEDITION_REGIONS[0];
  const selectedGolem =
    golemList.find((g) => g.id === selectedGolemId) || golemList[0] || null;

  // Access key check
  const hasAccessKey =
    !selectedRegion.accessTrait ||
    (selectedGolem && selectedGolem.traits.includes(selectedRegion.accessTrait));

  const hasResistKey =
    !selectedRegion.resistTrait ||
    (selectedGolem && selectedGolem.traits.includes(selectedRegion.resistTrait));

  const prediction = selectedGolem
    ? predictExpeditionOutcome(
        selectedRegion,
        selectedGolem.stats,
        selectedGolem.traits,
        selectedGolem.durability,
        cUiExperiment && selectedRegion.id === 'region_ruins' ? cMultiAxisExperiment(selectedRegion) : undefined,
      )
    : null;
  const cRoutePrediction = cUiExperiment && selectedRegion.id === 'region_ruins' && selectedGolem
    ? evaluateCMultiAxis(selectedGolem.stats, selectedGolem.traits.includes('heat_proof'), selectedRegion, selectedGolem.durability)
    : null;
  const hasPendingCargo = !!currentReport && currentReport.status !== 'FAILED' && currentReport.loots.length > 0 && !lootClaimed;

  const handleStartExpedition = () => {
    if (!selectedGolem || !hasAccessKey || isSimulating || hasPendingCargo || !canAct || !onConsumeAction()) return;

    soundFx.playClick();
    setIsSimulating(true);
    setCurrentReport(null);
    setSelectedLootIndexes([]);
    setLootClaimed(false);
    setReportRoute(null);
    setExpeditionCargoCapacity(selectedGolem.stats.work * 2);

    // Simulate swift expedition events
    setTimeout(() => {
      const routeEvaluation = cUiExperiment && selectedRegion.id === 'region_ruins'
        ? evaluateCMultiAxis(selectedGolem.stats, selectedGolem.traits.includes('heat_proof'), selectedRegion, selectedGolem.durability)
        : null;
      const report = runExpeditionSimulation(
        selectedRegion,
        selectedGolem,
        Math.random,
        routeEvaluation ? cMultiAxisExperiment(selectedRegion) : undefined,
      );
      setIsSimulating(false);
      setCurrentReport(report);
      setReportRoute(routeEvaluation);

      if (report.status === 'FAILED') {
        soundFx.playClick();
      } else {
        soundFx.playVictory();
      }

      // Update golem durability and expedition count
      const newDurability = Math.max(0, selectedGolem.durability - report.totalDamage);
      onUpdateGolem({
        ...selectedGolem,
        durability: newDurability,
        expeditionsCount: selectedGolem.expeditionsCount + 1,
      });
    }, 1100);
  };

  const cargoCapacity = currentReport ? expeditionCargoCapacity : (selectedGolem ? selectedGolem.stats.work * 2 : 0);
  const selectedCargoWeight = currentReport
    ? selectedLootIndexes.reduce((sum, index) => sum + currentReport.loots[index].weight, 0)
    : 0;

  const toggleLoot = (index: number) => {
    if (!currentReport || lootClaimed) return;
    const selected = selectedLootIndexes.includes(index);
    if (selected) setSelectedLootIndexes((items) => items.filter((item) => item !== index));
    else if (selectedCargoWeight + currentReport.loots[index].weight <= cargoCapacity) {
      setSelectedLootIndexes((items) => [...items, index]);
    }
  };

  const confirmCargo = () => {
    if (!currentReport || lootClaimed) return;
    onAddMaterials(selectedLootIndexes.map((index) => currentReport.loots[index]));
    setLootClaimed(true);
    soundFx.playVictory();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-5 font-mono">
      {/* Title Header */}
      <div className="bg-[#15181C] p-4 rounded-xs border border-[#2D3135] shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-[10px] uppercase tracking-widest mb-0.5">
              <Compass className="w-3.5 h-3.5 text-amber-400" /> 遠征探査地図 — EXPEDITION MAP
            </div>
            <h2 className="text-lg font-bold text-[#E0E2E4] tracking-wider">
              秘境へゴーレムを派遣し、新領域開放と新素材を回収
            </h2>
            <p className="text-xs text-[#8A8F98] mt-0.5">
              出撃必須キーを満たすゴーレムを出撃させます。大破（損傷100%以上）すると素材は獲得できません。
            </p>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onGoToWorkshop();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-[#121417] hover:bg-[#1A1C1E] text-amber-400 text-xs border border-amber-500/40 transition-all shadow shrink-0"
          >
            <Hammer className="w-3.5 h-3.5" />
            工房で新ゴーレム設計
          </button>
        </div>
      </div>

      {/* Main Grid: Region Selector (Left) vs Destination Controller (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Region List Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-[#8A8F98] uppercase tracking-wider flex items-center justify-between">
            <span>調査対象地域一覧 ({EXPEDITION_REGIONS.length})</span>
          </div>

          <div className="space-y-2.5">
            {EXPEDITION_REGIONS.map((region) => {
              const isSelected = selectedRegionId === region.id;
              const accessTraitInfo = region.accessTrait ? TRAITS[region.accessTrait] : null;

              return (
                <button
                  key={region.id}
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedRegionId(region.id);
                  }}
                  className={`w-full p-3 rounded-xs border text-left transition-all flex flex-col gap-2 relative overflow-hidden ${
                    isSelected
                      ? 'bg-[#1A1C1E] border-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                      : 'bg-[#0F1113] border-[#2D3135] hover:bg-[#15181C] text-[#8A8F98]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{region.icon}</span>
                      <div>
                        <div className="font-bold text-sm text-[#E0E2E4]">{region.name}</div>
                        <div className="text-[10px] text-amber-400 font-bold">
                          危険度: {'★'.repeat(region.dangerStars)}
                          <span className="text-[#3A3D42]">{'★'.repeat(4 - region.dangerStars)}</span>
                        </div>
                      </div>
                    </div>

                    {accessTraitInfo ? (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded border ${accessTraitInfo.badgeBg} ${accessTraitInfo.badgeBorder} ${accessTraitInfo.textColor} shrink-0 font-bold flex items-center gap-1`}
                      >
                        <Lock className="w-3 h-3 text-rose-400" />
                        <span>出撃鍵: {accessTraitInfo.name}</span>
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/50 border border-emerald-600/50 text-emerald-300 shrink-0">
                        自由出撃可能
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#8A8F98] line-clamp-2 leading-tight">
                    {region.description}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap border-t border-[#2D3135]/50 pt-1.5 text-[10px]">
                    <span className="text-[#8A8F98]">回収目標:</span>
                    {region.possibleLoot.map((loot) => (
                      <span
                        key={loot.name}
                        className="px-1.5 py-0.2 rounded bg-[#121417] text-[#E0E2E4] border border-[#2D3135]"
                      >
                        {loot.name}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Destination Details & Expedition Launch Controller (7 cols) */}
        <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-20">
          {/* Destination Detail Card */}
          <div className={`p-4 rounded-xs border border-[#2D3135] bg-gradient-to-b ${selectedRegion.bgGradient} space-y-3 shadow-md`}>
            <div className="flex items-start justify-between gap-3 border-b border-[#2D3135] pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl p-2 bg-[#0F1113] border border-[#2D3135] rounded-xs">
                  {selectedRegion.icon}
                </span>
                <div>
                  <div className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                    選択中の遠征目的地
                  </div>
                  <h3 className="text-base font-bold text-[#E0E2E4]">{selectedRegion.name}</h3>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-[#8A8F98]">危険度評定</div>
                <div className="text-amber-400 font-bold text-sm">
                  {'★'.repeat(selectedRegion.dangerStars)}
                  <span className="text-[#3A3D42]">
                    {'★'.repeat(4 - selectedRegion.dangerStars)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#C5C9D0] leading-relaxed">{selectedRegion.description}</p>

            {/* Key Requirement Notice Box */}
            <div className="p-2.5 bg-[#0F1113]/90 rounded-xs border border-[#2D3135] space-y-1 text-xs">
              <div className="text-amber-400 font-bold flex items-center gap-1.5 text-[11px]">
                <Sparkles className="w-3.5 h-3.5" /> 出撃アクセスキー要件
              </div>
              <div className="text-[#E0E2E4] text-[11px]">
                {selectedRegion.keyNotice}
              </div>
            </div>

            {/* Hazards & Recommended Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-[#0F1113]/80 rounded-xs border border-[#2D3135] space-y-1">
                <div className="text-rose-400 font-bold text-[11px]">⚠️ 現地主要ハザード</div>
                <ul className="text-[10px] text-[#8A8F98] space-y-0.5 list-disc list-inside">
                  {selectedRegion.hazards.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>

              <div className="p-2.5 bg-[#0F1113]/80 rounded-xs border border-[#2D3135] space-y-1">
                <div className="text-cyan-400 font-bold text-[11px]">📊 推奨能力値目安</div>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <span className="text-rose-300">POWER: {selectedRegion.recommendedStats.power}+</span>
                  <span className="text-blue-300">ARMOR: {selectedRegion.recommendedStats.armor}+</span>
                  <span className="text-emerald-300">MOBILITY: {selectedRegion.recommendedStats.mobility}+</span>
                  <span className="text-amber-300">WORK: {selectedRegion.recommendedStats.work}+</span>
                </div>
              </div>
            </div>

            {/* Select Golem to Launch */}
            <div className="space-y-2 pt-2 border-t border-[#2D3135]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8A8F98] font-bold">出撃機体を選択</span>
                {selectedGolem && (
                  <span className="text-[11px] text-amber-400 font-bold">
                    機体耐久度: {selectedGolem.durability}%
                  </span>
                )}
              </div>

              {golemList.length === 0 ? (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xs text-xs text-rose-300">
                  所持ゴーレムがいません。「工房で新ゴーレム設計」から作成してください。
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {golemList.map((g) => {
                    const isSelected = selectedGolemId === g.id;
                    const isKeyMatched =
                      !selectedRegion.accessTrait ||
                      g.traits.includes(selectedRegion.accessTrait);

                    return (
                      <button
                        key={g.id}
                        onClick={() => {
                          soundFx.playClick();
                          setSelectedGolemId(g.id);
                        }}
                        className={`p-2.5 rounded-xs border text-left transition-all flex flex-col gap-1 relative ${
                          isSelected
                            ? 'bg-[#1A1C1E] border-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.12)]'
                            : 'bg-[#0F1113] border-[#2D3135] hover:border-[#42464D]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs truncate max-w-[120px]">{g.name}</span>
                          {isKeyMatched ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-600/60 text-emerald-300 font-bold">
                              ★ 出撃可
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950/60 border border-rose-600/60 text-rose-300 font-bold flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> 鍵未適合
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] text-[#8A8F98] flex items-center justify-between">
                          <span>P:{g.stats.power} A:{g.stats.armor} M:{g.stats.mobility} W:{g.stats.work}</span>
                          <span className={g.durability < 30 ? 'text-rose-400 font-bold' : 'text-amber-400'}>
                            耐久 {g.durability}%
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected Golem Compatibility Bar & Launch Button */}
              {selectedGolem && (
                <div className="space-y-2 pt-2">
                  {prediction && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-xs bg-[#0F1113] border border-[#2D3135]">
                        <div className="text-[9px] text-[#8A8F98] uppercase">予測損傷</div>
                        <div className={`text-sm font-extrabold ${prediction.maxEstimatedDamage >= 70 ? 'text-rose-400' : prediction.maxEstimatedDamage >= 45 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {prediction.totalDamage}%
                        </div>
                      </div>
                      {(['power', 'armor', 'mobility', 'work'] as const).map((stat) => {
                        const item = prediction.statAnalysis[stat];
                        return (
                          <div key={stat} className={`p-2 rounded-xs border ${item.ok ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-rose-950/20 border-rose-800/50'}`}>
                            <div className="text-[9px] uppercase text-[#8A8F98]">{stat}</div>
                            <div className={`text-xs font-bold ${item.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {item.current} / {item.required} {item.ok ? '✓' : `−${item.required - item.current}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {cRoutePrediction && (
                    <div className="p-3 rounded-xs border border-violet-500/60 bg-violet-950/20 space-y-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-violet-300">C_UI_COMPREHENSION — 古代遺跡 出撃予測</span>
                        <span className={`font-bold ${cRoutePrediction.status === 'FAILED' ? 'text-rose-400' : cRoutePrediction.status === 'PARTIAL' ? 'text-amber-400' : 'text-emerald-400'}`}>{cRoutePrediction.status}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="bg-[#0F1113]/80 border border-[#2D3135] p-2 space-y-1">
                          <div>必須条件：<span className={hasAccessKey ? 'text-emerald-400' : 'text-rose-400'}>{hasAccessKey ? '✓ 魔力感知' : '✕ 魔力感知なし'}</span></div>
                          <div>環境条件：<span className={hasResistKey ? 'text-emerald-400' : 'text-amber-400'}>{hasResistKey ? '✓ 耐熱あり' : `△ 耐熱なし（+${cRoutePrediction.environmentDamage}損傷）`}</span></div>
                          <div className="pt-1 text-violet-300 font-bold">推定突破経路：{cRoutePrediction.route} — {ROUTE_LABELS[cRoutePrediction.route].name}</div>
                          <div className="text-[#8A8F98]">4経路の予測損傷を比較し、最小の経路を採用</div>
                        </div>
                        <div className="bg-[#0F1113]/80 border border-[#2D3135] p-2 grid grid-cols-2 gap-1">
                          {(['POWER', 'ARMOR', 'MOBILITY', 'WORK'] as const).map((route) => (
                            <div key={route} className={route === cRoutePrediction.route ? 'text-violet-300 font-bold' : 'text-[#8A8F98]'}>
                              {route} {selectedGolem.stats[route.toLowerCase() as keyof typeof selectedGolem.stats]} → 損傷{cRoutePrediction.routeDamages[route]} {route === cRoutePrediction.route ? '← 採用' : ''}
                            </div>
                          ))}
                          <div className="col-span-2 border-t border-[#2D3135] pt-1 mt-1">
                            予測損傷：{cRoutePrediction.totalDamage}% ／ 積載上限：{selectedGolem.stats.work * 2}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div
                    className={`p-2.5 rounded-xs border text-xs flex items-center justify-between ${
                      hasAccessKey
                        ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                        : 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {hasAccessKey ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-[11px]">
                          {hasAccessKey
                            ? '出撃判定: 進入許可（アクセスキー保持）'
                            : '出撃判定: 進入不可（アクセスキー未保持）'}
                        </div>
                        <div className="text-[10px] opacity-80">
                          {selectedGolem.name} の特性: [{selectedGolem.traits.map((t) => TRAITS[t].name).join(', ') || '標準'}]
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleStartExpedition}
                    disabled={isSimulating || hasPendingCargo || !hasAccessKey || selectedGolem.durability <= 0 || !canAct}
                    className={`w-full py-3.5 px-4 rounded-xs font-extrabold text-xs uppercase tracking-widest transition-all border ${
                      isSimulating
                        ? 'bg-amber-600/50 text-black border-amber-500 cursor-wait'
                        : hasPendingCargo
                        ? 'bg-amber-950/50 text-amber-400 border-amber-700 cursor-not-allowed'
                        : !hasAccessKey
                        ? 'bg-slate-900 text-slate-500 border-slate-700 cursor-not-allowed'
                        : selectedGolem.durability <= 0 || !canAct
                        ? 'bg-rose-950/50 text-rose-400 border-rose-800 cursor-not-allowed'
                        : 'border-amber-500 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    }`}
                  >
                    {isSimulating ? (
                      <span className="flex items-center justify-center gap-2">
                        <Compass className="w-4 h-4 animate-spin text-black" />
                        遠征調査・現地シミュレーション中...
                      </span>
                    ) : hasPendingCargo ? (
                      '先に発見素材の積載を確定してください'
                    ) : !hasAccessKey ? (
                      `出撃不能：【${selectedRegion.accessTrait ? TRAITS[selectedRegion.accessTrait].name : ''}】キーが必要です`
                    ) : !canAct ? (
                      '本日のACTIONを使い切りました'
                    ) : selectedGolem.durability <= 0 ? (
                      '機体大破中：修理が必要です'
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Compass className="w-4 h-4" />
                        遠征調査を開始する 🧭
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Expedition Report Modal / Interactive Log Output */}
          {currentReport && (
            <div className="bg-[#121417] border border-amber-500/60 p-4 rounded-xs text-left space-y-3 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#2D3135] pb-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  遠征報告書 — {currentReport.regionName}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      currentReport.status === 'SUCCESS'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                        : currentReport.status === 'PARTIAL'
                        ? 'bg-amber-950 text-amber-400 border border-amber-600'
                        : 'bg-rose-950 text-rose-400 border border-rose-600'
                    }`}
                  >
                    {currentReport.status === 'SUCCESS'
                      ? '調査成功（完全帰還）'
                      : currentReport.status === 'PARTIAL'
                      ? '中破帰還 (獲得量半減)'
                      : '大破撤退 (獲得失敗)'}
                  </span>
                </div>
              </div>

              {/* Event Logs List */}
              {reportRoute && (
                <div className="p-3 border border-violet-500/60 bg-violet-950/20 rounded-xs space-y-2 text-[11px]">
                  <div className="font-bold text-violet-300">採用突破経路：{reportRoute.route} — {ROUTE_LABELS[reportRoute.route].name}</div>
                  <div className="space-y-1 text-[#C5C9D0]">
                    <div>✓ 魔力感知で入口を特定</div>
                    <div className={reportRoute.environmentDamage > 0 ? 'text-amber-300' : 'text-emerald-300'}>{reportRoute.environmentDamage > 0 ? `⚠ 耐熱不足：+${reportRoute.environmentDamage}損傷` : '✓ 耐熱で環境損傷を無効化'}</div>
                    {reportRoute.navigationDamage > 0 && <div>△ 移動・側道開削負荷：+{reportRoute.navigationDamage}損傷</div>}
                    <div>✓ {ROUTE_LABELS[reportRoute.route].result}：+{reportRoute.routeDamage}損傷</div>
                  </div>
                  <div className="border-t border-violet-800/50 pt-2 flex justify-between font-bold">
                    <span>予測 {reportRoute.totalDamage}% → 実測 {currentReport.totalDamage}%</span>
                    <span>{currentReport.status}</span>
                  </div>
                </div>
              )}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {currentReport.logs.map((log) => (
                  <div
                    key={log.step}
                    className="p-2.5 bg-[#0F1113] border border-[#2D3135] rounded-xs space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-amber-400 text-[11px]">{log.title}</span>
                      {log.damageTaken !== undefined && (
                        <span className="text-rose-400 text-[10px]">
                          損傷度 +{log.damageTaken}%
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#C5C9D0] leading-snug">{log.message}</p>
                  </div>
                ))}
              </div>

              {/* Material Rewards Acquired */}
              <div className="p-3 bg-[#0F1113] border border-[#2D3135] rounded-xs space-y-1.5">
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" /> 発見素材を積載（{selectedCargoWeight}/{cargoCapacity}）
                  </span>
                  {currentReport.status === 'FAILED' && (
                    <span className="text-rose-400 text-[10px]">※大破のため獲得素材 0 個</span>
                  )}
                </div>

                {currentReport.loots.length === 0 ? (
                  <div className="text-[11px] text-[#8A8F98] italic p-2 text-center">
                    回収できた素材はありませんでした。
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {currentReport.loots.map((item, idx) => {
                      const selected = selectedLootIndexes.includes(idx);
                      const wouldOverflow = !selected && selectedCargoWeight + item.weight > cargoCapacity;
                      return <button
                        key={idx}
                        onClick={() => toggleLoot(idx)}
                        disabled={lootClaimed || wouldOverflow}
                        className={`p-2 border rounded-xs flex items-center justify-between ${selected ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200' : wouldOverflow ? 'bg-[#0F1113] border-[#2D3135] opacity-40' : 'bg-[#121417] border-[#2D3135] hover:border-amber-500'}`}
                      >
                        <span className="text-[#E0E2E4] font-bold text-[11px]">{item.name}</span>
                        <span className="text-emerald-400 font-bold text-xs">x{item.count} / 重量{item.weight}</span>
                      </button>;
                    })}
                  </div>
                )}
                {currentReport.status !== 'FAILED' && currentReport.loots.length > 0 && (
                  <button onClick={confirmCargo} disabled={lootClaimed} className={`w-full mt-2 py-2 text-xs font-bold border rounded-xs ${lootClaimed ? 'border-emerald-800 text-emerald-500 bg-emerald-950/30' : 'border-amber-500 bg-amber-500 text-black'}`}>
                    {lootClaimed ? '積載品を保管庫へ収納済み' : `選択した${selectedLootIndexes.length}種を持ち帰る`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
