import type { Work } from "../../domain/models/Work";
import type { WorkRepository } from "../../domain/repositories/WorkRepository";
import type { StorageLike } from "./StorageLike";

const KEY = "app:works:v1";

export class LocalStorageWorkRepository implements WorkRepository {
  private storage: StorageLike;

  constructor(storage: StorageLike) {
    this.storage = storage;
  }

  private readAll(): Work[] {
    const raw = this.storage.getItem(KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? (parsed as Work[]) : [];
    } catch {
      return [];
    }
  }

  private writeAll(works: Work[]): void {
    this.storage.setItem(KEY, JSON.stringify(works));
  }

  async getById(id: string): Promise<Work | null> {
    const works = this.readAll();
    return works.find((w) => w.uuid === id) ?? null;
  }

  async listAll(): Promise<Work[]> {
    return [...this.readAll()];
  }

  async create(work: Work): Promise<void> {
    const works = this.readAll();
    if (works.some((w) => w.uuid === work.uuid)) return;
    works.push(work);
    this.writeAll(works);
  }

  async update(work: Work): Promise<void> {
    const works = this.readAll();
    const index = works.findIndex((w) => w.uuid === work.uuid);
    if (index === -1) {
      works.push(work);
    } else {
      works[index] = work;
    }
    this.writeAll(works);
  }

  async delete(id: string): Promise<void> {
    const works = this.readAll().filter((w) => w.uuid !== id);
    this.writeAll(works);
  }

  async searchByText(text: string): Promise<Work[]> {
    const works = this.readAll();
    const q = text.trim().toLocaleLowerCase();
    if (!q) return [...works];
    return works.filter((w) => {
      if (w.title.toLocaleLowerCase().includes(q)) return true;
      return w.workTags.some(
        (wt) =>
          wt.tag.name.toLocaleLowerCase().includes(q) ||
          wt.note.toLocaleLowerCase().includes(q),
      );
    });
  }
}
