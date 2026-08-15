import { BODIES, CORES, RUNES } from '../../data/gameData';
import type { BodyType, CoreType, RuneType } from '../../types';
import { R2_PART_CATALOG, type R2PartId } from './partCatalog';

export interface R2Build {
  body: BodyType;
  core: CoreType;
  rune: RuneType;
  experimentalParts: R2PartId[];
}

export function buildKey(build: R2Build): string {
  return `${build.body}/${build.core}/${build.rune}/${build.experimentalParts.join('+') || 'OLD'}`;
}

export function enumerateR2Builds(): R2Build[] {
  const frames = [undefined, R2_PART_CATALOG['XR-FR-01_ELDERWOOD'].id] as const;
  const reactors = [undefined, R2_PART_CATALOG['XR-RE-01_VOID'].id] as const;
  const sigils = [undefined, R2_PART_CATALOG['XR-CS-01_DUAL_CHANNEL'].id] as const;
  return (Object.keys(BODIES) as BodyType[]).flatMap((body) =>
    (Object.keys(CORES) as CoreType[]).flatMap((core) =>
      (Object.keys(RUNES) as RuneType[]).flatMap((rune) =>
        frames.flatMap((frame) => reactors.flatMap((reactor) => sigils.map((sigil) => ({
          body, core, rune, experimentalParts: [frame, reactor, sigil].filter((id): id is R2PartId => Boolean(id)),
        })))),
      ),
    ),
  );
}
