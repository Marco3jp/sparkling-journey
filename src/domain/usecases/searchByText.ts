import type { Tag } from "../models/Tag";
import type { Work } from "../models/Work";
import type { TagRepository } from "../repositories/TagRepository";
import type { WorkRepository } from "../repositories/WorkRepository";

export interface SearchResult {
  works: Work[];
  tags: Tag[];
}

export async function searchByText(
  text: string,
  workRepository: WorkRepository,
  tagRepository: TagRepository
): Promise<SearchResult> {
  const query = text.trim();
  if (!query) {
    const [works, tags] = await Promise.all([
      workRepository.listAll(),
      tagRepository.listAll()
    ]);
    return { works, tags };
  }

  const normalized = normalize(query);

  const [allWorks, allTags] = await Promise.all([
    workRepository.listAll(),
    tagRepository.listAll()
  ]);

  const works = allWorks.filter((work) => {
    if (includesNormalized(work.title, normalized)) return true;
    return work.workTags.some((wt) => {
      return (
        includesNormalized(wt.tag.name, normalized) ||
        includesNormalized(wt.note, normalized)
      );
    });
  });

  const tags = allTags.filter((tag) => {
    return (
      includesNormalized(tag.name, normalized) ||
      includesNormalized(tag.description, normalized)
    );
  });

  return { works, tags };
}

function normalize(value: string): string {
  return value.toLocaleLowerCase();
}

function includesNormalized(target: string, query: string): boolean {
  return normalize(target).includes(query);
}

