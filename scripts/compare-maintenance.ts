import { spawnSync } from 'node:child_process';

type MaintenanceType = 'emergency' | 'standard' | 'overhaul';
interface Event {
  maintenanceType: MaintenanceType;
  durabilityBefore: number;
  actionsBefore: number;
  actionsAfter: number;
  nextAction: string | null;
  golemId: string;
  nextGolemId: string | null;
  sameGolemRedeployed: boolean;
  switchedGolem: boolean;
}
interface Run { policy: string; actions: { build: number; expedition: number }; maintenanceEvents: Event[]; deployDamaged: number; switchGolem: number; emergencyLoops: number }

const variants = ['M0_SINGLE_REPAIR', 'M1_THREE_TIER_MAINTENANCE', 'M1R_RECOVERY_SEPARATION'];
const rows = variants.map((maintenance) => {
  const execution = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/playtest.ts', '--variant=BASELINE', `--maintenance=${maintenance}`, '--runs=30', '--seed=20260812', '--max-days=30', '--policy=all', '--json'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (execution.status !== 0) throw new Error(execution.stderr || `${maintenance} failed`);
  const runs = (JSON.parse(execution.stdout) as { runs: Run[] }).runs;
  const events = runs.flatMap((run) => run.maintenanceEvents);
  const counts = { emergency: 0, standard: 0, overhaul: 0 };
  const bands: Record<MaintenanceType, Record<string, number>> = {
    emergency: {}, standard: {}, overhaul: {},
  };
  for (const event of events) {
    counts[event.maintenanceType] += 1;
    const start = Math.floor(event.durabilityBefore / 20) * 20;
    const band = `${start}-${Math.min(99, start + 19)}`;
    bands[event.maintenanceType][band] = (bands[event.maintenanceType][band] ?? 0) + 1;
  }
  const maintenanceActions = events.reduce((sum, event) => sum + event.actionsBefore - event.actionsAfter, 0);
  const otherActions = runs.reduce((sum, run) => sum + run.actions.build + run.actions.expedition, 0);
  const dominantShare = events.length === 0 ? 0 : Math.max(...Object.values(counts)) / events.length;
  const repeatedEmergencyWithoutExpedition = events.filter((event) => event.maintenanceType === 'emergency' && event.nextAction === 'repair_emergency' && event.nextGolemId === event.golemId).length;
  const byPolicy = Object.fromEntries([...new Set(runs.map((run) => run.policy))].map((policy) => {
    const policyRuns = runs.filter((run) => run.policy === policy);
    const policyEvents = policyRuns.flatMap((run) => run.maintenanceEvents);
    return [policy, {
      emergency: policyEvents.filter((event) => event.maintenanceType === 'emergency').length,
      standard: policyEvents.filter((event) => event.maintenanceType === 'standard').length,
      overhaul: policyEvents.filter((event) => event.maintenanceType === 'overhaul').length,
      emergencyLoops: policyRuns.reduce((sum, run) => sum + run.emergencyLoops, 0),
      deployDamaged: policyRuns.reduce((sum, run) => sum + run.deployDamaged, 0),
      switchGolem: policyRuns.reduce((sum, run) => sum + run.switchGolem, 0),
    }];
  }));
  return {
    maintenance,
    events: events.length,
    counts,
    bands,
    dominantShare,
    maintenanceActionShare: maintenanceActions / Math.max(1, maintenanceActions + otherActions),
    sameGolemRedeployed: events.filter((event) => event.sameGolemRedeployed).length,
    switchedGolem: events.filter((event) => event.switchedGolem).length,
    deployAfterMaintenance: events.filter((event) => event.nextAction === 'expedition').length,
    repeatedEmergencyWithoutExpedition,
    emergencyLoops: runs.reduce((sum, run) => sum + run.emergencyLoops, 0),
    deployDamaged: runs.reduce((sum, run) => sum + run.deployDamaged, 0),
    switchGolemTotal: runs.reduce((sum, run) => sum + run.switchGolem, 0),
    byPolicy,
    rejectReasons: maintenance === 'M0_SINGLE_REPAIR' ? [] : [
      ...(dominantShare >= 0.8 ? [`dominant maintenance share ${(dominantShare * 100).toFixed(1)}% >= 80%`] : []),
      ...(maintenanceActions / Math.max(1, maintenanceActions + otherActions) > 0.5 ? ['maintenance ACTION share > 50%'] : []),
      ...(repeatedEmergencyWithoutExpedition > 0 ? ['emergency repair repeated without expedition'] : []),
      ...(maintenance === 'M1R_RECOVERY_SEPARATION' && runs.reduce((sum, run) => sum + run.emergencyLoops, 0) > 0 ? ['emergency recovery loop detected'] : []),
    ],
  };
});

if (process.argv.includes('--json')) console.log(JSON.stringify({ rows }, null, 2));
else {
  console.log('M0/M1 MAINTENANCE COMPARISON — 30 runs × 6 policies');
  for (const row of rows) {
    console.log(`\n${row.maintenance}`);
    console.log(`uses: emergency ${row.counts.emergency}, standard ${row.counts.standard}, overhaul ${row.counts.overhaul}`);
    console.log(`dominant share ${(row.dominantShare * 100).toFixed(1)}%, maintenance ACTION share ${(row.maintenanceActionShare * 100).toFixed(1)}%`);
    console.log(`post-maintenance expedition ${row.deployAfterMaintenance}, same golem ${row.sameGolemRedeployed}, switched ${row.switchedGolem}`);
    console.log(`deploy damaged ${row.deployDamaged}, switch golem ${row.switchGolemTotal}, emergency loops ${row.emergencyLoops}`);
    console.log(`by policy: ${JSON.stringify(row.byPolicy)}`);
    console.log(`verdict: ${row.maintenance === 'M0_SINGLE_REPAIR' ? 'CONTROL' : row.rejectReasons.length > 0 ? `REJECT — ${row.rejectReasons.join('; ')}` : 'PROMISING'}`);
    console.log(`durability bands: ${JSON.stringify(row.bands)}`);
  }
}
