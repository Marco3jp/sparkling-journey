import type { Tag } from "../models/Tag";
import type { TagRelation } from "../models/TagRelation";
import type { Work } from "../models/Work";
import type { TagRelationRepository } from "../repositories/TagRelationRepository";
import type { TagRepository } from "../repositories/TagRepository";
import type { WorkRepository } from "../repositories/WorkRepository";
import type { StaticFileSerializer } from "../serialization/StaticFileSerializer";

export async function importData(
  json: string,
  workRepository: WorkRepository,
  tagRepository: TagRepository,
  tagRelationRepository: TagRelationRepository,
  serializer: StaticFileSerializer
): Promise<void> {
  const payload = serializer.deserialize(json);

  const [currentTags, currentWorks, currentRelations] = await Promise.all([
    tagRepository.listAll(),
    workRepository.listAll(),
    tagRelationRepository.listAll(),
  ]);

  await mergeTags(payload.tags, currentTags, tagRepository);
  await mergeWorks(payload.works, currentWorks, workRepository);
  await mergeTagRelations(
    payload.tagRelations ?? [],
    currentRelations,
    tagRelationRepository,
  );
}

async function mergeTags(
  importedTags: Tag[],
  currentTags: Tag[],
  tagRepository: TagRepository
): Promise<void> {
  const currentMap = new Map(currentTags.map((t) => [t.uuid, t]));

  for (const imported of importedTags) {
    if (currentMap.has(imported.uuid)) {
      await tagRepository.update(imported);
    } else {
      await tagRepository.create(imported);
    }
  }
}

async function mergeWorks(
  importedWorks: Work[],
  currentWorks: Work[],
  workRepository: WorkRepository
): Promise<void> {
  const currentMap = new Map(currentWorks.map((w) => [w.uuid, w]));

  for (const imported of importedWorks) {
    if (currentMap.has(imported.uuid)) {
      await workRepository.update(imported);
    } else {
      await workRepository.create(imported);
    }
  }
}

async function mergeTagRelations(
  importedRelations: TagRelation[],
  currentRelations: TagRelation[],
  tagRelationRepository: TagRelationRepository,
): Promise<void> {
  const currentMap = new Map(currentRelations.map((r) => [r.uuid, r]));

  for (const imported of importedRelations) {
    if (currentMap.has(imported.uuid)) {
      await tagRelationRepository.update(imported);
    } else {
      await tagRelationRepository.create(imported);
    }
  }
}

