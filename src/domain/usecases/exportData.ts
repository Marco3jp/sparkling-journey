import type { TagRepository } from "../repositories/TagRepository";
import type { WorkRepository } from "../repositories/WorkRepository";
import type {
  ExportPayload,
  StaticFileSerializer
} from "../serialization/StaticFileSerializer";

export async function exportData(
  workRepository: WorkRepository,
  tagRepository: TagRepository,
  serializer: StaticFileSerializer
): Promise<string> {
  const [works, tags] = await Promise.all([
    workRepository.listAll(),
    tagRepository.listAll()
  ]);

  const payload: ExportPayload = {
    version: 1,
    tags,
    works,
    exportedAt: new Date().toISOString()
  };

  return serializer.serialize(payload);
}

