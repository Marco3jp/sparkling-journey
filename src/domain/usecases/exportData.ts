import type { TagRelationRepository } from "../repositories/TagRelationRepository";
import type { TagRepository } from "../repositories/TagRepository";
import type { WorkRepository } from "../repositories/WorkRepository";
import type {
  ExportPayload,
  StaticFileSerializer
} from "../serialization/StaticFileSerializer";

export async function exportData(
  workRepository: WorkRepository,
  tagRepository: TagRepository,
  tagRelationRepository: TagRelationRepository,
  serializer: StaticFileSerializer
): Promise<string> {
  const [works, tags, tagRelations] = await Promise.all([
    workRepository.listAll(),
    tagRepository.listAll(),
    tagRelationRepository.listAll(),
  ]);

  const payload: ExportPayload = {
    version: 1,
    tags,
    works,
    tagRelations,
    exportedAt: new Date().toISOString()
  };

  return serializer.serialize(payload);
}

