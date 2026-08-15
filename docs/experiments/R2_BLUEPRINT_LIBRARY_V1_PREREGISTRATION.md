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

## Freeze rule

実装後にschema、閾値、behavior definitionを変更してV1を再判定しない。変更はV2として独立事前登録する。
