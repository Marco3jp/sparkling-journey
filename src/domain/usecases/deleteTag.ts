import type { TagRepository } from "../repositories/TagRepository";

export async function deleteTag(
  tagId: string,
  tagRepository: TagRepository,
): Promise<void> {
  await tagRepository.delete(tagId);
}
