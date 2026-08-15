# R2_BLUEPRINT_LIBRARY_V1 — Preregistration

```text
STATUS        PREREGISTERED
CANONICAL     HOLD
PURPOSE       DESIGN-KNOWLEDGE RETENTION & REUSE
```

## Research question

過去の設計知を保存・参照・再利用できることは、プレイヤーの再派遣・再挑戦行動に実際に利用されるか。

## Frozen schema

```text
Blueprint {
  blueprint_id
  part_ids { frame_id, reactor_id, control_sigil_id }
  purpose_tag_ids
  expedition_record_refs
}
```

BlueprintはUnitではない。stats、traits、damage、durability、inventory、cargo、ACTION、DAY、RNG、progressionを保存しない。記録値をコピーせず、既存Expedition Record IDだけを参照する。解決不能参照は`REFERENCE UNAVAILABLE`としてfail closedする。

## Automated gates

```text
G-R2-A Actionability
G-R2-B Persistence Integrity
G-R2-C Canonical State Isolation
G-R2-D Old-path Regression
```

全機械GateがPASSしない場合はREJECTする。

## Behavioral evidence

```text
eligible save opportunities >= 30
eligible redeploy decisions  >= 30
```

不足時はFAILではなく`INSUFFICIENT EVIDENCE`とする。

Behavioral PASSには以下をすべて要求する。

```text
reuse_rate                  >= 30%
blueprint_redeploy_rate     >= 30%
median time to first reuse  <= 3 eligible opportunities
```

`save_rate >= 25%`は診断目標であり単独FAIL条件ではない。`modified_resave_rate`には閾値を設定しない。

## Operational telemetry semantics

This section makes the preregistered opportunity domain executable before behavioral collection begins. It calibrates the measurement implementation; it does not change the research question or thresholds.

### Save opportunity

`blueprint_save_opportunity` is emitted once when a legal `FRAME / REACTOR / CONTROL SIGIL` design is presented as saveable. Its stable `opportunity_id` survives rerenders and is issued independently of whether the player saves.

Saving emits only `blueprint_saved`, correlated to that existing `opportunity_id`.

```text
save_rate
= unique saved opportunity IDs
/ unique eligible save opportunity IDs
```

### Time to first reuse

`blueprint_applied.opportunity_index` is the absolute count of unique eligible redeploy opportunities observed when that Blueprint is first applied. The saved-at index is derived for each Blueprint from the ordered telemetry stream.

```text
time_to_first_reuse
= first applied opportunity index
- Blueprint saved-at opportunity index
```

The metric is therefore relative to each Blueprint's own save point, not to the start of the run.

### Blueprint-assisted redeployment

The denominator is the unique `redeploy_decision.opportunity_id` set where `blueprint_available == true`. The numerator uses the final `expedition_started` decision correlated to the same ID and counts it only when its source is `BLUEPRINT_DIRECT` or `BLUEPRINT_MODIFIED`.

Each opportunity contributes at most one numerator and one denominator count. Unrelated result events are ignored.

```text
0.0 <= blueprint_redeploy_rate <= 1.0
```

Identical duplicate opportunity definitions are ignored. Reuse of one ID for conflicting definitions is rejected. Metric values outside their valid range fail closed.

## Freeze rule

実装後にschema、閾値、behavior definitionを変更してV1を再判定しない。変更はV2として独立事前登録する。

The operational clarification above was recorded before behavioral collection. Telemetry produced by the uncalibrated PR implementation is test data, not V1 behavioral evidence.
