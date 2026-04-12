import type { TagRelation } from "../models/TagRelation";
import type { TagRelationRepository } from "../repositories/TagRelationRepository";

/**
 * 既存の TagRelation の weight と note を更新する。
 * uiLevel は 1〜5 で、内部 weight = uiLevel * 20 に変換する。
 */
export async function updateTagRelation(
  tagRelationRepository: TagRelationRepository,
  id: string,
  uiLevel: number,
  note: string,
): Promise<TagRelation> {
  const existing = await tagRelationRepository.getById(id);
  if (!existing) {
    throw new Error(`TagRelation not found: ${id}`);
  }

  const updated: TagRelation = {
    ...existing,
    weight: uiLevel * 20,
    note: note.trim(),
  };
  await tagRelationRepository.update(updated);
  return updated;
}
