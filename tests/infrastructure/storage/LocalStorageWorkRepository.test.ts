import { describe, it, expect, beforeEach } from "vitest";
import { LocalStorageWorkRepository } from "../../../src/infrastructure/storage/LocalStorageWorkRepository";
import { InMemoryStorage } from "../../helpers/InMemoryStorage";
import type { Tag } from "../../../src/domain/models/Tag";
import type { Work } from "../../../src/domain/models/Work";

const tagA: Tag = { uuid: "t1", name: "Fantasy", description: "" };
const tagB: Tag = { uuid: "t2", name: "SF", description: "" };

const workA: Work = { uuid: "w1", title: "異世界ファンタジー", workTags: [] };
const workB: Work = { uuid: "w2", title: "宇宙船の旅", workTags: [] };
const workWithTagA: Work = {
  uuid: "w3",
  title: "ただの日記",
  workTags: [{ tag: tagA, note: "長編 Fantasy" }],
};
const workWithTagAUpdated: Work = {
  uuid: "w1",
  title: "異世界ファンタジー",
  workTags: [{ tag: tagA, note: "長編" }],
};
const workWithTagBShort: Work = {
  uuid: "w4",
  title: "SFホラー",
  workTags: [{ tag: tagB, note: "短編" }],
};

let storage: InMemoryStorage;
let repo: LocalStorageWorkRepository;

beforeEach(() => {
  storage = new InMemoryStorage();
  repo = new LocalStorageWorkRepository(storage);
});

describe("LocalStorageWorkRepository#getById", () => {
  it("存在する uuid の作品を返す", async () => {
    await repo.create(workA);

    const result = await repo.getById("w1");

    expect(result).toEqual(workA);
  });

  it("存在しない uuid のとき null を返す", async () => {
    const result = await repo.getById("none");

    expect(result).toBeNull();
  });

  it("ストレージが空のとき null を返す", async () => {
    const result = await repo.getById("w1");

    expect(result).toBeNull();
  });
});

describe("LocalStorageWorkRepository#listAll", () => {
  it("全作品を返す", async () => {
    await repo.create(workA);
    await repo.create(workB);

    const result = await repo.listAll();

    expect(result).toHaveLength(2);
  });

  it("ストレージが空のとき空配列を返す", async () => {
    const result = await repo.listAll();

    expect(result).toEqual([]);
  });

  it("ストレージに不正な JSON が入っているとき空配列を返す", async () => {
    storage.setItem("app:works:v1", "INVALID{{JSON");

    const result = await repo.listAll();

    expect(result).toEqual([]);
  });

  it("ストレージに JSON だが配列でない値が入っているとき空配列を返す", async () => {
    storage.setItem("app:works:v1", JSON.stringify({ not: "an array" }));

    const result = await repo.listAll();

    expect(result).toEqual([]);
  });
});

describe("LocalStorageWorkRepository#create", () => {
  it("作品を保存できる", async () => {
    await repo.create(workA);

    const result = await repo.getById("w1");

    expect(result).toEqual(workA);
  });

  it("同じ uuid の作品を再度 create しても追加されない（重複無視）", async () => {
    await repo.create(workA);
    await repo.create({ ...workA, title: "Modified" });

    const all = await repo.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe("異世界ファンタジー");
  });
});

describe("LocalStorageWorkRepository#update", () => {
  it("既存作品を更新できる", async () => {
    await repo.create(workA);
    const updated: Work = { uuid: "w1", title: "更新後タイトル", workTags: [] };

    await repo.update(updated);

    const result = await repo.getById("w1");
    expect(result?.title).toBe("更新後タイトル");
  });

  it("存在しない uuid を update すると新規追加される", async () => {
    const newWork: Work = { uuid: "w-new", title: "New Work", workTags: [] };

    await repo.update(newWork);

    const result = await repo.getById("w-new");
    expect(result).toEqual(newWork);
  });

  it("他の作品には影響しない", async () => {
    await repo.create(workA);
    await repo.create(workB);

    await repo.update({ uuid: "w1", title: "Changed A", workTags: [] });

    const b = await repo.getById("w2");
    expect(b?.title).toBe("宇宙船の旅");
  });

  it("workTags を含む状態で更新できる", async () => {
    await repo.create(workA);

    await repo.update(workWithTagAUpdated);

    const result = await repo.getById("w1");
    expect(result?.workTags).toHaveLength(1);
    expect(result?.workTags[0].tag.uuid).toBe("t1");
    expect(result?.workTags[0].note).toBe("長編");
  });
});

describe("LocalStorageWorkRepository#delete", () => {
  it("指定した uuid の作品を削除できる", async () => {
    await repo.create(workA);
    await repo.create(workB);

    await repo.delete("w1");

    const result = await repo.getById("w1");
    expect(result).toBeNull();

    const all = await repo.listAll();
    expect(all).toHaveLength(1);
    expect(all[0].uuid).toBe("w2");
  });

  it("存在しない uuid の削除はエラーにならない", async () => {
    await repo.create(workA);

    await expect(repo.delete("non-existent")).resolves.toBeUndefined();

    const all = await repo.listAll();
    expect(all).toHaveLength(1);
  });
});

describe("LocalStorageWorkRepository#searchByText", () => {
  beforeEach(async () => {
    await repo.create(workA);
    await repo.create(workB);
    await repo.create(workWithTagA);
    await repo.create(workWithTagBShort);
  });

  it("空文字は全件返す", async () => {
    const result = await repo.searchByText("");

    expect(result).toHaveLength(4);
  });

  it("タイトルに部分一致する", async () => {
    const result = await repo.searchByText("宇宙");

    expect(result.map((w) => w.uuid)).toEqual(["w2"]);
  });

  it("workTag の tag.name に部分一致する", async () => {
    const result = await repo.searchByText("fantasy");

    expect(result.map((w) => w.uuid)).toContain("w3");
  });

  it("workTag の note に部分一致する", async () => {
    const result = await repo.searchByText("長編");

    expect(result.map((w) => w.uuid)).toContain("w3");
  });

  it("大文字小文字を無視する", async () => {
    const result = await repo.searchByText("SF");

    const uuids = result.map((w) => w.uuid);
    expect(uuids).toContain("w4");
  });

  it("マッチしない場合は空配列を返す", async () => {
    const result = await repo.searchByText("xyz-no-match");

    expect(result).toEqual([]);
  });

  it("前後スペースを trim して検索する", async () => {
    const result = await repo.searchByText("  宇宙  ");

    expect(result.map((w) => w.uuid)).toEqual(["w2"]);
  });
});
