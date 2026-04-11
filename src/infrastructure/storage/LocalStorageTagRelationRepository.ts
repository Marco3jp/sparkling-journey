import type { TagRelation } from "../../domain/models/TagRelation";
import type { TagRelationRepository } from "../../domain/repositories/TagRelationRepository";
import type { StorageLike } from "./StorageLike";

const KEY = "app:tag-relations:v1";

export class LocalStorageTagRelationRepository implements TagRelationRepository {
  private storage: StorageLike;

  constructor(storage: StorageLike) {
    this.storage = storage;
  }

  private readAll(): TagRelation[] {
    const raw = this.storage.getItem(KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as TagRelation[]) : [];
    } catch {
      return [];
    }
  }

  private writeAll(relations: TagRelation[]): void {
    this.storage.setItem(KEY, JSON.stringify(relations));
  }

  async getById(id: string): Promise<TagRelation | null> {
    return this.readAll().find((r) => r.uuid === id) ?? null;
  }

  async listAll(): Promise<TagRelation[]> {
    return [...this.readAll()];
  }

  async listByTagId(tagId: string): Promise<TagRelation[]> {
    return this.readAll().filter(
      (r) => r.sourceTagId === tagId || r.targetTagId === tagId,
    );
  }

  async create(relation: TagRelation): Promise<void> {
    const relations = this.readAll();
    if (relations.some((r) => r.uuid === relation.uuid)) return;
    relations.push(relation);
    this.writeAll(relations);
  }

  async update(relation: TagRelation): Promise<void> {
    const relations = this.readAll();
    const index = relations.findIndex((r) => r.uuid === relation.uuid);
    if (index === -1) {
      relations.push(relation);
    } else {
      relations[index] = relation;
    }
    this.writeAll(relations);
  }

  async delete(id: string): Promise<void> {
    this.writeAll(this.readAll().filter((r) => r.uuid !== id));
  }
}
