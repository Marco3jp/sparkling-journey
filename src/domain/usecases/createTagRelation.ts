import type { TagRelation } from "../models/TagRelation";
import type { TagRelationRepository } from "../repositories/TagRelationRepository";

/**
 * 2つのタグ間に関係を作成する。
 * uiLevel は 1〜5 で、内部 weight = uiLevel * 20 に変換する。
 * 同じペア (source/target は順不同) が既に存在する場合は weight と note を更新する。
 */
export async function createTagRelation(
  tagRelationRepository: TagRelationRepository,
  sourceTagId: string,
  targetTagId: string,
  uiLevel: number,
  note: string,
): Promise<TagRelation> {
  const weight = uiLevel * 20;

  const existing = await findExistingRelation(
    tagRelationRepository,
    sourceTagId,
    targetTagId,
  );

  if (existing) {
    const updated: TagRelation = {
      ...existing,
      weight,
      note: note.trim(),
    };
    await tagRelationRepository.update(updated);
    return updated;
  }

  const relation: TagRelation = {
    uuid: crypto.randomUUID(),
    sourceTagId,
    targetTagId,
    weight,
    note: note.trim(),
  };
  await tagRelationRepository.create(relation);
  return relation;
}

async function findExistingRelation(
  repo: TagRelationRepository,
  sourceTagId: string,
  targetTagId: string,
): Promise<TagRelation | null> {
  const all = await repo.listAll();
  return (
    all.find(
      (r) =>
        (r.sourceTagId === sourceTagId && r.targetTagId === targetTagId) ||
        (r.sourceTagId === targetTagId && r.targetTagId === sourceTagId),
    ) ?? null
  );
}
