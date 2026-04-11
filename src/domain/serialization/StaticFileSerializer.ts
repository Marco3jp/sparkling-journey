import type { Tag } from "../models/Tag";
import type { TagRelation } from "../models/TagRelation";
import type { Work } from "../models/Work";

export interface ExportPayload {
  version: number;
  tags: Tag[];
  works: Work[];
  /** 省略可能: 旧フォーマットのインポート時は空配列として扱う */
  tagRelations?: TagRelation[];
  exportedAt: string;
}

export interface StaticFileSerializer {
  serialize(payload: ExportPayload): string;
  deserialize(json: string): ExportPayload;
}

