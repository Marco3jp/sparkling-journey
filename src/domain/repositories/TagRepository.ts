import type { Tag } from "../models/Tag";

export interface TagRepository {
  getById(id: string): Promise<Tag | null>;
  listAll(): Promise<Tag[]>;
  create(tag: Tag): Promise<void>;
  update(tag: Tag): Promise<void>;
  delete(id: string): Promise<void>;
  searchByText(text: string): Promise<Tag[]>;
}

