import { describe, it, expect, vi } from "vitest";
import { exportData } from "../../../src/domain/usecases/exportData";
import { previewImport } from "../../../src/domain/usecases/previewImport";
import { importData } from "../../../src/domain/usecases/importData";
import { JsonStaticFileSerializer } from "../../../src/infrastructure/storage/JsonStaticFileSerializer";
import {
  InMemoryTagRepository,
  InMemoryWorkRepository,
} from "../../helpers/InMemoryRepositories";
import type { Tag } from "../../../src/domain/models/Tag";
import type { Work } from "../../../src/domain/models/Work";
import type {
  ExportPayload,
  StaticFileSerializer
} from "../../../src/domain/serialization/StaticFileSerializer";
import type { TagRepository } from "../../../src/domain/repositories/TagRepository";
import type { WorkRepository } from "../../../src/domain/repositories/WorkRepository";

const sampleTags: Tag[] = [
  { uuid: "t1", name: "Tag1", description: "" },
  { uuid: "t2", name: "Tag2", description: "" }
];

const sampleWorks: Work[] = [
  { uuid: "w1", title: "Work1", workTags: [] },
  { uuid: "w2", title: "Work2", workTags: [] }
];

const importPayloadMixed: ExportPayload = {
  version: 1,
  exportedAt: "",
  tags: [
    { uuid: "t1", name: "Tag1-new", description: "" }, // 上書き
    { uuid: "t3", name: "Tag3", description: "" } // 新規
  ],
  works: [
    { uuid: "w2", title: "Work2-new", workTags: [] }, // 上書き
    { uuid: "w3", title: "Work3", workTags: [] } // 新規
  ]
};

class StubStaticFileSerializer implements StaticFileSerializer {
  serialize(payload: ExportPayload): string {
    return JSON.stringify(payload);
  }
  deserialize(json: string): ExportPayload {
    const parsed = JSON.parse(json) as ExportPayload;
    if (parsed.version !== 1) {
      throw new Error("Unsupported version");
    }
    return parsed;
  }
}

const serializer = new StubStaticFileSerializer();
const realSerializer = new JsonStaticFileSerializer();

describe("exportData", () => {
  it("現在の Tag / Work を JSON としてシリアライズする", async () => {
    const tagRepo: TagRepository = {
      getById: vi.fn(),
      listAll: vi.fn().mockResolvedValue(sampleTags),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      searchByText: vi.fn()
    };
    const workRepo: WorkRepository = {
      getById: vi.fn(),
      listAll: vi.fn().mockResolvedValue(sampleWorks),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      searchByText: vi.fn()
    };

    const json = await exportData(workRepo, tagRepo, serializer);
    const payload = serializer.deserialize(json);

    expect(payload.version).toBe(1);
    expect(payload.tags).toEqual(sampleTags);
    expect(payload.works).toEqual(sampleWorks);
    expect(typeof payload.exportedAt).toBe("string");
  });

  it("tags / works が空のときも正常にエクスポートできる", async () => {
    const tagRepo: TagRepository = {
      getById: vi.fn(),
      listAll: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      searchByText: vi.fn()
    };
    const workRepo: WorkRepository = {
      getById: vi.fn(),
      listAll: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      searchByText: vi.fn()
    };

    const json = await exportData(workRepo, tagRepo, realSerializer);
    const payload = realSerializer.deserialize(json);

    expect(payload.version).toBe(1);
    expect(payload.tags).toEqual([]);
    expect(payload.works).toEqual([]);
    expect(payload.exportedAt).not.toBe("");
  });

  it("exportedAt が ISO 8601 形式の文字列になっている", async () => {
    const tagRepo: TagRepository = {
      getById: vi.fn(),
      listAll: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      searchByText: vi.fn()
    };
    const workRepo: WorkRepository = {
      getById: vi.fn(),
      listAll: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      searchByText: vi.fn()
    };

    const json = await exportData(workRepo, tagRepo, realSerializer);
    const payload = realSerializer.deserialize(json);

    expect(new Date(payload.exportedAt).toISOString()).toBe(payload.exportedAt);
  });
});

