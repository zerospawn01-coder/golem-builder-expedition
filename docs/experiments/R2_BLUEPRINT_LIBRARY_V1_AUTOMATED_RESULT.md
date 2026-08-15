# R2_BLUEPRINT_LIBRARY_V1 — Implementation and Machine Result

```text
IMPLEMENTATION COMPLETION   PASS
MACHINE RE-VERIFICATION     PASS
METRIC CALIBRATION          PASS
R2-BEH-01–05               PASS
G-R2-A                      PASS
G-R2-B                      PASS
G-R2-C                      PASS
G-R2-D                      PASS
BEHAVIORAL COLLECTION       NOT STARTED
BEHAVIORAL EVIDENCE         INSUFFICIENT
FINAL VERDICT               INSUFFICIENT EVIDENCE
CANONICAL                   HOLD
R2 V1 MEASUREMENT           AWAITING PR RE-REVIEW / MAIN MERGE
```

Machine re-verification date: 2026-08-15

## Implementation completion

```text
Blueprint purpose identification       PASS
Library -> Design Form load             PASS
Loaded-design modification              PASS
Design Form -> Fabrication               PASS
canonical fabricateGolem() execution    PASS
```

Purpose tags use the frozen `purpose_tag_ids` field. The player chooses them, they are persisted with the design references, and they have no stat, damage, inventory, ACTION, progression, or fabrication effect.

Loading restores `part_ids` and purpose metadata into the Design Form even when the corresponding materials are unavailable. Fabrication availability remains owned by the unchanged canonical fabrication transaction.

## Automated gates

```text
valid save/load/apply            PASS
invalid reference fail-closed    PASS
save/load ACTION consumption     0
save/load resource mutation      0
automatic fabrication            0
round-trip mismatch              0
part reference mismatch          0
record reference corruption      0
duplicate blueprint ID           0
canonical state duplication      0
old-path regression              0
```

Blueprintから復元されるのは設計draftだけであり、製造は既存の`fabricateGolem()` transactionを通る。

## Machine re-verification

```text
pnpm verify:r2-blueprints   PASS
pnpm lint                   PASS
pnpm build                  PASS
pnpm verify:fabrication     PASS (5 cases)
pnpm verify:damage          PASS (5120 cases)
pnpm verify:gravity-depth   PASS (1280 build/depth cases)
```

## Behavioral metric calibration

The initial PR implementation passed the feature gates but could not produce valid behavioral evidence. Calibration was completed before any formal human sample was collected.

```text
R2-BEH-01  10 save opportunities / 3 saves = 0.30      PASS
R2-BEH-02  saved at 40 / first reused at 42 = 2        PASS
R2-BEH-03  10 redeploy opportunities / 5 assisted = .5 PASS
R2-BEH-04  duplicate result events count once           PASS
R2-BEH-05  redeploy_rate > 1.0 rejected                 PASS
```

Save opportunity emission is now independent of the save action. First reuse is a Blueprint-relative delta. Redeploy numerator and denominator are joined on the same stable opportunity ID. Identical opportunity duplicates are ignored and conflicting reuse of an ID fails closed.

Functional browser verification also completed the following path without console errors:

```text
PURPOSE SELECT
-> SAVE AS NEW
-> LOAD
-> DESIGN FORM APPLY
-> optional MODIFY
-> FABRICATE
-> ACTION and material consumption by canonical transaction
```

The save action remained consumed across ordinary rerenders, purpose-tag edits, and Workshop unmount/remount. Changing the legal part design issued the next save opportunity. No console errors were observed.

## Behavioral state

```text
eligible save opportunities  0 / required 30
eligible redeploy decisions  0 / required 30
```

行動Gateは未実施であり、H1/H0の判定材料はまだない。botによる機械テスト結果を再挑戦動機の証拠には数えない。したがって、実装と機械GateのPASSはBehavioral PASSへの昇格を意味しない。

Behavioral collection remains `NOT STARTED`. Telemetry from the uncalibrated PR revision is excluded. Collection becomes ready only after review, main integration, fresh-session initialization, and CI confirmation.

収集・判定手順は[`R2_BLUEPRINT_LIBRARY_V1_BEHAVIORAL_PROTOCOL.md`](R2_BLUEPRINT_LIBRARY_V1_BEHAVIORAL_PROTOCOL.md)に固定する。
