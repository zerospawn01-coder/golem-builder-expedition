import React from 'react';
import { X, Package } from 'lucide-react';
import { MaterialCount, BodyType, CoreType, RuneType } from '../types';
import { BODIES, CORES, RUNES } from '../data/gameData';
import { soundFx } from '../utils/audio';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: MaterialCount;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
}) => {
  if (!isOpen) return null;

  const bodies: BodyType[] = ['stone', 'iron', 'wood', 'clay'];
  const cores: CoreType[] = ['fire', 'water', 'wind', 'earth'];
  const runes: RuneType[] = ['attack', 'defense', 'speed', 'regen'];

  const totalBodyMat = Object.values(inventory.body).reduce((a: number, b: number) => a + b, 0);
  const totalCoreMat = Object.values(inventory.core).reduce((a: number, b: number) => a + b, 0);
  const totalRuneMat = Object.values(inventory.rune).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1113]/90 backdrop-blur-xs animate-fade-in font-mono">
      <div className="bg-[#121417] border border-[#2D3135] rounded-xs w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#2D3135] flex items-center justify-between bg-[#0F1113]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xs bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#E0E2E4] flex items-center gap-2 tracking-wide">
                所持素材・倉庫一覧
              </h3>
              <p className="text-[11px] text-[#8A8F98]">
                工房での錬成および修理で使用できる各種ストック素材
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-1.5 text-[#8A8F98] hover:text-[#E0E2E4] hover:bg-[#1A1C1E] rounded-xs transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {/* BODY section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-[#2D3135] pb-1">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                BODY MATERIALS [素体素材]
              </h4>
              <span className="text-xs font-bold text-amber-400">計 {totalBodyMat} 個</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {bodies.map((bKey) => (
                <div
                  key={bKey}
                  className="p-2.5 bg-[#0F1113] rounded-xs border border-[#2D3135] flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[#E0E2E4] text-xs">{BODIES[bKey].name}</div>
                    <div className="text-[9px] text-[#8A8F98] uppercase">{BODIES[bKey].nameEn}</div>
                  </div>
                  <span className="text-sm font-extrabold font-mono text-amber-400">
                    x{inventory.body[bKey] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CORE section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-[#2D3135] pb-1">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                CORE MATERIALS [核素材]
              </h4>
              <span className="text-xs font-bold text-cyan-400">計 {totalCoreMat} 個</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {cores.map((cKey) => (
                <div
                  key={cKey}
                  className="p-2.5 bg-[#0F1113] rounded-xs border border-[#2D3135] flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[#E0E2E4] text-xs flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: CORES[cKey].glowColor }}
                      />
                      {CORES[cKey].name}
                    </div>
                    <div className="text-[9px] text-[#8A8F98] uppercase">{CORES[cKey].nameEn}</div>
                  </div>
                  <span className="text-sm font-extrabold font-mono text-cyan-400">
                    x{inventory.core[cKey] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RUNE section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-[#2D3135] pb-1">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                RUNE MATERIALS [ルーン素材]
              </h4>
              <span className="text-xs font-bold text-purple-400">計 {totalRuneMat} 個</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {runes.map((rKey) => (
                <div
                  key={rKey}
                  className="p-2.5 bg-[#0F1113] rounded-xs border border-[#2D3135] flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[#E0E2E4] text-xs flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: RUNES[rKey].symbolColor }}
                      />
                      {RUNES[rKey].name}
                    </div>
                    <div className="text-[9px] text-[#8A8F98] uppercase">{RUNES[rKey].nameEn}</div>
                  </div>
                  <span className="text-sm font-extrabold font-mono text-purple-400">
                    x{inventory.rune[rKey] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