describe("previewImport", () => {
  it("既存とインポート対象を付き合わせて override / create を判定する", () => {
    const json = serializer.serialize(importPayloadMixed);

    const result = previewImport(json, sampleTags, sampleWorks, serializer);

    expect(result.willOverrideTags.map((t) => t.uuid)).toEqual(["t1"]);
    expect(result.willCreateTags.map((t) => t.uuid)).toEqual(["t3"]);
    expect(result.willOverrideWorks.map((w) => w.uuid)).toEqual(["w2"]);
    expect(result.willCreateWorks.map((w) => w.uuid)).toEqual(["w3"]);
  });

  it("インポートデータが全て新規の場合は willCreate のみ", () => {
    const payload: ExportPayload = {
      version: 1,
      exportedAt: "",
      tags: [{ uuid: "t-new", name: "New Tag", description: "" }],
      works: [{ uuid: "w-new", title: "New Work", workTags: [] }]
    };
    const json = serializer.serialize(payload);

    const result = previewImport(json, [], [], serializer);

    expect(result.willCreateTags).toHaveLength(1);
    expect(result.willOverrideTags).toHaveLength(0);
    expect(result.willCreateWorks).toHaveLength(1);
    expect(result.willOverrideWorks).toHaveLength(0);
  });

  it("インポートデータが全て既存と一致する場合は willOverride のみ", () => {
    const payload: ExportPayload = {
      version: 1,
      exportedAt: "",
      tags: [{ uuid: "t1", name: "Tag1-updated", description: "" }],
      works: [{ uuid: "w1", title: "Work1-updated", workTags: [] }]
    };
    const json = serializer.serialize(payload);

    const result = previewImport(json, sampleTags, sampleWorks, serializer);

    expect(result.willOverrideTags).toHaveLength(1);
    expect(result.willCreateTags).toHaveLength(0);
    expect(result.willOverrideWorks).toHaveLength(1);
    expect(result.willCreateWorks).toHaveLength(0);
  });

  it("インポートデータが空の場合は全て空", () => {
    const payload: ExportPayload = { version: 1, exportedAt: "", tags: [], works: [] };
    const json = serializer.serialize(payload);

    const result = previewImport(json, [], [], serializer);

    expect(result.willCreateTags).toHaveLength(0);
    expect(result.willOverrideTags).toHaveLength(0);
    expect(result.willCreateWorks).toHaveLength(0);
    expect(result.willOverrideWorks).toHaveLength(0);
  });

  it("不正な JSON を渡すと例外をスローする", () => {
    expect(() =>
      previewImport("INVALID_JSON", [], [], realSerializer)
    ).toThrow();
  });

  it("バージョンが不正な JSON を渡すと例外をスローする", () => {
    const json = JSON.stringify({ version: 99, tags: [], works: [] });

    expect(() => previewImport(json, [], [], realSerializer)).toThrow();
  });
});

describe("importData", () => {
  it("同じ uuid は update、新規 uuid は create を呼び出す (Tag / Work 両方)", async () => {
    const json = serializer.serialize(importPayloadMixed);

    const tagRepo: TagRepository = {
      getById: vi.fn(),
      listAll: vi.fn().mockResolvedValue(sampleTags),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
      searchByText: vi.fn()
    };
    const workRepo: WorkRepository = {
      getById: vi.fn(),
      listAll: vi.fn().mockResolvedValue(sampleWorks),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
      searchByText: vi.fn()
    };

    await importData(json, workRepo, tagRepo, serializer);

    expect(tagRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ uuid: "t1", name: "Tag1-new" })
    );
    expect(tagRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ uuid: "t3" })
    );

    expect(workRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ uuid: "w2", title: "Work2-new" })
    );
    expect(workRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ uuid: "w3" })
    );
  });

  it("インポートデータが空のとき create / update は呼ばれない", async () => {
    const tagRepo = new InMemoryTagRepository([]);
    const workRepo = new InMemoryWorkRepository([]);

    const payload: ExportPayload = { version: 1, exportedAt: "", tags: [], works: [] };
    const json = serializer.serialize(payload);

    await importData(json, workRepo, tagRepo, serializer);

    expect(await tagRepo.listAll()).toHaveLength(0);
    expect(await workRepo.listAll()).toHaveLength(0);
  });

  it("全て新規データのときは create によって追加される", async () => {
    const tagRepo = new InMemoryTagRepository([]);
    const workRepo = new InMemoryWorkRepository([]);

    const payload: ExportPayload = {
      version: 1,
      exportedAt: "",
      tags: [{ uuid: "t1", name: "Tag1", description: "" }],
      works: [{ uuid: "w1", title: "Work1", workTags: [] }]
    };
    const json = serializer.serialize(payload);

    await importData(json, workRepo, tagRepo, serializer);

    expect(await tagRepo.listAll()).toHaveLength(1);
    expect(await workRepo.listAll()).toHaveLength(1);
  });

  it("全て既存データのときは update によって内容が置き換わる", async () => {
    const tagRepo = new InMemoryTagRepository([
      { uuid: "t1", name: "Old Name", description: "" }
    ]);
    const workRepo = new InMemoryWorkRepository([
      { uuid: "w1", title: "Old Title", workTags: [] }
    ]);

    const payload: ExportPayload = {
      version: 1,
      exportedAt: "",
      tags: [{ uuid: "t1", name: "New Name", description: "" }],
      works: [{ uuid: "w1", title: "New Title", workTags: [] }]
    };
    const json = serializer.serialize(payload);

    await importData(json, workRepo, tagRepo, serializer);

    expect((await tagRepo.getById("t1"))?.name).toBe("New Name");
    expect((await workRepo.getById("w1"))?.title).toBe("New Title");
  });

  it("不正な JSON を渡すと例外をスローする", async () => {
    const tagRepo = new InMemoryTagRepository([]);
    const workRepo = new InMemoryWorkRepository([]);

    await expect(
      importData("INVALID_JSON", workRepo, tagRepo, realSerializer)
    ).rejects.toThrow();
  });
});
