import type { Tag } from "../models/Tag";
import type { TagRepository } from "../repositories/TagRepository";

export async function listTags(tagRepository: TagRepository): Promise<Tag[]> {
  return tagRepository.listAll();
}

