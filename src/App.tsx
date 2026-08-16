import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { WorkshopView } from './components/WorkshopView';
import { GolemView } from './components/GolemView';
import { ExpeditionView } from './components/ExpeditionView';
import { InventoryModal } from './components/InventoryModal';
import {
  MaterialCount,
  Golem,
  BodyType,
  CoreType,
  RuneType,
  MaterialCategory,
  TraitType,
} from './types';
import {
  DEFAULT_INVENTORY,
  calculateGolemStats,
  getGolemTraits,
  generateGolemName,
} from './data/gameData';
import GravityDepthExperiment from './experiments/gravity-depth-v0/GravityDepthExperiment';
import { fabricateGolem } from './domain/fabrication';
import {
  EMPTY_BLUEPRINT_LIBRARY,
  appendBlueprintTelemetryEvent,
  countEligibleRedeployOpportunities,
  deserializeBlueprintLibrary,
  saveBlueprint,
  serializeBlueprintLibrary,
  type BlueprintPartIds,
  type BlueprintSource,
  type BlueprintTelemetryEvent,
} from './domain/blueprintLibrary';

const LOCAL_STORAGE_KEY = 'golem_builder_expedition_save_v2';
const MAX_GOLEMS = 3;
const ACTIONS_PER_DAY = 3;
const R2_BLUEPRINT_STORAGE_KEY = 'golem_builder_r2_blueprints_v1';
const R2_TELEMETRY_STORAGE_KEY = 'golem_builder_r2_telemetry_v1';
const R2_UNIT_SOURCE_STORAGE_KEY = 'golem_builder_r2_unit_sources_v1';

function createTelemetryId(prefix: string): string {
  return `${prefix}-${globalThis.crypto.randomUUID()}`;
}

export default function App() {
  if (new URLSearchParams(window.location.search).get('experiment') === 'GRAVITY_DEPTH_V0') {
    return <GravityDepthExperiment />;
  }
  return <CanonicalApp />;
}

