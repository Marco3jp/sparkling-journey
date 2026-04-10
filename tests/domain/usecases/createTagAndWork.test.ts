import { describe, it, expect } from "vitest";
import { createTag } from "../../../src/domain/usecases/createTag";
import { createWork } from "../../../src/domain/usecases/createWork";
import {
  InMemoryTagRepository,
  InMemoryWorkRepository,
} from "../../helpers/InMemoryRepositories";

describe("createTag", () => {
  it("name と description を trim して Tag を生成・保存する", async () => {
    const tagRepo = new InMemoryTagRepository();

    const tag = await createTag(tagRepo, {
      name: "  Fantasy  ",
      description: "  魔法の物語  ",
    });

    expect(tag.name).toBe("Fantasy");
    expect(tag.description).toBe("魔法の物語");
    expect(tag.uuid).toBeTruthy();

    const stored = await tagRepo.getById(tag.uuid);
    expect(stored).toEqual(tag);
  });

  it("uuid は呼び出しごとに異なる", async () => {
    const tagRepo = new InMemoryTagRepository();

    const tag1 = await createTag(tagRepo, { name: "A", description: "" });
    const tag2 = await createTag(tagRepo, { name: "B", description: "" });

    expect(tag1.uuid).not.toBe(tag2.uuid);
  });

  it("空文字の name でも生成できる（バリデーションはユースケース外）", async () => {
    const tagRepo = new InMemoryTagRepository();

    const tag = await createTag(tagRepo, { name: "", description: "" });

    expect(tag.name).toBe("");
    const stored = await tagRepo.getById(tag.uuid);
    expect(stored).not.toBeNull();
  });

  it("複数タグを作成するとリポジトリに全て格納される", async () => {
    const tagRepo = new InMemoryTagRepository();

    await createTag(tagRepo, { name: "Tag1", description: "" });
    await createTag(tagRepo, { name: "Tag2", description: "" });
    await createTag(tagRepo, { name: "Tag3", description: "" });

    const all = await tagRepo.listAll();
    expect(all).toHaveLength(3);
  });
});

describe("createWork", () => {
  it("title を trim して Work を生成・保存する", async () => {
    const workRepo = new InMemoryWorkRepository();

    const work = await createWork(workRepo, { title: "  異世界冒険  " });

    expect(work.title).toBe("異世界冒険");
    expect(work.uuid).toBeTruthy();
    expect(work.workTags).toEqual([]);

    const stored = await workRepo.getById(work.uuid);
    expect(stored).toEqual(work);
  });

  it("uuid は呼び出しごとに異なる", async () => {
    const workRepo = new InMemoryWorkRepository();

    const w1 = await createWork(workRepo, { title: "Work A" });
    const w2 = await createWork(workRepo, { title: "Work B" });

    expect(w1.uuid).not.toBe(w2.uuid);
  });

  it("新規作成された Work は workTags が空配列", async () => {
    const workRepo = new InMemoryWorkRepository();

    const work = await createWork(workRepo, { title: "Test Work" });

    expect(work.workTags).toEqual([]);
  });

  it("複数作品を作成するとリポジトリに全て格納される", async () => {
    const workRepo = new InMemoryWorkRepository();

    await createWork(workRepo, { title: "Work1" });
    await createWork(workRepo, { title: "Work2" });

    const all = await workRepo.listAll();
    expect(all).toHaveLength(2);
  });
});
