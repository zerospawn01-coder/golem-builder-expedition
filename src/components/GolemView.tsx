import React, { useState } from 'react';
import { Shield, Zap, Footprints, Pickaxe, Edit3, Check, Trash2, Hammer, Sparkles, Compass, RotateCcw, AlertTriangle } from 'lucide-react';
import { Golem, MaterialCount } from '../types';
import { BODIES, CORES, RUNES, TRAITS } from '../data/gameData';
import { GolemVisual } from './GolemVisual';
import { soundFx } from '../utils/audio';

interface GolemViewProps {
  activeGolem: Golem | null;
  golemList: Golem[];
  inventory: MaterialCount;
  onSelectActiveGolem: (golem: Golem) => void;
  onRenameGolem: (id: string, newName: string) => void;
  onDisassembleGolem: (id: string) => void;
  onUpdateGolem: (golem: Golem) => void;
  onRepairGolemWithMaterial: (golemId: string) => boolean;
  onGoToExpedition: () => void;
  onGoToWorkshop: () => void;
  canAct: boolean;
}

export const GolemView: React.FC<GolemViewProps> = ({
  activeGolem,
  golemList,
  inventory,
  onSelectActiveGolem,
  onRenameGolem,
  onDisassembleGolem,
  onUpdateGolem,
  onRepairGolemWithMaterial,
  onGoToExpedition,
  onGoToWorkshop,
  canAct,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [customName, setCustomName] = useState('');
  const [disassembleTarget, setDisassembleTarget] = useState<Golem | null>(null);
  const [repairError, setRepairError] = useState<string | null>(null);

  if (!activeGolem) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-[#121417] border border-[#2D3135] rounded-xs text-center space-y-4 font-mono">
        <div className="w-12 h-12 mx-auto rounded-xs bg-[#1A1C1E] border border-[#2D3135] flex items-center justify-center text-[#8A8F98]">
          <Shield className="w-6 h-6 text-amber-400" />
        </div>
        <h3 className="text-base font-bold text-[#E0E2E4]">保管中のゴーレムがありません</h3>
        <p className="text-xs text-[#8A8F98]">
          工房 (WORKSHOP) で素材（素体＋魔導核＋ルーン）を組み立てて最初のゴーレムを錬成してください。
        </p>
        <button
          onClick={() => {
            soundFx.playClick();
            onGoToWorkshop();
          }}
          className="px-5 py-2.5 bg-amber-500 text-black font-bold text-xs font-mono uppercase tracking-widest rounded-xs shadow transition-all inline-flex items-center gap-2 hover:bg-amber-400"
        >
          <Hammer className="w-4 h-4" />
          工房へ移動する
        </button>
      </div>
    );
  }

  const handleStartRename = () => {
    soundFx.playClick();
    setCustomName(activeGolem.name);
    setIsEditingName(true);
  };

  const handleSaveRename = () => {
    if (customName.trim()) {
      soundFx.playClick();
      onRenameGolem(activeGolem.id, customName.trim());
    }
    setIsEditingName(false);
  };

  const handleRepairActiveGolem = () => {
    setRepairError(null);
    const success = onRepairGolemWithMaterial(activeGolem.id);
    if (success) {
      soundFx.playBuild();
    } else {
      setRepairError(canAct ? `修理には同じBODY素材「${BODIES[activeGolem.body].name}」が1個必要です` : '本日のACTIONを使い切りました');
    }
  };

  const bodyData = BODIES[activeGolem.body];
  const coreData = CORES[activeGolem.core];
  const runeData = RUNES[activeGolem.rune];

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-6 font-mono">
      {/* Top Main Showcase Card */}
      <div className="bg-[#121417] p-6 rounded-xs border border-[#2D3135] shadow-md relative overflow-hidden">
        {/* Background ambient element glow */}
        <div
          className="absolute right-10 top-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ backgroundColor: coreData.glowColor }}
        />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10">
          {/* Left Column: Visual Golem Display (6 cols) */}
          <div className="md:col-span-6 bg-[#0F1113] p-5 rounded-xs border border-[#2D3135] flex flex-col items-center justify-center relative min-h-[300px]">
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-xs bg-[#1A1C1E] text-amber-400 border border-[#2D3135] tracking-widest font-bold">
                選択中の機体
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-xs bg-[#1A1C1E] text-[#E0E2E4] border border-[#2D3135]">
                遠征出撃回数: {activeGolem.expeditionsCount || 0} 回
              </span>
            </div>

            <GolemVisual
              body={activeGolem.body}
              core={activeGolem.core}
              rune={activeGolem.rune}
              size="xl"
              animationState={activeGolem.durability < 30 ? 'damaged' : 'idle'}
            />
          </div>

          {/* Right Column: Name, Stats, Traits, Repair & Expedition Trigger (6 cols) */}
          <div className="md:col-span-6 space-y-4">
            {/* Golem Name with inline editing */}
            <div>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="bg-[#0F1113] border border-amber-500 px-3 py-1.5 rounded-xs text-[#E0E2E4] text-base font-bold w-full focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveRename}
                    className="p-2 rounded-xs bg-emerald-500 text-black font-bold"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl md:text-2xl font-bold text-[#E0E2E4] tracking-wide">
                    {activeGolem.name}
                  </h2>
                  <button
                    onClick={handleStartRename}
                    className="p-1 text-[#8A8F98] hover:text-amber-400 transition-colors"
                    title="名称変更"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Components */}
              <div className="mt-2 space-y-1 text-xs">
                <div className="text-[10px] text-[#8A8F98] uppercase font-bold tracking-wider">構成パーツ</div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="p-2 bg-[#0F1113] rounded-xs border border-[#2D3135] flex flex-col items-center text-center gap-0.5">
                    <span className="text-amber-400 font-bold text-[10px]">1. 素体</span>
                    <span className="text-[#E0E2E4] font-bold text-xs truncate w-full">{bodyData.name}</span>
                  </div>
                  <div className="p-2 bg-[#0F1113] rounded-xs border border-[#2D3135] flex flex-col items-center text-center gap-0.5">
                    <span className="text-cyan-400 font-bold text-[10px]">2. 魔導核</span>
                    <span className="text-[#E0E2E4] font-bold text-xs flex items-center justify-center gap-1 truncate w-full">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: coreData.glowColor }} />
                      <span className="truncate">{coreData.name}</span>
                    </span>
                  </div>
                  <div className="p-2 bg-[#0F1113] rounded-xs border border-[#2D3135] flex flex-col items-center text-center gap-0.5">
                    <span className="text-purple-400 font-bold text-[10px]">3. ルーン</span>
                    <span className="text-[#E0E2E4] font-bold text-xs flex items-center justify-center gap-1 truncate w-full">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: runeData.symbolColor }} />
                      <span className="truncate">{runeData.name}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Durability Status Bar */}
            <div className="p-2.5 bg-[#0F1113] rounded-xs border border-[#2D3135] space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-[#8A8F98]">機体耐久度</span>
                <span className={activeGolem.durability < 30 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {activeGolem.durability}% / 100% {activeGolem.durability < 30 ? '(要修復)' : ''}
                </span>
              </div>
              <div className="h-2 w-full bg-[#1A1C1E] border border-[#2D3135] overflow-hidden rounded-xs">
                <div
                  className={`h-full transition-all duration-300 ${
                    activeGolem.durability > 50
                      ? 'bg-emerald-500'
                      : activeGolem.durability > 25
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${activeGolem.durability}%` }}
                />
              </div>
            </div>

            {/* 4 Core Stat Gauges */}
            <div className="space-y-1.5 bg-[#0F1113] p-2.5 rounded-xs border border-[#2D3135]">
              <div className="text-[10px] text-[#8A8F98] uppercase tracking-wider font-bold border-b border-[#2D3135] pb-1">
                4大能力値評価
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <Zap className="w-3 h-3" /> POWER
                    </span>
                    <span className="text-[#E0E2E4] font-bold">{activeGolem.stats.power}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-blue-400 font-semibold flex items-center gap-1">
                      <Shield className="w-3 h-3" /> ARMOR
                    </span>
                    <span className="text-[#E0E2E4] font-bold">{activeGolem.stats.armor}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Footprints className="w-3 h-3" /> MOBILITY
                    </span>
                    <span className="text-[#E0E2E4] font-bold">{activeGolem.stats.mobility}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <Pickaxe className="w-3 h-3" /> WORK
                    </span>
                    <span className="text-[#E0E2E4] font-bold">{activeGolem.stats.work}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Environmental Traits */}
            <div className="bg-[#1A1C1E] p-2.5 rounded-xs border border-[#2D3135] space-y-1">
              <div className="text-[10px] text-[#8A8F98] font-bold uppercase tracking-widest">
                獲得環境適応特性
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeGolem.traits.length === 0 ? (
                  <span className="text-[10px] text-[#8A8F98] italic">標準型 (シナジー未発現)</span>
                ) : (
                  activeGolem.traits.map((t) => (
                    <span
                      key={t}
                      className={`text-xs px-2 py-0.5 rounded border font-bold flex items-center gap-1 ${TRAITS[t].badgeBg} ${TRAITS[t].badgeBorder} ${TRAITS[t].textColor}`}
                    >
                      <span>{TRAITS[t].icon}</span>
                      <span>【{TRAITS[t].name}】</span>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Error banner for repair */}
            {repairError && (
              <div className="p-2 bg-rose-950/60 border border-rose-800/80 text-rose-300 text-[11px] rounded-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span>{repairError}</span>
              </div>
            )}

            {/* Action Buttons: Expedition & Repair & Disassemble */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  soundFx.playClick();
                  onGoToExpedition();
                }}
                className="flex-1 py-3 px-4 rounded-xs border border-amber-500/80 bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-black font-extrabold text-xs tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4" />
                遠征探査へ出撃
              </button>

              {activeGolem.durability < 100 && (
                <button
                  onClick={handleRepairActiveGolem}
                  disabled={!canAct}
                  className="py-3 px-3 rounded-xs border border-emerald-500/80 bg-emerald-950/40 hover:bg-emerald-500 hover:text-black text-emerald-300 font-bold text-xs transition-all flex items-center justify-center gap-1 shrink-0"
                  title={`同じBODY素材「${bodyData.name}」1個と1 ACTIONで耐久+25%回復`}
                >
                  <RotateCcw className="w-4 h-4" /> 修復 ({bodyData.name}×1 / 1 ACTION)
                </button>
              )}

              {activeGolem.isStarter || activeGolem.id === 'golem_starter' ? (
                <button
                  disabled
                  className="py-3 px-3 rounded-xs border border-slate-800 bg-[#0F1113] text-slate-600 font-bold text-xs cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0"
                  title="プロトタイプスターター機は解体できません"
                >
                  <Trash2 className="w-4 h-4 text-slate-600" />
                  <span>解体不可</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setDisassembleTarget(activeGolem);
                  }}
                  className="py-3 px-3 rounded-xs border border-rose-900/80 bg-rose-950/30 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
                  title="このゴーレムを解体"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>解体</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Golem Inventory / Collection List */}
      {golemList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#2D3135] pb-2">
            <h3 className="text-xs font-bold text-[#E0E2E4] uppercase tracking-wider">
              所持中のゴーレム一覧 ({golemList.length} 体)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {golemList.map((golem) => {
              const isActive = golem.id === activeGolem.id;
              const isStarter = golem.isStarter || golem.id === 'golem_starter';

              return (
                <div
                  key={golem.id}
                  onClick={() => {
                    soundFx.playClick();
                    onSelectActiveGolem(golem);
                  }}
                  className={`p-3 rounded-xs border cursor-pointer transition-all flex items-center gap-3 relative ${
                    isActive
                      ? 'bg-[#1A1C1E] border-amber-500 shadow-sm text-white ring-1 ring-amber-500/40'
                      : 'bg-[#121417] border-[#2D3135] hover:border-[#42464D]'
                  }`}
                >
                  <div className="w-14 h-16 bg-[#0F1113] rounded-xs flex items-center justify-center border border-[#2D3135] shrink-0">
                    <GolemVisual
                      body={golem.body}
                      core={golem.core}
                      rune={golem.rune}
                      size="sm"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-[#E0E2E4] text-xs truncate">{golem.name}</span>
                    </div>

                    <div className="text-[10px] text-[#8A8F98] mt-0.5">
                      POW {golem.stats.power} / ARM {golem.stats.armor} / MOB {golem.stats.mobility} / WRK {golem.stats.work}
                    </div>

                    <div className="flex items-center justify-between mt-1.5 text-[10px]">
                      <span className={golem.durability < 30 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        耐久 {golem.durability}%
                      </span>

                      {!isStarter ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            soundFx.playClick();
                            setDisassembleTarget(golem);
                          }}
                          className="text-[#8A8F98] hover:text-rose-400 p-1 rounded-xs hover:bg-rose-950/40 flex items-center gap-1 transition-colors"
                          title="ゴーレムを解体"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>解体</span>
                        </button>
                      ) : (
                        <span className="text-[9px] text-[#8A8F98] italic">解体不可</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Disassemble Confirmation Modal */}
      {disassembleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1113]/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#121417] border border-rose-500/50 rounded-xs max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[#2D3135] pb-3">
              <div className="w-9 h-9 rounded-xs bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#E0E2E4]">ゴーレム解体の確認</h3>
                <p className="text-[11px] text-rose-400 font-bold">「{disassembleTarget.name}」</p>
              </div>
            </div>

            <p className="text-xs text-[#E0E2E4]">
              このゴーレムを解体して、パーツ素材を還元回収しますか？（素体素材1個 ＋ 魔導核素材1個が返却されます）
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDisassembleTarget(null)}
                className="flex-1 py-2 px-3 bg-[#1A1C1E] hover:bg-[#2D3135] text-[#E0E2E4] font-bold text-xs rounded-xs border border-[#2D3135] transition-all"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  onDisassembleGolem(disassembleTarget.id);
                  setDisassembleTarget(null);
                }}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xs transition-all shadow"
              >
                解体を実行する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
