import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageTagRepository } from "../../../src/infrastructure/storage/LocalStorageTagRepository";
import { InMemoryStorage } from "../../helpers/InMemoryStorage";
import type { Tag } from "../../../src/domain/models/Tag";

const tagA: Tag = { uuid: "t1", name: "Fantasy", description: "魔法の物語" };
const tagB: Tag = { uuid: "t2", name: "SF", description: "宇宙の旅" };

let storage: InMemoryStorage;
let repo: LocalStorageTagRepository;

beforeEach(() => {
  storage = new InMemoryStorage();
  repo = new LocalStorageTagRepository(storage);
});

describe("LocalStorageTagRepository#getById", () => {
  it("存在する uuid のタグを返す", async () => {
    await repo.create(tagA);

    const result = await repo.getById("t1");

    expect(result).toEqual(tagA);
  });

  it("存在しない uuid のとき null を返す", async () => {
    const result = await repo.getById("none");

    expect(result).toBeNull();
  });

  it("ストレージが空のとき null を返す", async () => {
    const result = await repo.getById("t1");

    expect(result).toBeNull();
  });
});

describe("LocalStorageTagRepository#listAll", () => {
  it("全タグを返す", async () => {
    await repo.create(tagA);
    await repo.create(tagB);

    const result = await repo.listAll();

    expect(result).toHaveLength(2);
  });

  it("ストレージが空のとき空配列を返す", async () => {
    const result = await repo.listAll();

    expect(result).toEqual([]);
  });

  it("ストレージに不正な JSON が入っているとき空配列を返す", async () => {
    storage.setItem("app:tags:v1", "NOT_JSON_AT_ALL{{");

    const result = await repo.listAll();

    expect(result).toEqual([]);
  });

  it("ストレージに JSON だが配列でない値が入っているとき空配列を返す", async () => {
    storage.setItem("app:tags:v1", JSON.stringify({ not: "an array" }));

    const result = await repo.listAll();

    expect(result).toEqual([]);
  });
});

describe("LocalStorageTagRepository#create", () => {
  it("タグを保存できる", async () => {
    await repo.create(tagA);

    const result = await repo.getById("t1");

    expect(result).toEqual(tagA);
  });

  it("同じ uuid のタグを再度 create しても追加されない（重複無視）", async () => {
    await repo.create(tagA);
    await repo.create({ ...tagA, name: "Fantasy Modified" });

    const all = await repo.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("Fantasy");
  });
});

describe("LocalStorageTagRepository#update", () => {
  it("既存タグを更新できる", async () => {
    await repo.create(tagA);
    const updated: Tag = { uuid: "t1", name: "Updated", description: "new" };

    await repo.update(updated);

    const result = await repo.getById("t1");
    expect(result?.name).toBe("Updated");
    expect(result?.description).toBe("new");
  });

  it("存在しない uuid を update すると新規追加される", async () => {
    const newTag: Tag = { uuid: "t-new", name: "New Tag", description: "" };

    await repo.update(newTag);

    const result = await repo.getById("t-new");
    expect(result).toEqual(newTag);
  });

  it("他のタグには影響しない", async () => {
    await repo.create(tagA);
    await repo.create(tagB);

    await repo.update({ uuid: "t1", name: "Changed A", description: "" });

    const b = await repo.getById("t2");
    expect(b?.name).toBe("SF");
  });
});

describe("LocalStorageTagRepository#delete", () => {
  it("指定した uuid のタグを削除できる", async () => {
    await repo.create(tagA);
    await repo.create(tagB);

    await repo.delete("t1");

    const result = await repo.getById("t1");
    expect(result).toBeNull();

    const all = await repo.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].uuid).toBe("t2");
  });

  it("存在しない uuid の削除はエラーにならない", async () => {
    await repo.create(tagA);

    await expect(repo.delete("non-existent")).resolves.toBeUndefined();

    const all = await repo.listAll();
    expect(all).toHaveLength(1);
  });
});

describe("LocalStorageTagRepository#searchByText", () => {
  beforeEach(async () => {
    await repo.create(tagA);
    await repo.create(tagB);
    await repo.create({ uuid: "t3", name: "Diary", description: "日記メモ" });
  });

  it("空文字は全件返す", async () => {
    const result = await repo.searchByText("");

    expect(result).toHaveLength(3);
  });

  it("name に部分一致する", async () => {
    const result = await repo.searchByText("fan");

    expect(result.map((t) => t.uuid)).toEqual(["t1"]);
  });

  it("description に部分一致する", async () => {
    const result = await repo.searchByText("宇宙");

    expect(result.map((t) => t.uuid)).toEqual(["t2"]);
  });

  it("大文字小文字を無視する", async () => {
    const result = await repo.searchByText("FANTASY");

    expect(result.map((t) => t.uuid)).toEqual(["t1"]);
  });

  it("マッチしない場合は空配列を返す", async () => {
    const result = await repo.searchByText("xyz-no-match");

    expect(result).toEqual([]);
  });

  it("前後スペースを trim して検索する", async () => {
    const result = await repo.searchByText("  SF  ");

    expect(result.map((t) => t.uuid)).toEqual(["t2"]);
  });
});
