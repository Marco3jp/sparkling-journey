import { describe, it, expect } from "vitest";
import { JsonStaticFileSerializer } from "../../../src/infrastructure/storage/JsonStaticFileSerializer";
import type { ExportPayload } from "../../../src/domain/serialization/StaticFileSerializer";

const serializer = new JsonStaticFileSerializer();

const validPayload: ExportPayload = {
  version: 1,
  exportedAt: "2024-01-01T00:00:00.000Z",
  tags: [{ uuid: "t1", name: "Tag1", description: "desc" }],
  works: [
    {
      uuid: "w1",
      title: "Work1",
      workTags: [
        {
          tag: { uuid: "t1", name: "Tag1", description: "desc" },
          note: "note1",
        },
      ],
    },
  ],
};

describe("JsonStaticFileSerializer#serialize", () => {
  it("ExportPayload を JSON 文字列に変換できる", () => {
    const json = serializer.serialize(validPayload);

    expect(typeof json).toBe("string");
    const parsed = JSON.parse(json) as ExportPayload;
    expect(parsed.version).toBe(1);
    expect(parsed.tags).toEqual(validPayload.tags);
    expect(parsed.works).toEqual(validPayload.works);
    expect(parsed.exportedAt).toBe(validPayload.exportedAt);
  });

  it("tags や works が空配列でもシリアライズできる", () => {
    const emptyPayload: ExportPayload = {
      version: 1,
      exportedAt: "",
      tags: [],
      works: [],
    };

    const json = serializer.serialize(emptyPayload);
    const parsed = JSON.parse(json) as ExportPayload;

    expect(parsed.tags).toEqual([]);
    expect(parsed.works).toEqual([]);
  });
});

describe("JsonStaticFileSerializer#deserialize", () => {
  it("正常な JSON をデシリアライズできる", () => {
    const json = serializer.serialize(validPayload);

    const result = serializer.deserialize(json);

    expect(result.version).toBe(1);
    expect(result.tags).toEqual(validPayload.tags);
    expect(result.works).toEqual(validPayload.works);
    expect(result.exportedAt).toBe(validPayload.exportedAt);
  });

  it("exportedAt が文字列でない場合は空文字になる", () => {
    const payloadWithoutDate = {
      version: 1,
      exportedAt: 12345,
      tags: [],
      works: [],
    };
    const json = JSON.stringify(payloadWithoutDate);

    const result = serializer.deserialize(json);

    expect(result.exportedAt).toBe("");
  });

  it("exportedAt が未定義の場合は空文字になる", () => {
    const payloadWithoutDate = { version: 1, tags: [], works: [] };
    const json = JSON.stringify(payloadWithoutDate);

    const result = serializer.deserialize(json);

    expect(result.exportedAt).toBe("");
  });

  it("version が 1 以外のとき例外をスローする", () => {
    const invalidVersion = { version: 2, exportedAt: "", tags: [], works: [] };
    const json = JSON.stringify(invalidVersion);

    expect(() => serializer.deserialize(json)).toThrow();
  });

  it("version フィールドがないとき例外をスローする", () => {
    const noVersion = { exportedAt: "", tags: [], works: [] };
    const json = JSON.stringify(noVersion);

    expect(() => serializer.deserialize(json)).toThrow();
  });

  it("tags が配列でないとき例外をスローする", () => {
    const invalidTags = { version: 1, exportedAt: "", tags: "not-array", works: [] };
    const json = JSON.stringify(invalidTags);

    expect(() => serializer.deserialize(json)).toThrow();
  });

  it("works が配列でないとき例外をスローする", () => {
    const invalidWorks = { version: 1, exportedAt: "", tags: [], works: "not-array" };
    const json = JSON.stringify(invalidWorks);

    expect(() => serializer.deserialize(json)).toThrow();
  });

  it("不正な JSON 文字列のとき例外をスローする", () => {
    expect(() => serializer.deserialize("NOT_JSON{{")).toThrow();
  });

  it("null のとき例外をスローする", () => {
    expect(() => serializer.deserialize("null")).toThrow();
  });

  it("空文字のとき例外をスローする", () => {
    expect(() => serializer.deserialize("")).toThrow();
  });
});
