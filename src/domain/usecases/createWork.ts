import type { Work } from "../models/Work";
import type { WorkRepository } from "../repositories/WorkRepository";

export class DuplicateWorkTitleError extends Error {
  readonly title: string;

  constructor(title: string) {
    super(`同じタイトルの作品が既に存在します: ${title}`);
    this.name = "DuplicateWorkTitleError";
    this.title = title;
  }
}

export async function createWork(
  workRepository: WorkRepository,
  input: { title: string },
): Promise<Work> {
  const title = input.title.trim();
  const existing = await workRepository.listAll();
  if (existing.some((w) => w.title === title)) {
    throw new DuplicateWorkTitleError(title);
  }
  const work: Work = {
    uuid: crypto.randomUUID(),
    title,
    workTags: [],
  };
  await workRepository.create(work);
  return work;
}
