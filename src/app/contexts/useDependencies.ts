import { createContext, useContext } from "react";
import type { TagRelationRepository } from "../../domain/repositories/TagRelationRepository";
import type { TagRepository } from "../../domain/repositories/TagRepository";
import type { WorkRepository } from "../../domain/repositories/WorkRepository";
import type { StaticFileSerializer } from "../../domain/serialization/StaticFileSerializer";

export interface Dependencies {
  tagRepository: TagRepository;
  workRepository: WorkRepository;
  tagRelationRepository: TagRelationRepository;
  serializer: StaticFileSerializer;
}

export const DependenciesContext = createContext<Dependencies | null>(null);

export function useDependencies(): Dependencies {
  const ctx = useContext(DependenciesContext);
  if (!ctx) {
    throw new Error(
      "useDependencies must be used within AppDependenciesProvider",
    );
  }
  return ctx;
}
