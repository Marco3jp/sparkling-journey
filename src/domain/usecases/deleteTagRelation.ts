import type { TagRelationRepository } from "../repositories/TagRelationRepository";

export async function deleteTagRelation(
  tagRelationRepository: TagRelationRepository,
  id: string,
): Promise<void> {
  await tagRelationRepository.delete(id);
}
