import type { Tag } from "../models/Tag";
import type { TagRelation } from "../models/TagRelation";
import type { TagRelationRepository } from "../repositories/TagRelationRepository";
import type { TagRepository } from "../repositories/TagRepository";

export interface ResolvedTagRelation {
  relation: TagRelation;
  relatedTag: Tag;
}

/**
 * 指定タグに関連する全 TagRelation を返す。
 * relatedTag は相手方の Tag を解決済みで含む。
 * タグが削除済みで解決できない場合はその関係を除外する。
 */
export async function getRelationsForTag(
  tagRelationRepository: TagRelationRepository,
  tagRepository: TagRepository,
  tagId: string,
): Promise<ResolvedTagRelation[]> {
  const relations = await tagRelationRepository.listByTagId(tagId);

  const resolved: ResolvedTagRelation[] = [];
  for (const relation of relations) {
    const relatedTagId =
      relation.sourceTagId === tagId
        ? relation.targetTagId
        : relation.sourceTagId;
    const relatedTag = await tagRepository.getById(relatedTagId);
    if (relatedTag) {
      resolved.push({ relation, relatedTag });
    }
  }
  return resolved;
}
