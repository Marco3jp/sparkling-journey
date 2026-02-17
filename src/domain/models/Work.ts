import type { Tag } from "./Tag";

export interface WorkTag {
  tag: Tag;
  note: string;
}

export interface Work {
  uuid: string;
  title: string;
  workTags: WorkTag[];
}

