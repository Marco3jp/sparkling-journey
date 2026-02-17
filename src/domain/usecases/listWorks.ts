import type { Work } from "../models/Work";
import type { WorkRepository } from "../repositories/WorkRepository";

export async function listWorks(workRepository: WorkRepository): Promise<Work[]> {
  return workRepository.listAll();
}

