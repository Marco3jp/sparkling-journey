import type { Work } from "../models/Work";
import type { WorkRepository } from "../repositories/WorkRepository";

export async function getWorkById(
  workRepository: WorkRepository,
  id: string
): Promise<Work | null> {
  return workRepository.getById(id);
}

