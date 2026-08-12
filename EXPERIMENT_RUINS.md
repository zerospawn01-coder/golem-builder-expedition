# Ancient Ruins A/B/C experiment

Baseline commit: `3f77e9a1bbb2c80122ddb83459228bb8ca516e70`

固定条件：30 runs × 6 policies、base seed `20260812`、最大30日。softlock修正は含めない。

| 指標 | BASELINE | A_NUMERIC | B_RECIPE | C_MULTI_AXIS |
|---|---:|---:|---:|---:|
| 遺跡 feasible builds | 0 | 3 | 0 | 4 |
| 異なるBODY | 0 | 3 | 0 | 4 |
| SAFE / DAMAGED / PARTIAL | 0 / 0 / 0 | 0 / 0 / 3 | 0 / 0 / 0 | 0 / 3 / 1 |
| 廃坑 feasible | 8 | 8 | 8 | 8 |
| 進行deadlock | YES | NO | YES | NO |
| reachable softlock | YES | YES | YES | YES |
| 6-policy成功 | 0 / 180 | 82 / 180 | 0 / 180 | 82 / 180 |
| 成功したpolicy数 | 0 / 6 | 4 / 6 | 0 / 6 | 4 / 6 |
| 到達DAY中央値 | — | 3 | — | 3 |
| 最大部品集中率 | 27.8% | 27.4% | 27.8% | 27.4% |

## 初期判定

- Aは最小変更でCSPを成立させ、3BODYを残す。全解がPARTIALのため難度は維持される。
- Bは水COREの進行キーを維持するが、耐熱以外の損傷層を解決できず不成立。
- Cは4BODYすべてに攻略経路を作り、DAMAGEDとPARTIALの差も生む。ただし正式採用時のルール説明量が最大になる。
- AとCのbot成功数が同一なのは、現行botが最良経路の違いを評価せず、同じ進行優先で機体を選ぶため。静的な解空間は異なる。

この結果は採用決定ではなく、変更仮説の比較記録である。
