import { describe, it, expect, vi } from "vitest";
import { exportData } from "../../../src/domain/usecases/exportData";
import { previewImport } from "../../../src/domain/usecases/previewImport";
import { importData } from "../../../src/domain/usecases/importData";
import type { Tag } from "../../../src/domain/models/Tag";
import type { Work } from "../../../src/domain/models/Work";
import type {
  ExportPayload,
  StaticFileSerializer
} from "../../../src/domain/serialization/StaticFileSerializer";
import type { TagRepository } from "../../../src/domain/repositories/TagRepository";
import type { WorkRepository } from "../../../src/domain/repositories/WorkRepository";

const tags: Tag[] = [
  { uuid: "t1", name: "Tag1", description: "" },
  { uuid: "t2", name: "Tag2", description: "" }
];

const works: Work[] = [
  { uuid: "w1", title: "Work1", workTags: [] },
  { uuid: "w2", title: "Work2", workTags: [] }
];

class JsonStaticFileSerializer implements StaticFileSerializer {
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

describe("exportData", () => {
  it("現在の Tag / Work を JSON としてシリアライズする", async () => {
    const tagRepo: TagRepository = {
      getById: vi.fn(),
      listAll: vi.fn().mockResolvedValue(tags),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      searchByText: vi.fn()
    };
    const workRepo: WorkRepository = {
      getById: vi.fn(),
      listAll: vi.fn().mockResolvedValue(works),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      searchByText: vi.fn()
    };
    const serializer = new JsonStaticFileSerializer();

    const json = await exportData(workRepo, tagRepo, serializer);
    const payload = serializer.deserialize(json);

    expect(payload.version).toBe(1);
    expect(payload.tags).toEqual(tags);
    expect(payload.works).toEqual(works);
    expect(typeof payload.exportedAt).toBe("string");
  });
});

describe("previewImport", () => {
  it("既存とインポート対象を付き合わせて override / create を判定する", () => {
    const serializer = new JsonStaticFileSerializer();
    const payload: ExportPayload = {
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
    const json = serializer.serialize(payload);

    const result = previewImport(json, tags, works, serializer);

    expect(result.willOverrideTags.map((t) => t.uuid)).toEqual(["t1"]);
    expect(result.willCreateTags.map((t) => t.uuid)).toEqual(["t3"]);
    expect(result.willOverrideWorks.map((w) => w.uuid)).toEqual(["w2"]);
    expect(result.willCreateWorks.map((w) => w.uuid)).toEqual(["w3"]);
  });
});

describe("importData", () => {
  it("同じ uuid は update、新規 uuid は create を呼び出す (Tag / Work 両方)", async () => {
    const serializer = new JsonStaticFileSerializer();
    const payload: ExportPayload = {
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
    const json = serializer.serialize(payload);

    const tagRepo: TagRepository = {
      getById: vi.fn(),
      listAll: vi.fn().mockResolvedValue(tags),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
      searchByText: vi.fn()
    };
    const workRepo: WorkRepository = {
      getById: vi.fn(),
      listAll: vi.fn().mockResolvedValue(works),
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
});

