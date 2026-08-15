import { readFileSync } from 'node:fs';
import { assessBlueprintBehavioralEvidence, type BlueprintTelemetryEvent } from '../src/domain/blueprintLibrary';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: pnpm report:r2-blueprints -- <telemetry.json>');
  process.exit(2);
}

const parsed: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
if (!Array.isArray(parsed)) {
  throw new Error('R2 telemetry must be a JSON array.');
}

const assessment = assessBlueprintBehavioralEvidence(parsed as BlueprintTelemetryEvent[]);

console.log(JSON.stringify({
  experiment: 'R2_BLUEPRINT_LIBRARY_V1',
  ...assessment,
}, null, 2));
