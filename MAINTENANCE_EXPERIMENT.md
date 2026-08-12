# M0/M1 Maintenance Experiment

固定条件：v2.0.0遠征ルール、30 runs × 6 policies、base seed `20260812`、最大30日。C、個体差、部位損傷、部品交換は含めない。

## Variant

- `M0_SINGLE_REPAIR`: 1 ACTION、対応BODY×1、耐久+25。
- `M1_THREE_TIER_MAINTENANCE`
  - 応急：0 ACTION、素材0、+10、上限60、機体ごとに1遠征につき1回。
  - 通常：1 ACTION、対応BODY×1、+35。
  - オーバーホール：2 ACTION、対応BODY×1、耐久100。

## Result

| 指標 | M0 | M1 |
|---|---:|---:|
| 応急 | 0 | 8,010 |
| 通常 | 1,032 | 506 |
| オーバーホール | 0 | 132 |
| 最大整備集中率 | 100.0% | 92.6%（応急） |
| 整備ACTION比率 | 13.9% | 5.3% |
| 整備後に遠征 | 917 | 8,325 |
| 同機を再出撃 | 688 | 7,905 |
| 別機へ切替 | 229 | 420 |

M1の応急修理8,010件中6,930件は耐久0–19で選ばれた。応急修理を遠征なしで連打したケースは0で、機体別・遠征別の使用制限は正常に機能している。

しかし、`応急 → 低耐久で遠征 → 大破 → 新しい遠征ID → 再応急`という循環が成立し、応急修理が全整備の92.6%を占めた。これは事前に定めた「任意の修理方法が80%以上」の棄却条件に該当する。

## Verdict

```text
M0_SINGLE_REPAIR
CONTROL

M1_THREE_TIER_MAINTENANCE
REJECT — EMERGENCY REPAIR DOMINANCE

M2_ROUTE_WEAR
BLOCKED
```

softlock対策として成功したかではなく、整備選択が成立しなかったため棄却する。次の実験では応急修理の役割または低耐久出撃の期待価値を再設計し、通常整備・オーバーホールとの条件付き選択を作る必要がある。

## M1R — Recovery Separation

M1の結果を受け、応急処置を戦略整備から分離した。

```text
応急復旧
耐久0限定 / 1 ACTION / 素材0 / 耐久20

通常整備
1 ACTION / BODY×1 / +35

オーバーホール
2 ACTION / BODY×1 / 耐久100
```

| 指標 | M1R |
|---|---:|
| 応急復旧 | 3,386 |
| 通常整備 | 1,000 |
| オーバーホール | 86 |
| 最大整備集中率 | 75.7%（応急） |
| 整備ACTION比率 | 31.3% |
| 損傷状態で出撃 | 9,018 |
| 機体切替 | 1,488 |
| 応急復旧ループ | 3,127 |

応急の80%支配は解消したが、応急復旧の92.4%が `耐久0 → 復旧20 → 遠征 → 再大破` になった。

方針別ループ：

- `PROGRESSION_GREEDY`: 1,086
- `SURVIVAL_FIRST`: 1,036
- `REPAIR_FIRST`: 1,005
- `WORK_MAX / SCRAP_FIRST / RANDOM_LEGAL`: 0

bot方針による差は大きいが、進行・生存・修理を優先する合理的方針で再現するため、仕様上も低耐久復旧後の安全な選択肢が不足している。

```text
M1R_RECOVERY_SEPARATION
REJECT — EMERGENCY RECOVERY LOOP

M2_ROUTE_WEAR
BLOCKED BY M1R RESULT
```

次案では、復旧後に危険な遠征へそのまま再投入させない仕組み、または耐久20から資源を再獲得できる安全な整備・作業経路が必要になる。
