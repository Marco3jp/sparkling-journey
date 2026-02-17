import type { Work } from "../models/Work";
import type { WorkRepository } from "../repositories/WorkRepository";

export async function unlinkTagFromWork(
  workId: string,
  tagId: string,
  workRepository: WorkRepository
): Promise<Work> {
  const work = await workRepository.getById(workId);
  if (!work) {
    throw new Error(`Work not found: ${workId}`);
  }

  const beforeLength = work.workTags.length;
  work.workTags = work.workTags.filter((wt) => wt.tag.uuid !== tagId);

  if (work.workTags.length === beforeLength) {
    // もともと紐付いていない場合はそのまま返す
    return work;
  }

  await workRepository.update(work);
  return work;
}

