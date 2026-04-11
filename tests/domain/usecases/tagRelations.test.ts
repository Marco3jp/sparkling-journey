import { describe, it, expect } from "vitest";
import { createTagRelation } from "../../../src/domain/usecases/createTagRelation";
import { updateTagRelation } from "../../../src/domain/usecases/updateTagRelation";
import { deleteTagRelation } from "../../../src/domain/usecases/deleteTagRelation";
import { getRelationsForTag } from "../../../src/domain/usecases/getRelationsForTag";
import {
  InMemoryTagRelationRepository,
  InMemoryTagRepository,
} from "../../helpers/InMemoryRepositories";
import type { Tag } from "../../../src/domain/models/Tag";
import type { TagRelation } from "../../../src/domain/models/TagRelation";

const tagA: Tag = { uuid: "t1", name: "Tag A", description: "" };
const tagB: Tag = { uuid: "t2", name: "Tag B", description: "" };
const tagC: Tag = { uuid: "t3", name: "Tag C", description: "" };

const existingRelation: TagRelation = {
  uuid: "r1",
  sourceTagId: "t1",
  targetTagId: "t2",
  weight: 60,
  note: "既存の関係",
};

describe("createTagRelation", () => {
  it("新しい関係を作成し weight = uiLevel * 20 で保存される", async () => {
    const repo = new InMemoryTagRelationRepository();

    const result = await createTagRelation(repo, "t1", "t2", 3, "メモ");

    expect(result.sourceTagId).toBe("t1");
    expect(result.targetTagId).toBe("t2");
    expect(result.weight).toBe(60);
    expect(result.note).toBe("メモ");
    expect(result.uuid).toBeTruthy();

    const all = await repo.listAll();
    expect(all).toHaveLength(1);
  });

  it("note の前後空白を trim する", async () => {
    const repo = new InMemoryTagRelationRepository();

    const result = await createTagRelation(repo, "t1", "t2", 1, "  スペース  ");

    expect(result.note).toBe("スペース");
  });

  it("同じペアが既存の場合は update して同一 uuid のまま返す (source→target)", async () => {
    const repo = new InMemoryTagRelationRepository([
      structuredClone(existingRelation),
    ]);

    const result = await createTagRelation(repo, "t1", "t2", 5, "更新");

    expect(result.uuid).toBe("r1");
    expect(result.weight).toBe(100);
    expect(result.note).toBe("更新");

    const all = await repo.listAll();
    expect(all).toHaveLength(1);
  });

  it("同じペアが既存の場合は update して同一 uuid のまま返す (target→source の逆順)", async () => {
    const repo = new InMemoryTagRelationRepository([
      structuredClone(existingRelation),
    ]);

    const result = await createTagRelation(repo, "t2", "t1", 2, "逆順");

    expect(result.uuid).toBe("r1");
    expect(result.weight).toBe(40);

    const all = await repo.listAll();
    expect(all).toHaveLength(1);
  });

  it("uiLevel 1 で weight = 20", async () => {
    const repo = new InMemoryTagRelationRepository();
    const result = await createTagRelation(repo, "t1", "t2", 1, "");
    expect(result.weight).toBe(20);
  });

  it("uiLevel 5 で weight = 100", async () => {
    const repo = new InMemoryTagRelationRepository();
    const result = await createTagRelation(repo, "t1", "t2", 5, "");
    expect(result.weight).toBe(100);
  });
});

describe("updateTagRelation", () => {
  it("weight と note を更新する", async () => {
    const repo = new InMemoryTagRelationRepository([
      structuredClone(existingRelation),
    ]);

    const result = await updateTagRelation(repo, "r1", 4, "新しいメモ");

    expect(result.uuid).toBe("r1");
    expect(result.weight).toBe(80);
    expect(result.note).toBe("新しいメモ");
  });

  it("存在しない id を渡すと例外をスローする", async () => {
    const repo = new InMemoryTagRelationRepository();

    await expect(updateTagRelation(repo, "non-existent", 3, "")).rejects.toThrow();
  });

  it("note の前後空白を trim する", async () => {
    const repo = new InMemoryTagRelationRepository([
      structuredClone(existingRelation),
    ]);

    const result = await updateTagRelation(repo, "r1", 1, "  前後空白  ");

    expect(result.note).toBe("前後空白");
  });
});

describe("deleteTagRelation", () => {
  it("指定した uuid の関係を削除する", async () => {
    const repo = new InMemoryTagRelationRepository([
      structuredClone(existingRelation),
    ]);

    await deleteTagRelation(repo, "r1");

    const all = await repo.listAll();
    expect(all).toHaveLength(0);
  });

  it("存在しない uuid を削除してもエラーにならない", async () => {
    const repo = new InMemoryTagRelationRepository();

    await expect(deleteTagRelation(repo, "non-existent")).resolves.toBeUndefined();
  });
});

describe("getRelationsForTag", () => {
  it("sourceTagId が一致する関係を返し relatedTag を解決する", async () => {
    const tagRepo = new InMemoryTagRepository([
      structuredClone(tagA),
      structuredClone(tagB),
    ]);
    const relationRepo = new InMemoryTagRelationRepository([
      structuredClone(existingRelation),
    ]);

    const result = await getRelationsForTag(relationRepo, tagRepo, "t1");

    expect(result).toHaveLength(1);
    expect(result[0].relatedTag.uuid).toBe("t2");
    expect(result[0].relation.uuid).toBe("r1");
  });

  it("targetTagId が一致する場合も双方向で返す", async () => {
    const tagRepo = new InMemoryTagRepository([
      structuredClone(tagA),
      structuredClone(tagB),
    ]);
    const relationRepo = new InMemoryTagRelationRepository([
      structuredClone(existingRelation),
    ]);

    const result = await getRelationsForTag(relationRepo, tagRepo, "t2");

    expect(result).toHaveLength(1);
    expect(result[0].relatedTag.uuid).toBe("t1");
  });

  it("関係がない場合は空配列を返す", async () => {
    const tagRepo = new InMemoryTagRepository([structuredClone(tagC)]);
    const relationRepo = new InMemoryTagRelationRepository([
      structuredClone(existingRelation),
    ]);

    const result = await getRelationsForTag(relationRepo, tagRepo, "t3");

    expect(result).toHaveLength(0);
  });

  it("関連タグが削除済みで解決できない場合はその関係を除外する", async () => {
    const tagRepo = new InMemoryTagRepository([structuredClone(tagA)]);
    const relationRepo = new InMemoryTagRelationRepository([
      structuredClone(existingRelation),
    ]);

    const result = await getRelationsForTag(relationRepo, tagRepo, "t1");

    expect(result).toHaveLength(0);
  });

  it("複数の関係がある場合は全て返す", async () => {
    const tagRepo = new InMemoryTagRepository([
      structuredClone(tagA),
      structuredClone(tagB),
      structuredClone(tagC),
    ]);
    const relation2: TagRelation = {
      uuid: "r2",
      sourceTagId: "t1",
      targetTagId: "t3",
      weight: 40,
      note: "",
    };
    const relationRepo = new InMemoryTagRelationRepository([
      structuredClone(existingRelation),
      structuredClone(relation2),
    ]);

    const result = await getRelationsForTag(relationRepo, tagRepo, "t1");

    expect(result).toHaveLength(2);
    const relatedIds = result.map((r) => r.relatedTag.uuid);
    expect(relatedIds).toContain("t2");
    expect(relatedIds).toContain("t3");
  });
});
