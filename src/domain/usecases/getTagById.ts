import type { Tag } from "../models/Tag";
import type { TagRepository } from "../repositories/TagRepository";

export async function getTagById(
  tagRepository: TagRepository,
  id: string
): Promise<Tag | null> {
  return tagRepository.getById(id);
}

