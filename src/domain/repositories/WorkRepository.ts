import type { Work } from "../models/Work";

export interface WorkRepository {
  getById(id: string): Promise<Work | null>;
  listAll(): Promise<Work[]>;
  create(work: Work): Promise<void>;
  update(work: Work): Promise<void>;
  delete(id: string): Promise<void>;
  searchByText(text: string): Promise<Work[]>;
}

