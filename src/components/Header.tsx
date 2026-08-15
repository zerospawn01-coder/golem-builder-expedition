import React from 'react';
import { Volume2, VolumeX, Shield, Hammer, Package, RotateCcw, Compass } from 'lucide-react';
import { MaterialCount } from '../types';
import { soundFx } from '../utils/audio';

interface HeaderProps {
  currentTab: 'workshop' | 'expedition' | 'golem';
  setTab: (tab: 'workshop' | 'expedition' | 'golem') => void;
  inventory: MaterialCount;
  openInventory: () => void;
  onResetData: () => void;
  hasActiveGolem: boolean;
  day: number;
  actionsLeft: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setTab,
  inventory,
  openInventory,
  onResetData,
  hasActiveGolem,
  day,
  actionsLeft,
}) => {
  const [muted, setMuted] = React.useState(!soundFx.enabled);
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);

  const toggleMute = () => {
    soundFx.enabled = !soundFx.enabled;
    setMuted(!soundFx.enabled);
    if (soundFx.enabled) {
      soundFx.playClick();
    }
  };

  const totalBodyMat = Object.values(inventory.body).reduce((a: number, b: number) => a + b, 0);
  const totalCoreMat = Object.values(inventory.core).reduce((a: number, b: number) => a + b, 0);
  const totalRuneMat = Object.values(inventory.rune).reduce((a: number, b: number) => a + b, 0);

  return (
    <header className="bg-[#15181C] border-b border-[#2D3135] sticky top-0 z-40 px-4 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xs bg-amber-500 rotate-45 flex items-center justify-center shadow-md shadow-amber-950/40 border border-amber-300/40 shrink-0">
            <Shield className="w-4 h-4 text-black -rotate-45 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wider text-[#E0E2E4] flex items-center gap-2 font-mono uppercase">
              ゴーレムビルダー
              <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-bold tracking-widest">
                GOLEM BUILDER
              </span>
            </h1>
            <p className="text-[11px] text-[#8A8F98] font-mono hidden sm:block">
              DESIGN ➔ FABRICATION ➔ DEPLOYMENT ➔ RECOVERY
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Workshop | Expedition Map | Storage/Golems) */}
        <nav className="flex items-center gap-1 bg-[#0F1113] p-1 rounded-sm border border-[#2D3135]">
          <button
            onClick={() => {
              soundFx.playClick();
              setTab('workshop');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-bold font-mono tracking-wider transition-all ${
              currentTab === 'workshop'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-[#8A8F98] hover:text-[#E0E2E4] hover:bg-[#1A1C1E]'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            実験工廠 (FOUNDRY)
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setTab('expedition');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-bold font-mono tracking-wider transition-all ${
              currentTab === 'expedition'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-[#8A8F98] hover:text-[#E0E2E4] hover:bg-[#1A1C1E]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            異常区域 (DEPLOYMENT)
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setTab('golem');
            }}
            disabled={!hasActiveGolem}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-bold font-mono tracking-wider transition-all ${
              currentTab === 'golem'
                ? 'bg-amber-500 text-black shadow-sm'
                : hasActiveGolem
                ? 'text-[#8A8F98] hover:text-[#E0E2E4] hover:bg-[#1A1C1E]'
                : 'text-[#42464D] cursor-not-allowed opacity-50'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            保管所 (GOLEMS)
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              openInventory();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-mono uppercase text-[#E0E2E4] hover:bg-[#1A1C1E] transition-all border border-[#2D3135]"
            title="所持素材一覧"
          >
            <Package className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">素材一覧</span>
          </button>
        </nav>

        {/* Material Pills & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 text-[11px] font-mono bg-[#121417] px-3 py-1.5 rounded-xs border border-amber-500/40">
            <span className="text-[#8A8F98]">DAY {day}</span>
            <span className={actionsLeft > 0 ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>ACTION {actionsLeft}/3</span>
          </div>
          {/* Quick Material Stocks */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono bg-[#121417] px-3 py-1.5 rounded-xs border border-[#2D3135]">
            <span className="text-[#8A8F98] uppercase">STOCK:</span>
            <span className="text-amber-400 font-semibold">BODY {totalBodyMat}</span>
            <span className="text-[#2D3135]">|</span>
            <span className="text-cyan-400 font-semibold">CORE {totalCoreMat}</span>
            <span className="text-[#2D3135]">|</span>
            <span className="text-purple-400 font-semibold">RUNE {totalRuneMat}</span>
          </div>

          {/* Sound Mute */}
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-xs bg-[#121417] hover:bg-[#1A1C1E] text-[#8A8F98] hover:text-[#E0E2E4] transition-all border border-[#2D3135]"
            title={muted ? '音声をオンにする' : '音声をミュート'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Reset Save */}
          <button
            onClick={() => {
              soundFx.playClick();
              setShowResetConfirm(true);
            }}
            className="p-1.5 rounded-xs bg-[#121417] hover:bg-rose-950/40 text-[#8A8F98] hover:text-rose-400 transition-all border border-[#2D3135]"
            title="セーブデータ初期化"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1113]/80 backdrop-blur-xs font-mono animate-fade-in">
          <div className="bg-[#121417] border border-rose-500/50 rounded-xs max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[#2D3135] pb-3">
              <div className="w-9 h-9 rounded-xs bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#E0E2E4]">データのリセット確認</h3>
                <p className="text-[11px] text-rose-400 font-bold">全てのデータが初期化されます</p>
              </div>
            </div>

            <p className="text-xs text-[#8A8F98]">
              ゲームの進捗、所持素材、作成したゴーレムを初期化します。よろしいですか？
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 px-3 bg-[#1A1C1E] hover:bg-[#2D3135] text-[#E0E2E4] font-bold text-xs rounded-xs border border-[#2D3135] transition-all"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowResetConfirm(false);
                  onResetData();
                }}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xs transition-all shadow"
              >
                初期化を実行する
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
