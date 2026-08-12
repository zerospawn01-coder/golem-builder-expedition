# GOLEM BUILDER — 派遣特化MVP

Release baseline: `v2.0.0`

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

機械処理用のrun別データは `--json` で出力します。

```bash
npm run playtest -- --runs=30 --seed=20260812 --max-days=30 --json
```

記録対象は古代遺跡到達DAY、行動内訳、機体使用回数、部品選択回数、素材の発見・回収・廃棄数、中破後の判断、最終3体構成です。同じ引数なら同じ結果になります。
