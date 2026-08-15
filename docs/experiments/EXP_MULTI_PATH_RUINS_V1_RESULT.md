# EXP_MULTI_PATH_RUINS_V1 — Preregistered Audit Result

```text
VERDICT    FAIL
CANONICAL  HOLD
```

V1の事前登録値は監査後に変更していない。次のmodifier変更は同一実験の再実行ではなく、別variantとして扱う。

## Enumeration

```text
all builds  512
old builds   64
```

R2部品は正本部品ID、正本型、正本パーツ表、進行データへ追加していない。同カテゴリの正本buildへ隔離modifierとして適用した。

## Ruins gates

| Gate | Result | Pass |
| --- | ---: | :---: |
| reachable softlock | 0 | PASS |
| feasible builds | 32 / minimum 4 | PASS |
| distinct FRAME | 4 / minimum 2 | PASS |
| distinct REACTOR | 1 / minimum 2 | **FAIL** |
| qualified solution families | 2 / minimum 3 | **FAIL** |
| largest family share | 43.75% / maximum 50% | PASS |
| maximum single new-part share | 50% / maximum 75% | PASS |
| all-three-new-parts share | 0% / maximum 25% | PASS |

Family distribution:

```text
INSULATION    4 / 32 = 12.50%  NOT QUALIFIED
OUTPUT       14 / 32 = 43.75%  QUALIFIED
MOBILITY     10 / 32 = 31.25%  QUALIFIED
MIXED         0 / 32
UNCLASSIFIED  4 / 32
```

`INSULATION` は存在するが、事前登録した15% share条件へ届かないためdistinct familyには数えていない。進入特性を満たす既存組合せが水REACTORに限定され、`distinct_REACTOR` は1となった。

## Pareto concentration

Ruins Pareto builds: 2

```text
wood/water/attack/OLD
clay/water/attack/XR-RE-01_VOID+XR-CS-01_DUAL_CHANNEL
```

```text
XR-FR-01_ELDERWOOD share       0%
XR-RE-01_VOID share           50%
XR-CS-01_DUAL_CHANNEL share   50%
all three share                0%
```

## Early-zone dominance

| Zone | New-part Pareto share | Cap | Pass |
| --- | ---: | ---: | :---: |
| Quarry | 0 / 39 = 0% | 30% | PASS |
| Forest | 0 / 15 = 0% | 40% | PASS |
| Mine | 0 / 1 = 0% | 50% | PASS |

## Regression and prediction

```text
Quarry old viable build loss  0
Forest old viable build loss  0
Mine old viable build loss    0
old outcome/damage mismatch   0

prediction/actual mismatch    0
armor cause mismatch          0
mobility cause mismatch       0
work cause mismatch           0
encounter cause mismatch      0
```

Predictionとresolutionは別式を持たず、modifier適用後に同じ純粋評価関数を呼んでいる。

## Decision

```text
DESIGNED       PASS
IMPLEMENTED    PASS
ENUMERATION    PASS
REGRESSION     PASS
DIVERSITY      FAIL
DOMINANCE      PASS
PREDICTION     PASS

PREFERRED CANDIDATE  NO
CANONICAL            HOLD
```
