# GOLEM BUILDER — 派遣特化MVP

Release baseline: `v2.0.0`

World and UI terminology baseline: [`docs/WORLD_AND_TERMINOLOGY.md`](docs/WORLD_AND_TERMINOLOGY.md)

MVP status and human-playtest policy: [`docs/MVP_STATUS_AND_PLAYTEST_POLICY.md`](docs/MVP_STATUS_AND_PLAYTEST_POLICY.md)

Current development priorities: [`docs/CURRENT_DEVELOPMENT_PRIORITIES.md`](docs/CURRENT_DEVELOPMENT_PRIORITIES.md)

V-1 Design / Fabrication information architecture and wireframe: [`docs/visual/V1_DESIGN_FABRICATION_WIREFRAME.md`](docs/visual/V1_DESIGN_FABRICATION_WIREFRAME.md)

ゴーレムを設計し、未知の地域へ派遣し、回収素材で次の専用機を作る短いビルドゲームです。独立戦闘モードは持たず、遭遇は遠征結果のPOWER / ARMOR判定として処理します。

## MVPの流れ

1. BODY / CORE / RUNEを選び、4能力と特殊特性を設計
2. 採石場・森林・廃坑・古代遺跡から派遣先を選択
3. 必須特性、推奨能力、予測損傷を比較して出撃
4. 遭遇・損傷・回収結果を確認し、新素材で次の機体を製造

派遣に実時間の待機はありません。面白さの中心は派遣前の設計判断です。

## 意思決定を生む制限

- 保有できるゴーレムは最大3体
- 1日は3 ACTION。製造・修理・遠征が各1 ACTION、解体は0 ACTION
- ACTIONが0になると任意に次の日へ進められ、待ち時間なく全回復
- 遠征後は発見品から `WORK × 2` の積載量以内で持ち帰る素材を選択
- 修理は1 ACTIONと、その機体と同じBODY素材1個を消費して耐久を25回復

素材重量はBODY=3、CORE=2、RUNE=1の3区分だけです。

## Run locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

No API key is required.

## 再現可能なロジック・プレイテスト

UIを操作せず、`v2.0.0` のルールを固定seedで繰り返す観測専用ハーネスを実行できます。ゲーム本体の素材数やバランス値は変更しません。

```bash
npm run playtest -- --runs=30 --seed=20260812 --max-days=30
```

bot固有の癖とゲーム側の傾向を分離するため、6種類の方針を比較できます。

```bash
npm run playtest -- --runs=30 --seed=20260812 --max-days=30 --policy=all
```

利用可能な方針は `PROGRESSION_GREEDY`、`SURVIVAL_FIRST`、`WORK_MAX`、`REPAIR_FIRST`、`SCRAP_FIRST`、`RANDOM_LEGAL` です。

各runの乱数状態が独立し、実行順を逆転しても結果が一致することは次で監査できます。

```bash
npm run playtest -- --runs=10 --seed=20260812 --max-days=30 --policy=all --verify-determinism
```

機械処理用のrun別データは `--json` で出力します。

```bash
npm run playtest -- --runs=30 --seed=20260812 --max-days=30 --json
```

記録対象は古代遺跡到達DAY、行動内訳、機体使用回数、部品選択回数、素材の発見・回収・廃棄数、中破後の判断、最終3体構成です。同じ引数なら同じ結果になります。

### ルール空間の静的監査

全64構成を全地域に照合し、SAFE／DAMAGED／PARTIAL／FAILED分布、攻略可能構成数、進行チェーン、入手不能部品、死に部品候補を検査します。さらに合法操作を最大60手まで探索し、到達可能なsoftlockと再現手順を探します。

```bash
npm run audit:rules
```

破綻地域または進行デッドロックを検出した場合は終了コード2を返します。詳細データは `npm run audit:rules -- --json` で出力できます。

### 古代遺跡A/B/C実験

正式ルールを変更せず、`--variant`で独立した実験条件を注入できます。

```bash
npm run audit:rules -- --variant=A_NUMERIC
npm run playtest -- --variant=A_NUMERIC --runs=30 --seed=20260812 --max-days=30 --policy=all
```

| variant | 実験条件 |
|---|---|
| `BASELINE` | v2.0.0そのまま |
| `A_NUMERIC` | 古代遺跡のみPOWER 5、MOBILITY 7、耐熱欠如損傷36 |
| `B_RECIPE` | 水CORE＋積載RUNEでも魔力感知を発現 |
| `C_MULTI_AXIS` | POWER／ARMOR／MOBILITY／WORKの最良突破経路を採用、耐熱欠如損傷42 |

これらは比較実験専用であり、ゲーム画面・保存データ・正式な特性レシピには反映されません。softlock条件も全variantで維持されます。

AとCのBODY別攻略結果は次で比較できます。

```bash
npm run experiment:ruins-bodies
```

各BODYを明示的に選択し、必要なBODY素材の取得地域へ戻る同一方針で、成功率、到達DAY、損傷、発見・回収重量、修理ACTION比率を測定します。

### C_UI_COMPREHENSION実験

通常ルールを変更せず、URLへ `?experiment=C_UI_COMPREHENSION` を付けた場合だけ、古代遺跡にCの複数攻略軸と因果表示を適用します。

```text
http://localhost:3000/?experiment=C_UI_COMPREHENSION
```

出撃前には必須／推奨条件、全4経路の損傷評価、採用経路、総損傷、積載量を表示します。帰還後には同じ採用経路と環境・移動・突破損傷を対応表示します。通常URLではこの実験UIもCルールも有効になりません。

```bash
npm run verify:c-ui
```

### M0/M1整備比較

正式ゲームへ反映せず、単一修理、3段階整備、復帰処置を分離したM1Rを同一条件で比較します。

```bash
npm run experiment:maintenance
```

結果と判定は `MAINTENANCE_EXPERIMENT.md` に記録しています。
