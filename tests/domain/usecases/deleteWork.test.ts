import { describe, it, expect } from "vitest";
import { deleteWork } from "../../../src/domain/usecases/deleteWork";
import {
  InMemoryTagRepository,
  InMemoryWorkRepository,
} from "../../helpers/InMemoryRepositories";
import type { Tag } from "../../../src/domain/models/Tag";
import type { Work } from "../../../src/domain/models/Work";

const tagA: Tag = { uuid: "t1", name: "Tag A", description: "desc A" };
const tagB: Tag = { uuid: "t2", name: "Tag B", description: "desc B" };

const workWithTags: Work = {
  uuid: "w1",
  title: "Work 1",
  workTags: [
    { tag: tagA, note: "noteA" },
    { tag: tagB, note: "noteB" },
  ],
};

const workWithoutTags: Work = {
  uuid: "w2",
  title: "Work 2",
  workTags: [],
};

const workSharesTagA: Work = {
  uuid: "w3",
  title: "Work 3",
  workTags: [{ tag: tagA, note: "shared" }],
};

describe("deleteWork", () => {
  it("作品を削除するとリポジトリから消える", async () => {
    const workRepo = new InMemoryWorkRepository([
      structuredClone(workWithTags),
      structuredClone(workWithoutTags),
    ]);

    await deleteWork("w1", workRepo);

    const stored = await workRepo.getById("w1");
    expect(stored).toBeNull();

    const all = await workRepo.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].uuid).toBe("w2");
  });

  it("作品を削除すると内部の workTags 情報も一緒に消える", async () => {
    const workRepo = new InMemoryWorkRepository([structuredClone(workWithTags)]);

    await deleteWork("w1", workRepo);

    const stored = await workRepo.getById("w1");
    expect(stored).toBeNull();
    const all = await workRepo.listAll();
    expect(all).toHaveLength(0);
  });

  it("作品を削除しても Tag 本体には影響しない", async () => {
    const tagRepo = new InMemoryTagRepository([
      structuredClone(tagA),
      structuredClone(tagB),
    ]);
    const workRepo = new InMemoryWorkRepository([structuredClone(workWithTags)]);

    await deleteWork("w1", workRepo);

    const remainingTags = await tagRepo.listAll();
    expect(remainingTags).toHaveLength(2);
    expect(remainingTags.map((t) => t.uuid).sort()).toEqual(["t1", "t2"]);
  });

  it("同じタグを共有している他の作品には影響しない", async () => {
    const workRepo = new InMemoryWorkRepository([
      structuredClone(workWithTags),
      structuredClone(workSharesTagA),
    ]);

    await deleteWork("w1", workRepo);

    const survivor = await workRepo.getById("w3");
    expect(survivor).not.toBeNull();
    expect(survivor?.workTags).toHaveLength(1);
    expect(survivor?.workTags[0].tag.uuid).toBe("t1");
  });

  it("存在しない workId を削除してもエラーにならない", async () => {
    const workRepo = new InMemoryWorkRepository([structuredClone(workWithTags)]);

    await expect(deleteWork("non-existent", workRepo)).resolves.toBeUndefined();

    const all = await workRepo.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].uuid).toBe("w1");
  });
});
