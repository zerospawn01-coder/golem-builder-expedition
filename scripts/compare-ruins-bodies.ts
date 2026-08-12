import { spawnSync } from 'node:child_process';
import type { BodyType } from '../src/types';
import type { VariantName } from './experiment-variants';

interface RunResult {
  ruinsReachedDay: number | null;
  actions: { build: number; repair: number; expedition: number; disassemble: number };
  ruinsAttempts: Array<{ body: BodyType; damage: number; status: string; foundWeight: number; recoveredWeight: number }>;
}

const variants: VariantName[] = ['A_NUMERIC', 'C_MULTI_AXIS'];
const bodies: BodyType[] = ['stone', 'wood', 'iron', 'clay'];
const runs = 30;
const seed = 20260812;
const maxDays = 30;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

const rows = variants.flatMap((variant) => bodies.map((body) => {
  const execution = spawnSync(process.execPath, [
    '--import', 'tsx', 'scripts/playtest.ts', `--variant=${variant}`, `--runs=${runs}`,
    `--seed=${seed}`, `--max-days=${maxDays}`, '--policy=PROGRESSION_GREEDY', `--ruins-body=${body}`, '--json',
  ], { encoding: 'utf8' });
  if (execution.status !== 0) throw new Error(execution.stderr || `playtest failed for ${variant}/${body}`);
  const output = JSON.parse(execution.stdout) as { runs: RunResult[] };
  const successes = output.runs.filter((run) => run.ruinsReachedDay !== null);
  const attempts = output.runs.flatMap((run) => run.ruinsAttempts);
  const totalActions = output.runs.reduce((sum, run) => sum + run.actions.build + run.actions.repair + run.actions.expedition, 0);
  return {
    variant, body, successes: successes.length, runs,
    medianDay: median(successes.map((run) => run.ruinsReachedDay as number)),
    medianDamage: median(attempts.map((attempt) => attempt.damage)),
    medianFoundWeight: median(attempts.map((attempt) => attempt.foundWeight)),
    medianRecoveredWeight: median(attempts.map((attempt) => attempt.recoveredWeight)),
    repairShare: totalActions === 0 ? 0 : output.runs.reduce((sum, run) => sum + run.actions.repair, 0) / totalActions,
    attempts: attempts.length,
  };
}));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ config: { runs, seed, maxDays, policy: 'PROGRESSION_GREEDY' }, rows }, null, 2));
} else {
  console.log('ANCIENT RUINS BODY COMPARISON — A control vs C candidate');
  console.log('variant body success medianDay medianDamage foundWeight recoveredWeight repairShare');
  for (const row of rows) console.log(`${row.variant} ${row.body} ${row.successes}/${row.runs} ${row.medianDay ?? '-'} ${row.medianDamage ?? '-'} ${row.medianFoundWeight ?? '-'} ${row.medianRecoveredWeight ?? '-'} ${(row.repairShare * 100).toFixed(1)}%`);
}
