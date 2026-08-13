# GOLEM BUILDER — MVP Status & Playtest Policy

```text
STATUS                CANONICAL
PROTOTYPE             PASS
MVP                   PASS
CURRENT PHASE         PLAYABLE ALPHA / HUMAN PLAYTEST
RELEASE HARDENING     NOT STARTED
RELEASE FREEZE        NOT STARTED
```

## Purpose

この文書は、GOLEM BUILDERが現在どの開発段階にあり、テスト結果やプレイ観測をどのように開発判断へ接続するかを定める。

世界設定と表示語彙は [`WORLD_AND_TERMINOLOGY.md`](WORLD_AND_TERMINOLOGY.md) が扱う。本書は世界観語彙を定義せず、開発段階と判断方針だけを扱う。

## MVP status

`v2.0.0` では次の中核ループがプレイ可能な形で成立している。

```text
設計
→ 派遣
→ 損傷
→ 修復 / 解体
→ 素材回収
→ 次の機体を設計
```

再現可能なテストと実験ハーネスも存在する。したがって、MVPは完成済みと判定する。Release Readyではないことを理由にMVP判定を取り消したり、MVPを無期限に作り直したりしない。

## Test findings and development decisions

自動テストのFAILや監査上の到達可能性は、調査対象を示す証拠であり、それ自体を開発ブロッカーとはしない。

```text
TEST FINDING
→ COMMON PLAYER PATH?
→ MEANINGFUL PLAYER HARM?
→ FIX BENEFIT > RULE COMPLEXITY?
```

3条件を満たす場合に修正候補とする。満たさない場合は、理由を記録したうえで `KNOWN / ACCEPTED` として扱える。

> **A test finding must not create a new mechanic by itself. New mechanics require observed player-facing need.**
>
> **テスト結果のみを根拠として新システムを追加しない。新システムの追加には、実プレイ上の必要性が観測されていることを要求する。**

たとえば `reachable softlock found` だけを根拠に、Safe Supply、Recovery、Emergency Repairなどを追加しない。初見プレイヤーが通常の経路で資材枯渇と復帰不能を繰り返し経験し、体験を中断していることが観測された場合に再検討する。

## Human playtest priorities

現在の最優先事項は、設計から結果理解、再設計へ続くループを人間のプレイで観察することである。

1. ゴーレムを組むとき、意味のある迷いが生じるか。
2. プレイヤーがパーツを選んだ理由を説明できるか。
3. 派遣結果から次の改善案を推測できるか。
4. 回収資材が次の製造への欲求につながるか。
5. 1プレイを終えたあと、もう一度遊びたいと思うか。

## Observation scale

人間プレイの結果は単純なPASS / FAILへ押し込まず、次の尺度を基本とする。

| Result | Meaning |
|---|---|
| `OBSERVED` | 対象の行動・理解・反応が明確に観測された |
| `NOT OBSERVED` | 観測機会はあったが確認できなかった |
| `AMBIGUOUS` | 複数の解釈があり追加観測が必要 |

必要に応じて `STRONGLY OBSERVED` や、`OBSERVED / naming friction` のような短い補足を付けられる。観測記録には、可能な限りプレイヤーの行動、発話、選択理由を残す。

## Release gates

既存のG1–G7はMVP完成条件ではない。

```text
G1–G6  RELEASE QUALITY GATES
G7     RELEASE FREEZE
```

これらはHardeningおよびRelease Candidate段階で使用する。現在すべてを閉じることを開発目標にはしない。形式的な `reachable softlock = 0` より、実プレイに基づく `no common-path softlock` のような製品基準を優先できる。

Release Gateはゲームルールを支配する目的ではなく、良いゲーム体験を壊さず出荷するための検査項目として運用する。

## Current development directive

現在の仕事は完成条件や監査器を増やすことではない。人間が実際に遊び、設計、結果理解、再設計のループがどこまで自然に続くかを観察することである。
