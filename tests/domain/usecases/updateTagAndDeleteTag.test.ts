import { describe, it, expect } from "vitest";
import { updateTag } from "../../../src/domain/usecases/updateTag";
import { deleteTag } from "../../../src/domain/usecases/deleteTag";
import {
  InMemoryTagRepository,
  InMemoryWorkRepository,
} from "../../helpers/InMemoryRepositories";
import type { Tag } from "../../../src/domain/models/Tag";
import type { Work } from "../../../src/domain/models/Work";

const tagA: Tag = { uuid: "t1", name: "Tag A", description: "desc A" };
const tagB: Tag = { uuid: "t2", name: "Tag B", description: "desc B" };

describe("updateTag", () => {
  it("name と description を trim して更新する", async () => {
    const tagRepo = new InMemoryTagRepository([structuredClone(tagA)]);

    const updated = await updateTag(tagRepo, {
      uuid: "t1",
      name: "  Updated A  ",
      description: "  新しい説明  ",
    });

    expect(updated.name).toBe("Updated A");
    expect(updated.description).toBe("新しい説明");
    expect(updated.uuid).toBe("t1");

    const stored = await tagRepo.getById("t1");
    expect(stored?.name).toBe("Updated A");
    expect(stored?.description).toBe("新しい説明");
  });

  it("存在しない uuid を指定すると新規として追加される（InMemoryRepository の update 仕様）", async () => {
    const tagRepo = new InMemoryTagRepository([]);

    const newTag = await updateTag(tagRepo, {
      uuid: "t-new",
      name: "New Tag",
      description: "",
    });

    expect(newTag.uuid).toBe("t-new");
    const stored = await tagRepo.getById("t-new");
    expect(stored).not.toBeNull();
  });

  it("更新後も他のタグには影響しない", async () => {
    const tagRepo = new InMemoryTagRepository([
      structuredClone(tagA),
      structuredClone(tagB),
    ]);

    await updateTag(tagRepo, {
      uuid: "t1",
      name: "Modified A",
      description: "",
    });

    const storedB = await tagRepo.getById("t2");
    expect(storedB?.name).toBe("Tag B");
  });
});

describe("deleteTag", () => {
  it("タグを削除するとリポジトリから消える", async () => {
    const tagRepo = new InMemoryTagRepository([
      structuredClone(tagA),
      structuredClone(tagB),
    ]);
    const workRepo = new InMemoryWorkRepository([]);

    await deleteTag("t1", tagRepo, workRepo);

    const stored = await tagRepo.getById("t1");
    expect(stored).toBeNull();

    const all = await tagRepo.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].uuid).toBe("t2");
  });

  it("削除したタグが紐づいていた Work からも除去される", async () => {
    const work: Work = {
      uuid: "w1",
      title: "Work 1",
      workTags: [
        { tag: tagA, note: "noteA" },
        { tag: tagB, note: "noteB" },
      ],
    };
    const tagRepo = new InMemoryTagRepository([
      structuredClone(tagA),
      structuredClone(tagB),
    ]);
    const workRepo = new InMemoryWorkRepository([structuredClone(work)]);

    await deleteTag("t1", tagRepo, workRepo);

    const updatedWork = await workRepo.getById("w1");
    expect(updatedWork?.workTags).toHaveLength(1);
    expect(updatedWork?.workTags[0].tag.uuid).toBe("t2");
  });

  it("複数の Work に紐づいていても全て除去される", async () => {
    const workA: Work = {
      uuid: "w1",
      title: "Work A",
      workTags: [{ tag: tagA, note: "na" }],
    };
    const workB: Work = {
      uuid: "w2",
      title: "Work B",
      workTags: [{ tag: tagA, note: "nb" }],
    };
    const tagRepo = new InMemoryTagRepository([structuredClone(tagA)]);
    const workRepo = new InMemoryWorkRepository([
      structuredClone(workA),
      structuredClone(workB),
    ]);

    await deleteTag("t1", tagRepo, workRepo);

    const wa = await workRepo.getById("w1");
    const wb = await workRepo.getById("w2");
    expect(wa?.workTags).toHaveLength(0);
    expect(wb?.workTags).toHaveLength(0);
  });

  it("どの Work にも紐づいていないタグでも削除できる", async () => {
    const workNoTag: Work = {
      uuid: "w1",
      title: "Work 1",
      workTags: [],
    };
    const tagRepo = new InMemoryTagRepository([structuredClone(tagA)]);
    const workRepo = new InMemoryWorkRepository([structuredClone(workNoTag)]);

    await deleteTag("t1", tagRepo, workRepo);

    const stored = await tagRepo.getById("t1");
    expect(stored).toBeNull();
    const w = await workRepo.getById("w1");
    expect(w?.workTags).toHaveLength(0);
  });

  it("存在しない tagId を削除してもエラーにならない", async () => {
    const tagRepo = new InMemoryTagRepository([structuredClone(tagA)]);
    const workRepo = new InMemoryWorkRepository([]);

    await expect(
      deleteTag("non-existent", tagRepo, workRepo),
    ).resolves.toBeUndefined();

    const all = await tagRepo.listAll();
    expect(all).toHaveLength(1);
  });
});
