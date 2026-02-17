import type { Tag } from "../models/Tag";
import type { Work } from "../models/Work";

export interface ExportPayload {
  version: number;
  tags: Tag[];
  works: Work[];
  exportedAt: string;
}

export interface StaticFileSerializer {
  serialize(payload: ExportPayload): string;
  deserialize(json: string): ExportPayload;
}

