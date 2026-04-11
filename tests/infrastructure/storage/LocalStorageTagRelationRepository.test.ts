import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageTagRelationRepository } from "../../../src/infrastructure/storage/LocalStorageTagRelationRepository";
import { InMemoryStorage } from "../../helpers/InMemoryStorage";
import type { TagRelation } from "../../../src/domain/models/TagRelation";

const relAB: TagRelation = {
  uuid: "r1",
  sourceTagId: "t1",
  targetTagId: "t2",
  weight: 60,
  note: "A-B の関係",
};

const relBC: TagRelation = {
  uuid: "r2",
  sourceTagId: "t2",
  targetTagId: "t3",
  weight: 40,
  note: "B-C の関係",
};

let storage: InMemoryStorage;
let repo: LocalStorageTagRelationRepository;

beforeEach(() => {
  storage = new InMemoryStorage();
  repo = new LocalStorageTagRelationRepository(storage);
});

describe("LocalStorageTagRelationRepository#getById", () => {
  it("存在する uuid の関係を返す", async () => {
    await repo.create(relAB);

    const result = await repo.getById("r1");

    expect(result).toEqual(relAB);
  });

  it("存在しない uuid のとき null を返す", async () => {
    const result = await repo.getById("none");

    expect(result).toBeNull();
  });

  it("ストレージが空のとき null を返す", async () => {
    const result = await repo.getById("r1");

    expect(result).toBeNull();
  });
});

describe("LocalStorageTagRelationRepository#listAll", () => {
  it("全関係を返す", async () => {
    await repo.create(relAB);
    await repo.create(relBC);

    const result = await repo.listAll();

    expect(result).toHaveLength(2);
  });

  it("ストレージが空のとき空配列を返す", async () => {
    const result = await repo.listAll();

    expect(result).toEqual([]);
  });

  it("ストレージに不正な JSON が入っているとき空配列を返す", async () => {
    storage.setItem("app:tag-relations:v1", "NOT_JSON{{");

    const result = await repo.listAll();

    expect(result).toEqual([]);
  });

  it("ストレージに JSON だが配列でない値が入っているとき空配列を返す", async () => {
    storage.setItem("app:tag-relations:v1", JSON.stringify({ not: "an array" }));

    const result = await repo.listAll();

    expect(result).toEqual([]);
  });
});

describe("LocalStorageTagRelationRepository#listByTagId", () => {
  it("sourceTagId に一致する関係を返す", async () => {
    await repo.create(relAB);
    await repo.create(relBC);

    const result = await repo.listByTagId("t1");

    expect(result).toHaveLength(1);
    expect(result[0].uuid).toBe("r1");
  });

  it("targetTagId に一致する関係も返す (双方向)", async () => {
    await repo.create(relAB);

    const result = await repo.listByTagId("t2");

    expect(result).toHaveLength(1);
    expect(result[0].uuid).toBe("r1");
  });

  it("source・target 両方に絡む場合は全て返す", async () => {
    await repo.create(relAB);
    await repo.create(relBC);

    const result = await repo.listByTagId("t2");

    expect(result).toHaveLength(2);
  });

  it("関連しない tagId のとき空配列を返す", async () => {
    await repo.create(relAB);

    const result = await repo.listByTagId("t-none");

    expect(result).toEqual([]);
  });
});

describe("LocalStorageTagRelationRepository#create", () => {
  it("関係を保存できる", async () => {
    await repo.create(relAB);

    const result = await repo.getById("r1");

    expect(result).toEqual(relAB);
  });

  it("同じ uuid を再度 create しても追加されない（重複無視）", async () => {
    await repo.create(relAB);
    await repo.create({ ...relAB, weight: 100 });

    const all = await repo.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].weight).toBe(60);
  });
});

describe("LocalStorageTagRelationRepository#update", () => {
  it("既存の関係を更新できる", async () => {
    await repo.create(relAB);
    const updated: TagRelation = { ...relAB, weight: 100, note: "更新済み" };

    await repo.update(updated);

    const result = await repo.getById("r1");
    expect(result?.weight).toBe(100);
    expect(result?.note).toBe("更新済み");
  });

  it("存在しない uuid を update すると新規追加される", async () => {
    const newRel: TagRelation = {
      uuid: "r-new",
      sourceTagId: "t1",
      targetTagId: "t2",
      weight: 20,
      note: "",
    };

    await repo.update(newRel);

    const result = await repo.getById("r-new");
    expect(result).toEqual(newRel);
  });
});

describe("LocalStorageTagRelationRepository#delete", () => {
  it("指定した uuid の関係を削除できる", async () => {
    await repo.create(relAB);
    await repo.create(relBC);

    await repo.delete("r1");

    const result = await repo.getById("r1");
    expect(result).toBeNull();

    const all = await repo.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].uuid).toBe("r2");
  });

  it("存在しない uuid の削除はエラーにならない", async () => {
    await repo.create(relAB);

    await expect(repo.delete("non-existent")).resolves.toBeUndefined();

    const all = await repo.listAll();
    expect(all).toHaveLength(1);
  });
});
