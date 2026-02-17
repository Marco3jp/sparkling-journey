import type { Work } from "../models/Work";
import type { WorkRepository } from "../repositories/WorkRepository";

export async function createWork(
  workRepository: WorkRepository,
  input: { title: string },
): Promise<Work> {
  const work: Work = {
    uuid: crypto.randomUUID(),
    title: input.title.trim(),
    workTags: [],
  };
  await workRepository.create(work);
  return work;
}
