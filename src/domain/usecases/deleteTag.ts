import type { TagRelationRepository } from "../repositories/TagRelationRepository";
import type { TagRepository } from "../repositories/TagRepository";
import type { WorkRepository } from "../repositories/WorkRepository";

export async function deleteTag(
  tagId: string,
  tagRepository: TagRepository,
  workRepository: WorkRepository,
  tagRelationRepository: TagRelationRepository,
): Promise<void> {
  const works = await workRepository.listAll();
  const linkedWorks = works.filter((w) =>
    w.workTags.some((wt) => wt.tag.uuid === tagId),
  );
  await Promise.all(
    linkedWorks.map((work) => {
      const cleaned = {
        ...work,
        workTags: work.workTags.filter((wt) => wt.tag.uuid !== tagId),
      };
      return workRepository.update(cleaned);
    }),
  );

  const linkedRelations = await tagRelationRepository.listByTagId(tagId);
  await Promise.all(linkedRelations.map((r) => tagRelationRepository.delete(r.uuid)));

  await tagRepository.delete(tagId);
}
