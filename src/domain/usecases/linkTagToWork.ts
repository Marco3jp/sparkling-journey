import type { Work } from "../models/Work";
import type { TagRepository } from "../repositories/TagRepository";
import type { WorkRepository } from "../repositories/WorkRepository";

export async function linkTagToWork(
  workId: string,
  tagId: string,
  note: string,
  workRepository: WorkRepository,
  tagRepository: TagRepository
): Promise<Work> {
  const [work, tag] = await Promise.all([
    workRepository.getById(workId),
    tagRepository.getById(tagId)
  ]);

  if (!work) {
    throw new Error(`Work not found: ${workId}`);
  }
  if (!tag) {
    throw new Error(`Tag not found: ${tagId}`);
  }

  const existingIndex = work.workTags.findIndex(
    (wt) => wt.tag.uuid === tag.uuid
  );

  if (existingIndex >= 0) {
    // すでに紐付いている場合は note だけ更新する
    work.workTags[existingIndex] = { tag, note };
  } else {
    work.workTags.push({ tag, note });
  }

  await workRepository.update(work);
  return work;
}

