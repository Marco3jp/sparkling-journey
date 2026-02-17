import type { Tag } from "../models/Tag";
import type { Work } from "../models/Work";
import type { StaticFileSerializer } from "../serialization/StaticFileSerializer";

export interface ImportPreviewResult {
  willOverrideTags: Tag[];
  willOverrideWorks: Work[];
  willCreateTags: Tag[];
  willCreateWorks: Work[];
}

export function previewImport(
  json: string,
  currentTags: Tag[],
  currentWorks: Work[],
  serializer: StaticFileSerializer
): ImportPreviewResult {
  const payload = serializer.deserialize(json);

  const currentTagMap = new Map(currentTags.map((t) => [t.uuid, t]));
  const currentWorkMap = new Map(currentWorks.map((w) => [w.uuid, w]));

  const willOverrideTags: Tag[] = [];
  const willCreateTags: Tag[] = [];

  for (const importedTag of payload.tags) {
    if (currentTagMap.has(importedTag.uuid)) {
      willOverrideTags.push(importedTag);
    } else {
      willCreateTags.push(importedTag);
    }
  }

  const willOverrideWorks: Work[] = [];
  const willCreateWorks: Work[] = [];

  for (const importedWork of payload.works) {
    if (currentWorkMap.has(importedWork.uuid)) {
      willOverrideWorks.push(importedWork);
    } else {
      willCreateWorks.push(importedWork);
    }
  }

  return {
    willOverrideTags,
    willOverrideWorks,
    willCreateTags,
    willCreateWorks
  };
}

