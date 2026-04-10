import { describe, it, expect } from "vitest";
import { getTagById } from "../../../src/domain/usecases/getTagById";
import { getWorkById } from "../../../src/domain/usecases/getWorkById";
import { listTags } from "../../../src/domain/usecases/listTags";
import { listWorks } from "../../../src/domain/usecases/listWorks";
import {
  InMemoryTagRepository,
  InMemoryWorkRepository,
} from "../../helpers/InMemoryRepositories";
import type { Tag } from "../../../src/domain/models/Tag";
import type { Work } from "../../../src/domain/models/Work";

const tagA: Tag = { uuid: "t1", name: "Tag A", description: "desc A" };
const tagB: Tag = { uuid: "t2", name: "Tag B", description: "desc B" };

const workA: Work = { uuid: "w1", title: "Work A", workTags: [] };
const workB: Work = { uuid: "w2", title: "Work B", workTags: [] };

describe("getTagById", () => {
  it("存在する uuid を指定すると Tag を返す", async () => {
    const tagRepo = new InMemoryTagRepository([tagA, tagB]);

    const result = await getTagById(tagRepo, "t1");

    expect(result).toEqual(tagA);
  });

  it("存在しない uuid を指定すると null を返す", async () => {
    const tagRepo = new InMemoryTagRepository([tagA]);

    const result = await getTagById(tagRepo, "non-existent");

    expect(result).toBeNull();
  });

  it("リポジトリが空のとき null を返す", async () => {
    const tagRepo = new InMemoryTagRepository([]);

    const result = await getTagById(tagRepo, "t1");

    expect(result).toBeNull();
  });
});

describe("getWorkById", () => {
  it("存在する uuid を指定すると Work を返す", async () => {
    const workRepo = new InMemoryWorkRepository([workA, workB]);

    const result = await getWorkById(workRepo, "w1");

    expect(result).toEqual(workA);
  });

  it("存在しない uuid を指定すると null を返す", async () => {
    const workRepo = new InMemoryWorkRepository([workA]);

    const result = await getWorkById(workRepo, "non-existent");

    expect(result).toBeNull();
  });

  it("リポジトリが空のとき null を返す", async () => {
    const workRepo = new InMemoryWorkRepository([]);

    const result = await getWorkById(workRepo, "w1");

    expect(result).toBeNull();
  });
});

describe("listTags", () => {
  it("全タグの配列を返す", async () => {
    const tagRepo = new InMemoryTagRepository([tagA, tagB]);

    const result = await listTags(tagRepo);

    expect(result).toHaveLength(2);
    expect(result.map((t) => t.uuid)).toContain("t1");
    expect(result.map((t) => t.uuid)).toContain("t2");
  });

  it("リポジトリが空のとき空配列を返す", async () => {
    const tagRepo = new InMemoryTagRepository([]);

    const result = await listTags(tagRepo);

    expect(result).toEqual([]);
  });
});

describe("listWorks", () => {
  it("全作品の配列を返す", async () => {
    const workRepo = new InMemoryWorkRepository([workA, workB]);

    const result = await listWorks(workRepo);

    expect(result).toHaveLength(2);
    expect(result.map((w) => w.uuid)).toContain("w1");
    expect(result.map((w) => w.uuid)).toContain("w2");
  });

  it("リポジトリが空のとき空配列を返す", async () => {
    const workRepo = new InMemoryWorkRepository([]);

    const result = await listWorks(workRepo);

    expect(result).toEqual([]);
  });
});