function CanonicalApp() {
  const activeSaveOpportunityRef = useRef<{ designSignature: string; opportunityId: string; saved: boolean } | null>(null);
  const [blueprintLibrary, setBlueprintLibrary] = useState(() => {
    try { return deserializeBlueprintLibrary(localStorage.getItem(R2_BLUEPRINT_STORAGE_KEY)); }
    catch { return EMPTY_BLUEPRINT_LIBRARY; }
  });
  const [blueprintTelemetry, setBlueprintTelemetry] = useState<BlueprintTelemetryEvent[]>(() => {
    try { return JSON.parse(localStorage.getItem(R2_TELEMETRY_STORAGE_KEY) || '[]'); }
    catch { return []; }
  });
  const [unitBlueprintSources, setUnitBlueprintSources] = useState<Record<string, { source: BlueprintSource; blueprintId?: string }>>(() => {
    try { return JSON.parse(localStorage.getItem(R2_UNIT_SOURCE_STORAGE_KEY) || '{}'); }
    catch { return {}; }
  });
  const [r2MeasurementEpoch, setR2MeasurementEpoch] = useState(0);
  const [day, setDay] = useState(() => Number(localStorage.getItem(`${LOCAL_STORAGE_KEY}_day`)) || 1);
  const [actionsLeft, setActionsLeft] = useState(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_actions`);
    return saved === null ? ACTIONS_PER_DAY : Math.max(0, Math.min(ACTIONS_PER_DAY, Number(saved)));
  });
  // Inventory state
  const [inventory, setInventory] = useState<MaterialCount>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_inv`);
      return saved ? JSON.parse(saved) : DEFAULT_INVENTORY;
    } catch {
      return DEFAULT_INVENTORY;
    }
  });

  // Discovered Traits Registry state
  const [discoveredTraits, setDiscoveredTraits] = useState<TraitType[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_traits`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Golem collection state
  const [golemList, setGolemList] = useState<Golem[]>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_golems`);
      if (saved) {
        const parsed = JSON.parse(saved) as Golem[];
        return parsed.map((golem) => golem.id === 'golem_starter' ? {
          ...golem,
          name: generateGolemName('stone', 'wind', 'defense'),
          body: 'stone',
          core: 'wind',
          rune: 'defense',
          stats: calculateGolemStats('stone', 'wind', 'defense'),
          traits: getGolemTraits('stone', 'wind', 'defense'),
        } : golem);
      }

      // Default starter golem
      const starterStats = calculateGolemStats('stone', 'wind', 'defense');
      const starterTraits = getGolemTraits('stone', 'wind', 'defense');
      const starterGolem: Golem = {
        id: 'golem_starter',
        name: generateGolemName('stone', 'wind', 'defense'),
        body: 'stone',
        core: 'wind',
        rune: 'defense',
        stats: starterStats,
        traits: starterTraits,
        createdAt: Date.now(),
        expeditionsCount: 0,
        durability: 100,
        isStarter: true,
      };
      return [starterGolem];
    } catch {
      return [];
    }
  });

  const [activeGolemId, setActiveGolemId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_activeId`);
      return saved || (golemList[0]?.id || null);
    } catch {
      return golemList[0]?.id || null;
    }
  });

  // UI state
  const [currentTab, setCurrentTab] = useState<'workshop' | 'expedition' | 'golem'>('workshop');
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(false);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_inv`, JSON.stringify(inventory));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_golems`, JSON.stringify(golemList));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_activeId`, activeGolemId || '');
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_traits`, JSON.stringify(discoveredTraits));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_day`, String(day));
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_actions`, String(actionsLeft));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [inventory, golemList, activeGolemId, discoveredTraits, day, actionsLeft]);

  useEffect(() => {
    localStorage.setItem(R2_BLUEPRINT_STORAGE_KEY, serializeBlueprintLibrary(blueprintLibrary));
    localStorage.setItem(R2_TELEMETRY_STORAGE_KEY, JSON.stringify(blueprintTelemetry));
    localStorage.setItem(R2_UNIT_SOURCE_STORAGE_KEY, JSON.stringify(unitBlueprintSources));
  }, [blueprintLibrary, blueprintTelemetry, unitBlueprintSources]);

  const recordBlueprintEvent = useCallback((event: BlueprintTelemetryEvent) => {
    setBlueprintTelemetry((events) => appendBlueprintTelemetryEvent(events, event));
  }, []);

  const handleSaveOpportunityPresented = useCallback((designSignature: string) => {
    const active = activeSaveOpportunityRef.current;
    if (active?.designSignature === designSignature) {
      return { opportunityId: active.opportunityId, alreadySaved: active.saved };
    }
    const opportunityId = createTelemetryId('save-opportunity');
    activeSaveOpportunityRef.current = { designSignature, opportunityId, saved: false };
    recordBlueprintEvent({ type: 'blueprint_save_opportunity', opportunity_id: opportunityId });
    return { opportunityId, alreadySaved: false };
  }, [recordBlueprintEvent]);

  const handleSaveBlueprint = (opportunityId: string, parts: BlueprintPartIds, purposeTagIds: string[], loadedBlueprintId?: string) => {
    const blueprintId = loadedBlueprintId ?? createTelemetryId('blueprint');
    setBlueprintLibrary((state) => {
      const existing = loadedBlueprintId
        ? state.blueprints.find((blueprint) => blueprint.blueprint_id === loadedBlueprintId)
        : undefined;
      return saveBlueprint(state, {
        blueprint_id: blueprintId,
        part_ids: parts,
        purpose_tag_ids: [...purposeTagIds],
        expedition_record_refs: existing ? [...existing.expedition_record_refs] : [],
      }, loadedBlueprintId ? 'UPDATE' : 'CREATE');
    });
    recordBlueprintEvent({ type: 'blueprint_saved', blueprint_id: blueprintId, opportunity_id: opportunityId });
    if (activeSaveOpportunityRef.current?.opportunityId === opportunityId) {
      activeSaveOpportunityRef.current.saved = true;
    }
    if (loadedBlueprintId) recordBlueprintEvent({ type: 'blueprint_resaved', blueprint_id: loadedBlueprintId });
  };

  const handleBlueprintLoaded = useCallback((blueprintId: string) => {
    const opportunityId = createTelemetryId('load-opportunity');
    setBlueprintTelemetry((events) => {
      const withOpportunity = appendBlueprintTelemetryEvent(events, { type: 'blueprint_load_opportunity', opportunity_id: opportunityId });
      return appendBlueprintTelemetryEvent(withOpportunity, { type: 'blueprint_loaded', blueprint_id: blueprintId, opportunity_id: opportunityId });
    });
  }, []);

  const handleBlueprintApplied = useCallback((blueprintId: string) => {
    setBlueprintTelemetry((events) => appendBlueprintTelemetryEvent(events, {
      type: 'blueprint_applied',
      blueprint_id: blueprintId,
      opportunity_index: countEligibleRedeployOpportunities(events),
    }));
  }, []);

  const handleBlueprintModified = useCallback((blueprintId: string) => {
    recordBlueprintEvent({ type: 'blueprint_modified', blueprint_id: blueprintId });
  }, [recordBlueprintEvent]);

  const consumeAction = () => {
    if (actionsLeft <= 0) return false;
    setActionsLeft((value) => value - 1);
    return true;
  };

  // Active Golem Object
  const activeGolem = golemList.find((g) => g.id === activeGolemId) || golemList[0] || null;

  // Record discovered traits helper
  const registerTraits = (traits: TraitType[]) => {
    if (!traits || traits.length === 0) return;
    setDiscoveredTraits((prev) => {
      const updated = new Set([...prev, ...traits]);
      return Array.from(updated);
    });
  };

  // Build Golem Handler
  const handleFabricateGolem = (parts: BlueprintPartIds, source: BlueprintSource = 'MANUAL_NEW', blueprintId?: string): Golem | null => {
    const result = fabricateGolem({ inventory, actionsLeft, units: golemList, maxUnits: MAX_GOLEMS }, {
      body: parts.frame_id,
      core: parts.reactor_id,
      rune: parts.control_sigil_id,
    });
    if (!result.ok) return null;
    setInventory(result.state.inventory);
    setActionsLeft(result.state.actionsLeft);
    setGolemList(result.state.units);
    registerTraits(result.golem.traits);
    setActiveGolemId(result.golem.id);
    setUnitBlueprintSources((sources) => ({ ...sources, [result.golem.id]: { source, blueprintId } }));
    return result.golem;
  };

  // Rename Golem
  const handleRenameGolem = (id: string, newName: string) => {
    setGolemList((prev) =>
      prev.map((g) => (g.id === id ? { ...g, name: newName } : g))
    );
  };

  // Update Golem (e.g. durability, expeditions)
  const handleUpdateGolem = (updatedGolem: Golem) => {
    if (updatedGolem.traits) {
      registerTraits(updatedGolem.traits);
    }
    setGolemList((prev) =>
      prev.map((g) => (g.id === updatedGolem.id ? updatedGolem : g))
    );
  };

  // Repair Golem with Material (1 material restores +25% durability)
  const handleRepairGolemWithMaterial = (golemId: string): boolean => {
    const target = golemList.find((g) => g.id === golemId);
    if (!target || (inventory.body[target.body] || 0) <= 0 || actionsLeft <= 0) return false;
    if (!consumeAction()) return false;

    // Deduct 1 material in order: wood -> clay -> stone -> iron
    setInventory((prev) => {
      const updatedBody = { ...prev.body };
      updatedBody[target.body] = updatedBody[target.body] - 1;
      return { ...prev, body: updatedBody };
    });

    // Restore durability by +25 (max 100)
    setGolemList((prev) =>
      prev.map((g) =>
        g.id === golemId ? { ...g, durability: Math.min(100, g.durability + 25) } : g
      )
    );

    return true;
  };

  // Disassemble Golem (Refunds 1 body material + 1 core material)
  const handleDisassembleGolem = (id: string) => {
    const target = golemList.find((g) => g.id === id);
    if (!target) return;

    // Starter Golem cannot be disassembled to avoid material exploit
    if (target.isStarter || target.id === 'golem_starter') {
      return;
    }

    setInventory((prev) => ({
      ...prev,
      body: { ...prev.body, [target.body]: (prev.body[target.body] || 0) + 1 },
      core: { ...prev.core, [target.core]: (prev.core[target.core] || 0) + 1 },
    }));

    const updated = golemList.filter((g) => g.id !== id);
    setGolemList(updated);
    setUnitBlueprintSources((sources) => {
      const next = { ...sources };
      delete next[id];
      return next;
    });
    if (activeGolemId === id) {
      setActiveGolemId(updated[0]?.id || null);
    }
  };

  // Add Materials from Expedition Loots
  const handleAddMaterials = (
    loots: Array<{ category: MaterialCategory; id: string; name: string; count: number }>
  ) => {
    setInventory((prev) => {
      const updated = { ...prev };
      loots.forEach((loot) => {
        if (loot.category === 'body') {
          const key = loot.id as BodyType;
          updated.body = { ...updated.body, [key]: (updated.body[key] || 0) + loot.count };
        } else if (loot.category === 'core') {
          const key = loot.id as CoreType;
          updated.core = { ...updated.core, [key]: (updated.core[key] || 0) + loot.count };
        } else if (loot.category === 'rune') {
          const key = loot.id as RuneType;
          updated.rune = { ...updated.rune, [key]: (updated.rune[key] || 0) + loot.count };
        }
      });
      return updated;
    });
  };

  // Reset Save Data
  const handleResetData = () => {
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_inv`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_golems`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_activeId`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_traits`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_day`);
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_actions`);
    localStorage.removeItem(R2_BLUEPRINT_STORAGE_KEY);
    localStorage.removeItem(R2_TELEMETRY_STORAGE_KEY);
    localStorage.removeItem(R2_UNIT_SOURCE_STORAGE_KEY);

    setInventory(DEFAULT_INVENTORY);
    setDiscoveredTraits([]);
    const starterStats = calculateGolemStats('stone', 'wind', 'defense');
    const starterTraits = getGolemTraits('stone', 'wind', 'defense');
    const starterGolem: Golem = {
      id: 'golem_starter',
      name: generateGolemName('stone', 'wind', 'defense'),
      body: 'stone',
      core: 'wind',
      rune: 'defense',
      stats: starterStats,
      traits: starterTraits,
      createdAt: Date.now(),
      expeditionsCount: 0,
      durability: 100,
      isStarter: true,
    };
    setGolemList([starterGolem]);
    setActiveGolemId(starterGolem.id);
    setCurrentTab('workshop');
    setDay(1);
    setActionsLeft(ACTIONS_PER_DAY);
    setBlueprintLibrary(EMPTY_BLUEPRINT_LIBRARY);
    setBlueprintTelemetry([]);
    setUnitBlueprintSources({});
    activeSaveOpportunityRef.current = null;
    setR2MeasurementEpoch((epoch) => epoch + 1);
  };

  return (
    <div className="min-h-screen bg-[#0F1113] bg-grid-dots text-[#E0E2E4] font-sans antialiased selection:bg-amber-500 selection:text-black flex flex-col">
      {/* Header */}
      <Header
        currentTab={currentTab}
        setTab={setCurrentTab}
        inventory={inventory}
        openInventory={() => setIsInventoryOpen(true)}
        onResetData={handleResetData}
        hasActiveGolem={!!activeGolem}
        day={day}
        actionsLeft={actionsLeft}
      />

      {/* Main Tab Views */}
      <main className="flex-1 pb-12 pt-4">
        <div className="max-w-6xl mx-auto px-4 pb-2 flex items-center justify-between gap-3 font-mono">
          <div className="text-xs text-[#8A8F98]">製造・修理・遠征は各1 ACTION。解体は0 ACTION。</div>
          <button onClick={() => { setDay((value) => value + 1); setActionsLeft(ACTIONS_PER_DAY); }} disabled={actionsLeft > 0} className={`px-4 py-2 text-xs font-bold border rounded-xs ${actionsLeft === 0 ? 'border-amber-500 bg-amber-500 text-black' : 'border-[#2D3135] text-[#555B63] cursor-not-allowed'}`}>次の日へ</button>
        </div>
        {currentTab === 'workshop' && (
          <WorkshopView
            key={r2MeasurementEpoch}
            inventory={inventory}
            discoveredTraits={discoveredTraits}
            onFabricateGolem={handleFabricateGolem}
            onGoToExpedition={() => setCurrentTab('expedition')}
            canAct={actionsLeft > 0}
            golemCount={golemList.length}
            maxGolems={MAX_GOLEMS}
            blueprints={blueprintLibrary.blueprints}
            onSaveOpportunityPresented={handleSaveOpportunityPresented}
            onSaveBlueprint={handleSaveBlueprint}
            onBlueprintLoaded={handleBlueprintLoaded}
            onBlueprintApplied={handleBlueprintApplied}
            onBlueprintModified={handleBlueprintModified}
          />
        )}

        {currentTab === 'expedition' && (
          <ExpeditionView
            golemList={golemList}
            inventory={inventory}
            onAddMaterials={handleAddMaterials}
            onUpdateGolem={handleUpdateGolem}
            onGoToWorkshop={() => setCurrentTab('workshop')}
            canAct={actionsLeft > 0}
            onConsumeAction={consumeAction}
            onExpeditionStarted={(golemId) => {
              const opportunityId = createTelemetryId('redeploy-opportunity');
              const attribution = unitBlueprintSources[golemId] ?? { source: 'MANUAL_NEW' as const };
              setBlueprintTelemetry((events) => {
                const withOpportunity = appendBlueprintTelemetryEvent(events, {
                  type: 'redeploy_decision',
                  opportunity_id: opportunityId,
                  blueprint_available: blueprintLibrary.blueprints.length > 0,
                });
                return appendBlueprintTelemetryEvent(withOpportunity, {
                  type: 'expedition_started',
                  opportunity_id: opportunityId,
                  source: attribution.source,
                  blueprint_id: attribution.blueprintId,
                });
              });
            }}
          />
        )}

        {currentTab === 'golem' && (
          <GolemView
            activeGolem={activeGolem}
            golemList={golemList}
            inventory={inventory}
            onSelectActiveGolem={(g) => setActiveGolemId(g.id)}
            onRenameGolem={handleRenameGolem}
            onDisassembleGolem={handleDisassembleGolem}
            onUpdateGolem={handleUpdateGolem}
            onRepairGolemWithMaterial={handleRepairGolemWithMaterial}
            onGoToExpedition={() => setCurrentTab('expedition')}
            onGoToWorkshop={() => setCurrentTab('workshop')}
            canAct={actionsLeft > 0}
          />
        )}
      </main>

      {/* Inventory Stock Modal */}
      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        inventory={inventory}
      />

      {/* Footer */}
      <footer className="border-t border-[#2D3135] bg-[#121417] py-3 px-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#8A8F98] font-mono gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>GOLEM BUILDER — EXPERIMENTAL FOUNDRY</span>
        </div>
        <div>DESIGN ➔ FABRICATION ➔ DEPLOYMENT ➔ RECOVERY</div>
      </footer>
    </div>
  );
}
