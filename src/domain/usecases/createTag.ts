import type { Tag } from "../models/Tag";
import type { TagRepository } from "../repositories/TagRepository";

export async function createTag(
  tagRepository: TagRepository,
  input: { name: string; description: string },
): Promise<Tag> {
  const tag: Tag = {
    uuid: crypto.randomUUID(),
    name: input.name.trim(),
    description: input.description.trim(),
  };
  await tagRepository.create(tag);
  return tag;
}
