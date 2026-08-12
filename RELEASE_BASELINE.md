# v2.0.0 Release Baseline

This repository is the reviewable source baseline for the expedition-focused GOLEM BUILDER MVP.

## Source identity

- Branch: `main`
- Tag: `v2.0.0`
- Release archive: `golem-builder-expedition-v2-fixed.zip`
- Archive SHA-256: `34C404AF3F88D406C366E051C6E9933412404E030C7A97836556168B98B00270`

## Verification

```powershell
node ./node_modules/typescript/bin/tsc --noEmit
node ./node_modules/vite/bin/vite.js build
```

Both checks passed for this baseline on 2026-08-12.

## Review scope

The baseline includes the three-golem limit, three ACTIONS per day, BODY-specific repair cost, WORK-based cargo selection, the starter save migration, and the trait-gated route through the abandoned mine to the ancient ruins.

Generated dependencies and build output are intentionally excluded from Git.
