import { describe, it, expect, vi } from "vitest";
import { exportData } from "../../../src/domain/usecases/exportData";
import { previewImport } from "../../../src/domain/usecases/previewImport";
import { importData } from "../../../src/domain/usecases/importData";
import { JsonStaticFileSerializer } from "../../../src/infrastructure/storage/JsonStaticFileSerializer";
import {
  InMemoryTagRepository,
  InMemoryWorkRepository,
} from "../../helpers/InMemoryRepositories";
import type { TagRepository } from "../../../src/domain/repositories/TagRepository";
import type { WorkRepository } from "../../../src/domain/repositories/WorkRepository";

const serializer = new JsonStaticFileSerializer();

describe("exportData - 追加ケース", () => {
  it("tags / works が空のときも正常にエクスポートできる", async () => {
    const tagRepo: TagRepository = {
      getById: vi.fn(),
      listAll: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      searchByText: vi.fn(),
    };
    const workRepo: WorkRepository = {
      getById: vi.fn(),
      listAll: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      searchByText: vi.fn(),
    };

    const json = await exportData(workRepo, tagRepo, serializer);
    const payload = serializer.deserialize(json);

    expect(payload.version).toBe(1);
    expect(payload.tags).toEqual([]);
    expect(payload.works).toEqual([]);
    expect(typeof payload.exportedAt).toBe("string");
    expect(payload.exportedAt).not.toBe("");
  });

  it("exportedAt が ISO 8601 形式の文字列になっている", async () => {
    const tagRepo: TagRepository = {
      getById: vi.fn(),
      listAll: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      searchByText: vi.fn(),
    };
    const workRepo: WorkRepository = {
      getById: vi.fn(),
      listAll: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      searchByText: vi.fn(),
    };

    const json = await exportData(workRepo, tagRepo, serializer);
    const payload = serializer.deserialize(json);

    expect(new Date(payload.exportedAt).toISOString()).toBe(payload.exportedAt);
  });
});

describe("previewImport - 追加ケース", () => {
  it("インポートデータが全て新規の場合は willCreate のみ", () => {
    const payload = {
      version: 1 as const,
      exportedAt: "",
      tags: [{ uuid: "t-new", name: "New Tag", description: "" }],
      works: [{ uuid: "w-new", title: "New Work", workTags: [] }],
    };
    const json = serializer.serialize(payload);

    const result = previewImport(json, [], [], serializer);

    expect(result.willCreateTags).toHaveLength(1);
    expect(result.willOverrideTags).toHaveLength(0);
    expect(result.willCreateWorks).toHaveLength(1);
    expect(result.willOverrideWorks).toHaveLength(0);
  });

  it("インポートデータが全て既存と一致する場合は willOverride のみ", () => {
    const currentTags = [{ uuid: "t1", name: "Tag1", description: "" }];
    const currentWorks = [{ uuid: "w1", title: "Work1", workTags: [] }];
    const payload = {
      version: 1 as const,
      exportedAt: "",
      tags: [{ uuid: "t1", name: "Tag1-updated", description: "" }],
      works: [{ uuid: "w1", title: "Work1-updated", workTags: [] }],
    };
    const json = serializer.serialize(payload);

    const result = previewImport(json, currentTags, currentWorks, serializer);

    expect(result.willOverrideTags).toHaveLength(1);
    expect(result.willCreateTags).toHaveLength(0);
    expect(result.willOverrideWorks).toHaveLength(1);
    expect(result.willCreateWorks).toHaveLength(0);
  });

  it("インポートデータが空の場合は全て空", () => {
    const payload = {
      version: 1 as const,
      exportedAt: "",
      tags: [],
      works: [],
    };
    const json = serializer.serialize(payload);

    const result = previewImport(json, [], [], serializer);

    expect(result.willCreateTags).toHaveLength(0);
    expect(result.willOverrideTags).toHaveLength(0);
    expect(result.willCreateWorks).toHaveLength(0);
    expect(result.willOverrideWorks).toHaveLength(0);
  });

  it("不正な JSON を渡すと例外をスローする", () => {
    expect(() =>
      previewImport("INVALID_JSON", [], [], serializer),
    ).toThrow();
  });

  it("バージョンが不正な JSON を渡すと例外をスローする", () => {
    const json = JSON.stringify({ version: 99, tags: [], works: [] });

    expect(() => previewImport(json, [], [], serializer)).toThrow();
  });
});

describe("importData - 追加ケース", () => {
  it("インポートデータが空のとき create / update は呼ばれない", async () => {
    const tagRepo = new InMemoryTagRepository([]);
    const workRepo = new InMemoryWorkRepository([]);

    const payload = {
      version: 1 as const,
      exportedAt: "",
      tags: [],
      works: [],
    };
    const json = serializer.serialize(payload);

    await importData(json, workRepo, tagRepo, serializer);

    expect(await tagRepo.listAll()).toHaveLength(0);
    expect(await workRepo.listAll()).toHaveLength(0);
  });

  it("全て新規データのときは create のみが呼ばれる", async () => {
    const tagRepo = new InMemoryTagRepository([]);
    const workRepo = new InMemoryWorkRepository([]);

    const payload = {
      version: 1 as const,
      exportedAt: "",
      tags: [{ uuid: "t1", name: "Tag1", description: "" }],
      works: [{ uuid: "w1", title: "Work1", workTags: [] }],
    };
    const json = serializer.serialize(payload);

    await importData(json, workRepo, tagRepo, serializer);

    const tags = await tagRepo.listAll();
    const works = await workRepo.listAll();
    expect(tags).toHaveLength(1);
    expect(works).toHaveLength(1);
  });

  it("全て既存データのときは update によって内容が置き換わる", async () => {
    const tagRepo = new InMemoryTagRepository([
      { uuid: "t1", name: "Old Name", description: "" },
    ]);
    const workRepo = new InMemoryWorkRepository([
      { uuid: "w1", title: "Old Title", workTags: [] },
    ]);

    const payload = {
      version: 1 as const,
      exportedAt: "",
      tags: [{ uuid: "t1", name: "New Name", description: "" }],
      works: [{ uuid: "w1", title: "New Title", workTags: [] }],
    };
    const json = serializer.serialize(payload);

    await importData(json, workRepo, tagRepo, serializer);

    const tag = await tagRepo.getById("t1");
    const work = await workRepo.getById("w1");
    expect(tag?.name).toBe("New Name");
    expect(work?.title).toBe("New Title");
  });

  it("不正な JSON を渡すと例外をスローする", async () => {
    const tagRepo = new InMemoryTagRepository([]);
    const workRepo = new InMemoryWorkRepository([]);

    await expect(
      importData("INVALID_JSON", workRepo, tagRepo, serializer),
    ).rejects.toThrow();
  });
});
