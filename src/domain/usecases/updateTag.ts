import type { Tag } from "../models/Tag";
import type { TagRepository } from "../repositories/TagRepository";

export async function updateTag(
  tagRepository: TagRepository,
  input: { uuid: string; name: string; description: string },
): Promise<Tag> {
  const tag: Tag = {
    uuid: input.uuid,
    name: input.name.trim(),
    description: input.description.trim(),
  };
  await tagRepository.update(tag);
  return tag;
}
