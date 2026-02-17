import type { Work } from "../models/Work";
import type { WorkRepository } from "../repositories/WorkRepository";

export async function updateWorkTagNote(
  workId: string,
  tagId: string,
  note: string,
  workRepository: WorkRepository
): Promise<Work> {
  const work = await workRepository.getById(workId);
  if (!work) {
    throw new Error(`Work not found: ${workId}`);
  }

  const index = work.workTags.findIndex((wt) => wt.tag.uuid === tagId);
  if (index === -1) {
    throw new Error(`Tag ${tagId} is not linked to work ${workId}`);
  }

  work.workTags[index] = { ...work.workTags[index], note };
  await workRepository.update(work);
  return work;
}

