import type { Tag } from "../../src/domain/models/Tag";
import type { Work } from "../../src/domain/models/Work";
import type { TagRepository } from "../../src/domain/repositories/TagRepository";
import type { WorkRepository } from "../../src/domain/repositories/WorkRepository";

export class InMemoryTagRepository implements TagRepository {
  private tags: Tag[];

  constructor(tags: Tag[] = []) {
    this.tags = tags;
  }

  async getById(id: string): Promise<Tag | null> {
    return this.tags.find((t) => t.uuid === id) ?? null;
  }

  async listAll(): Promise<Tag[]> {
    return [...this.tags];
  }

  async create(tag: Tag): Promise<void> {
    this.tags.push(tag);
  }

  async update(tag: Tag): Promise<void> {
    const index = this.tags.findIndex((t) => t.uuid === tag.uuid);
    if (index === -1) {
      this.tags.push(tag);
    } else {
      this.tags[index] = tag;
    }
  }

  async delete(id: string): Promise<void> {
    this.tags = this.tags.filter((t) => t.uuid !== id);
  }

  async searchByText(text: string): Promise<Tag[]> {
    const q = text.toLocaleLowerCase();
    return this.tags.filter(
      (t) =>
        t.name.toLocaleLowerCase().includes(q) ||
        t.description.toLocaleLowerCase().includes(q)
    );
  }
}

export class InMemoryWorkRepository implements WorkRepository {
  private works: Work[];

  constructor(works: Work[] = []) {
    this.works = works;
  }

  async getById(id: string): Promise<Work | null> {
    return this.works.find((w) => w.uuid === id) ?? null;
  }

  async listAll(): Promise<Work[]> {
    return [...this.works];
  }

  async create(work: Work): Promise<void> {
    this.works.push(work);
  }

  async update(work: Work): Promise<void> {
    const index = this.works.findIndex((w) => w.uuid === work.uuid);
    if (index === -1) {
      this.works.push(work);
    } else {
      this.works[index] = work;
    }
  }

  async delete(id: string): Promise<void> {
    this.works = this.works.filter((w) => w.uuid !== id);
  }

  async searchByText(text: string): Promise<Work[]> {
    const q = text.toLocaleLowerCase();
    return this.works.filter((w) => w.title.toLocaleLowerCase().includes(q));
  }
}

