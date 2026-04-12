import { useMemo, type ReactNode } from "react";
import { LocalStorageGateway } from "../../infrastructure/storage/LocalStorageGateway";
import { LocalStorageTagRelationRepository } from "../../infrastructure/storage/LocalStorageTagRelationRepository";
import { LocalStorageTagRepository } from "../../infrastructure/storage/LocalStorageTagRepository";
import { LocalStorageWorkRepository } from "../../infrastructure/storage/LocalStorageWorkRepository";
import { JsonStaticFileSerializer } from "../../infrastructure/storage/JsonStaticFileSerializer";
import { DependenciesContext, type Dependencies } from "./useDependencies";

export function AppDependenciesProvider({ children }: { children: ReactNode }) {
  const deps = useMemo<Dependencies>(() => {
    const gateway = new LocalStorageGateway(window.localStorage);
    return {
      tagRepository: new LocalStorageTagRepository(gateway),
      workRepository: new LocalStorageWorkRepository(gateway),
      tagRelationRepository: new LocalStorageTagRelationRepository(gateway),
      serializer: new JsonStaticFileSerializer(),
    };
  }, []);

  return (
    <DependenciesContext.Provider value={deps}>
      {children}
    </DependenciesContext.Provider>
  );
}
