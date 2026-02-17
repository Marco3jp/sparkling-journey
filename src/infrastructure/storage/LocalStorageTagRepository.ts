import type { Tag } from "../../domain/models/Tag";
import type { TagRepository } from "../../domain/repositories/TagRepository";
import type { StorageLike } from "./StorageLike";

const KEY = "app:tags:v1";

export class LocalStorageTagRepository implements TagRepository {
  private storage: StorageLike;

  constructor(storage: StorageLike) {
    this.storage = storage;
  }

  private readAll(): Tag[] {
    const raw = this.storage.getItem(KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as Tag[]) : [];
    } catch {
      return [];
    }
  }

  private writeAll(tags: Tag[]): void {
    this.storage.setItem(KEY, JSON.stringify(tags));
  }

  async getById(id: string): Promise<Tag | null> {
    const tags = this.readAll();
    return tags.find((t) => t.uuid === id) ?? null;
  }

  async listAll(): Promise<Tag[]> {
    return [...this.readAll()];
  }

  async create(tag: Tag): Promise<void> {
    const tags = this.readAll();
    if (tags.some((t) => t.uuid === tag.uuid)) return;
    tags.push(tag);
    this.writeAll(tags);
  }

  async update(tag: Tag): Promise<void> {
    const tags = this.readAll();
    const index = tags.findIndex((t) => t.uuid === tag.uuid);
    if (index === -1) {
      tags.push(tag);
    } else {
      tags[index] = tag;
    }
    this.writeAll(tags);
  }

  async delete(id: string): Promise<void> {
    const tags = this.readAll().filter((t) => t.uuid !== id);
    this.writeAll(tags);
  }

  async searchByText(text: string): Promise<Tag[]> {
    const tags = this.readAll();
    const q = text.trim().toLocaleLowerCase();
    if (!q) return [...tags];
    return tags.filter(
      (t) =>
        t.name.toLocaleLowerCase().includes(q) ||
        t.description.toLocaleLowerCase().includes(q),
    );
  }
}
