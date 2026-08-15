# GOLEM BUILDER — World & Terminology Baseline

```text
STATUS        MVP CANONICAL
WORLD AXIS    LOCKED
TERMINOLOGY   LOCKED
INTERNAL IDs  UNCHANGED
MVP RULES     UNCHANGED
```

## World premise

人類は「エーテル」と総称される未知現象を発見した。その原理はいまだ解明されていないが、特定の物質・炉心・幾何学刻印を組み合わせることで、無機構造体を駆動できることだけは分かっている。

人間が立ち入れない異常区域を調査するため、実験工廠では人工探索構造体――通称「ゴーレム」が製造されている。

GOLEM BUILDERの表現軸は次の3つとする。

- レトロ工業
- オカルト科学
- 探索工学

エーテルの正体、刻印が機能する理由、異常区域の起源は断定しない。世界設定は説明文よりも、試験記録、管理番号、警告表示、整備報告書を通して提示する。

## Naming boundary

内部IDとルール名は既存の実験結果、セーブデータ、ログとの互換性を守るため変更しない。プレイヤー向け表示だけを世界観語彙へ変換する。

| Concept | Internal ID | Player-facing English | 日本語表示 |
|---|---|---|---|
| Base | `WORKSHOP` | EXPERIMENTAL FOUNDRY | 実験工廠 |
| Golem | `GOLEM` / `UNIT` | GOLEM UNIT | ゴーレム機 |
| Body part | `BODY` | FRAME | 機体骨格 |
| Core part | `CORE` | REACTOR | 駆動炉心 |
| Rune part | `RUNE` | CONTROL SIGIL | 制御刻印 |
| Build | `BUILD` | FABRICATION | 製造 |
| Expedition | `EXPEDITION` | DEPLOYMENT | 派遣 |
| Region | `ZONE` | ANOMALOUS ZONE | 異常区域 |
| Damage | `DAMAGE` | STRUCTURAL DAMAGE | 構造損傷 |
| Disassemble | `DISASSEMBLE` | DISASSEMBLY | 解体 |
| Recovered items | `RECOVERY` | RECOVERED MATERIALS | 回収資材 |
| Anomalous item | `ANOMALOUS_DEPOSIT` | ANOMALOUS DEPOSIT | 異常析出物 |

`POWER / ARMOR / MOBILITY / WORK` は内部・表示とも維持する。短く読みやすく、ビルド比較に適しているため、過度なSF用語へ置き換えない。

MVPでは `EXPERIMENTAL FOUNDRY / 実験工廠` を拠点施設の名称として使用する。将来、解析・整備・資材管理を別区画へ拡張する場合は、施設全体ではなく主要製造区画の呼称として維持できる。

## Future / not yet canonical

- `FABRICATION VARIANCE / 製造偏差`
- 3段階整備
- 派遣・曝露履歴に依存する異常物回収

MVPの正式ルールが単一修理の間は、画面上では `REPAIR / 修復` を使用する。

3段階整備を正式採用する場合、軽整備の英語名は実行場所と挙動を確定してから選ぶ。派遣先で行う最低限の補修なら `FIELD REPAIR`、工廠帰還後の緊急処置なら `EMERGENCY REPAIR`、軽微な通常修理なら `MINOR REPAIR` とする。現時点ではいずれも正式語彙に固定しない。

## Interface voice

- ゴーレムは原則として `UNIT` と呼び、人格化しすぎない。
- 結果区分には `ACCEPTABLE / WARNING / CRITICAL` を優先する。
- 未知現象は断定せず、`POSSIBLE CAUSE / UNCLASSIFIED` と記録する。
- 魔法的な説明より、検査、整備、管理、曝露、回収の工業用語を優先する。
- フレーバーは作業票、製造試験、派遣報告、解体報告として提示する。

## MVP display loop

```text
DESIGN
→ FABRICATION
→ INSPECTION
→ DEPLOYMENT
→ DAMAGE ASSESSMENT
→ MAINTENANCE / DISASSEMBLY
```

将来、同一設計の個体差を導入する場合はレアリティではなく `FABRICATION VARIANCE / 製造偏差` として扱う。解体時の異常素材を導入する場合は完全ランダムではなく、派遣区域と曝露履歴を原因候補として記録する。これらは設計原則であり、MVPの実装済みルールではない。
