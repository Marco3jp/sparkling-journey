import type { WorkRepository } from "../repositories/WorkRepository";

export async function deleteWork(
  workId: string,
  workRepository: WorkRepository,
): Promise<void> {
  await workRepository.delete(workId);
}
