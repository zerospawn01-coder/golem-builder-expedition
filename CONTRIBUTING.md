# Contributing

GOLEM BUILDER separates canonical product rules from experimental rule spaces. Preserve that boundary in every change.

## Before opening a change

Classify the work as one of:

- **Canonical:** changes the normal product or shared rule contract.
- **Experimental:** available only through explicit experiment activation and isolated state.
- **Documentation-only:** records a decision or clarifies an existing contract.
- **Visual reference:** communicates direction without defining mechanics.

Do not combine unrelated rule changes, recovery systems, economy changes, or additional tests into a feature merely because they are nearby.

## Development setup

```bash
pnpm install --frozen-lockfile
pnpm dev
```

## Required checks

Run the checks relevant to the changed surface. The minimum shared set is:

```bash
pnpm lint
pnpm build
pnpm verify:damage
pnpm verify:gravity-depth
pnpm verify:fabrication
pnpm verify:r2-blueprints
```

`pnpm audit:rules` is diagnostic. The documented baseline can intentionally return a non-zero exit status for known feasibility or softlock findings.

## Pull request expectations

A pull request should state:

1. the classification of the change;
2. the player-facing or developer-facing reason;
3. whether canonical rules or saves change;
4. the verification commands run;
5. any known hold, failed gate, or follow-up decision.

Do not describe a target value, concept image, or unimplemented mechanic as measured production behavior.

## Terminology

Use the canonical product terms in [`docs/WORLD_AND_TERMINOLOGY.md`](docs/WORLD_AND_TERMINOLOGY.md). Internal IDs such as `body`, `core`, and `rune` may remain in code where migration is not justified, but player-facing UI and documentation use `FRAME`, `REACTOR`, and `CONTROL SIGIL`.

## Generated and local files

Do not commit dependency directories, build output, environment files, local logs, editor state, or secrets. North Star assets and intentional test fixtures are source artifacts and may be committed under their documented directories.
