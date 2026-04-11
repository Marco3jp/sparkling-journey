import type { TagRelation } from "../models/TagRelation";

export interface TagRelationRepository {
  getById(id: string): Promise<TagRelation | null>;
  listAll(): Promise<TagRelation[]>;
  /** source または target どちらかに tagId が含まれるものを全て返す */
  listByTagId(tagId: string): Promise<TagRelation[]>;
  create(relation: TagRelation): Promise<void>;
  update(relation: TagRelation): Promise<void>;
  delete(id: string): Promise<void>;
}
