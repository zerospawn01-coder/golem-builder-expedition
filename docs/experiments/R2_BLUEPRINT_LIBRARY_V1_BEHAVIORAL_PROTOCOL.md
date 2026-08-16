# R2_BLUEPRINT_LIBRARY_V1 — Behavioral Evidence Protocol

```text
IMPLEMENTATION   COMPLETE
MACHINE GATES    PASS
CALIBRATION      PASS
COLLECTION       NOT STARTED
BEHAVIORAL       INSUFFICIENT EVIDENCE
CANONICAL        HOLD
```

This protocol operationalizes the frozen V1 preregistration. It does not change the Blueprint schema, telemetry meaning, metric definitions, PASS thresholds, or verdict rules.

## Evidence boundary

- Count player behavior from coherent end-to-end play sessions.
- Do not count automated verification, scripted browser checks, or fabricated telemetry as behavioral evidence.
- Do not count telemetry produced by the uncalibrated PR revision.
- Keep the implementation frozen while collecting the required sample.
- If schema, telemetry meaning, metric definitions, or thresholds must change, preserve the V1 result and preregister V2.

## Minimum sample

```text
eligible save opportunities >= 30
eligible redeploy decisions  >= 30
```

Anything below either minimum produces `INSUFFICIENT EVIDENCE`, not `FAIL`.

## Collection readiness gate

Collection may change from `NOT STARTED` to `READY` only when all of the following are true:

```text
PR metric review addressed        PASS
R2-BEH-01–05                      PASS
all machine regression            PASS
GitHub Actions                    PASS
calibrated revision on main       PASS
fresh telemetry session           READY
```

Until then, main merge and Behavioral collection remain separate decisions. Merging the calibrated implementation does not remove `CANONICAL HOLD`.

## Frozen PASS conditions

```text
reuse_rate                  >= 30%
blueprint_redeploy_rate     >= 30%
median time to first reuse  <= 3 eligible opportunities
```

`save_rate >= 25%` remains diagnostic only. `modified_resave_rate` has no PASS threshold.

## Collection and report

The application persists V1 events locally under:

```text
golem_builder_r2_telemetry_v1
```

Export the JSON array after the play session without editing or merging synthetic events. Store evidence outside the repository unless the data has been reviewed for consent and privacy.

Generate the frozen metric report with:

```bash
pnpm report:r2-blueprints -- path/to/telemetry.json
```

The command returns exactly one of:

```text
PASS -> PREFERRED CANDIDATE / CANONICAL HOLD
FAIL -> REJECT
sample insufficient -> INSUFFICIENT EVIDENCE
```

A Behavioral PASS makes R2 V1 a preferred canonical candidate; it does not silently alter canonical rules or remove the explicit hold.
