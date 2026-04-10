import { describe, it, expect } from "vitest";
import { InMemoryTagRepository, InMemoryWorkRepository } from "../../helpers/InMemoryRepositories";
import { linkTagToWork } from "../../../src/domain/usecases/linkTagToWork";
import { unlinkTagFromWork } from "../../../src/domain/usecases/unlinkTagFromWork";
import { updateWorkTagNote } from "../../../src/domain/usecases/updateWorkTagNote";
import type { Tag } from "../../../src/domain/models/Tag";
import type { Work } from "../../../src/domain/models/Work";

const tagA: Tag = { uuid: "t1", name: "Tag A", description: "" };
const tagB: Tag = { uuid: "t2", name: "Tag B", description: "" };

const baseWork: Work = {
  uuid: "w1",
  title: "Work 1",
  workTags: []
};

const workWithTagA: Work = {
  ...baseWork,
  workTags: [{ tag: tagA, note: "old" }]
};

const workWithBothTags: Work = {
  ...baseWork,
  workTags: [
    { tag: tagA, note: "note1" },
    { tag: tagB, note: "note2" }
  ]
};

describe("linkTagToWork", () => {
  it("新しいタグを作品に紐付ける", async () => {
    const workRepo = new InMemoryWorkRepository([structuredClone(baseWork)]);
    const tagRepo = new InMemoryTagRepository([tagA]);

    const updated = await linkTagToWork("w1", "t1", "note1", workRepo, tagRepo);

    expect(updated.workTags).toHaveLength(1);
    expect(updated.workTags[0]).toEqual({ tag: tagA, note: "note1" });
  });

  it("同じタグを再度紐付けた場合は note だけ更新される（重複しない）", async () => {
    const workRepo = new InMemoryWorkRepository([structuredClone(workWithTagA)]);
    const tagRepo = new InMemoryTagRepository([tagA]);

    const updated = await linkTagToWork("w1", "t1", "new-note", workRepo, tagRepo);

    expect(updated.workTags).toHaveLength(1);
    expect(updated.workTags[0]).toEqual({ tag: tagA, note: "new-note" });
  });

  it("存在しない Work を指定した場合はエラーになる", async () => {
    const workRepo = new InMemoryWorkRepository([]);
    const tagRepo = new InMemoryTagRepository([tagA]);

    await expect(
      linkTagToWork("missing", "t1", "note", workRepo, tagRepo)
    ).rejects.toThrowError(/Work not found/);
  });

  it("存在しない Tag を指定した場合はエラーになる", async () => {
    const workRepo = new InMemoryWorkRepository([structuredClone(baseWork)]);
    const tagRepo = new InMemoryTagRepository([]);

    await expect(
      linkTagToWork("w1", "missing", "note", workRepo, tagRepo)
    ).rejects.toThrowError(/Tag not found/);
  });
});

describe("unlinkTagFromWork", () => {
  it("紐付いたタグを外せる", async () => {
    const workRepo = new InMemoryWorkRepository([structuredClone(workWithBothTags)]);

    const updated = await unlinkTagFromWork("w1", "t1", workRepo);

    expect(updated.workTags).toHaveLength(1);
    expect(updated.workTags[0].tag.uuid).toBe("t2");
  });

  it("元々付いていないタグIDを指定してもそのまま返す", async () => {
    const workRepo = new InMemoryWorkRepository([structuredClone(workWithTagA)]);

    const updated = await unlinkTagFromWork("w1", "missing", workRepo);

    expect(updated.workTags).toHaveLength(1);
  });

  it("workTags が空の Work に対して unlink してもエラーにならない", async () => {
    const workRepo = new InMemoryWorkRepository([structuredClone(baseWork)]);

    const updated = await unlinkTagFromWork("w1", "t1", workRepo);

    expect(updated.workTags).toHaveLength(0);
  });

  it("存在しない Work を指定した場合はエラーになる", async () => {
    const workRepo = new InMemoryWorkRepository([]);

    await expect(
      unlinkTagFromWork("missing-work", "t1", workRepo)
    ).rejects.toThrowError(/Work not found/);
  });
});

describe("updateWorkTagNote", () => {
  it("既存タグの note を更新できる", async () => {
    const workRepo = new InMemoryWorkRepository([structuredClone(workWithTagA)]);

    const updated = await updateWorkTagNote("w1", "t1", "updated", workRepo);

    expect(updated.workTags[0].note).toBe("updated");
  });

  it("紐付いていないタグIDを指定するとエラーになる", async () => {
    const workRepo = new InMemoryWorkRepository([structuredClone(workWithTagA)]);

    await expect(
      updateWorkTagNote("w1", "t2", "updated", workRepo)
    ).rejects.toThrowError(/is not linked/);
  });

  it("存在しない Work を指定した場合はエラーになる", async () => {
    const workRepo = new InMemoryWorkRepository([]);

    await expect(
      updateWorkTagNote("missing", "t1", "updated", workRepo)
    ).rejects.toThrowError(/Work not found/);
  });
});
