/**
 * 2つのタグ間の関係を表す無向グラフのエッジ。
 * weight は内部的に 20〜100 の整数 (UI 表示は 1〜5: weight = uiLevel * 20)。
 *
 * 有向グラフ (親子関係 = 恋愛 > ラブコメ など) は未実装。
 * 将来 type: "hierarchy" | "similarity" のようなフィールドを追加することで対応可能。
 */
export interface TagRelation {
  uuid: string;
  sourceTagId: string;
  targetTagId: string;
  /** 関連度: 20〜100 の整数 (1〜5 の UI 値 × 20) */
  weight: number;
  note: string;
}
