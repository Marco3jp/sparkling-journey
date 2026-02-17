import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { TagRepository } from "../../domain/repositories/TagRepository";
import type { WorkRepository } from "../../domain/repositories/WorkRepository";
import type { StaticFileSerializer } from "../../domain/serialization/StaticFileSerializer";
import { LocalStorageGateway } from "../../infrastructure/storage/LocalStorageGateway";
import { LocalStorageTagRepository } from "../../infrastructure/storage/LocalStorageTagRepository";
import { LocalStorageWorkRepository } from "../../infrastructure/storage/LocalStorageWorkRepository";
import { JsonStaticFileSerializer } from "../../infrastructure/storage/JsonStaticFileSerializer";

export interface Dependencies {
  tagRepository: TagRepository;
  workRepository: WorkRepository;
  serializer: StaticFileSerializer;
}

const DependenciesContext = createContext<Dependencies | null>(null);

export function AppDependenciesProvider({ children }: { children: ReactNode }) {
  const deps = useMemo<Dependencies>(() => {
    const gateway = new LocalStorageGateway(window.localStorage);
    return {
      tagRepository: new LocalStorageTagRepository(gateway),
      workRepository: new LocalStorageWorkRepository(gateway),
      serializer: new JsonStaticFileSerializer(),
    };
  }, []);

  return (
    <DependenciesContext.Provider value={deps}>
      {children}
    </DependenciesContext.Provider>
  );
}

export function useDependencies(): Dependencies {
  const ctx = useContext(DependenciesContext);
  if (!ctx) {
    throw new Error(
      "useDependencies must be used within AppDependenciesProvider",
    );
  }
  return ctx;
}
