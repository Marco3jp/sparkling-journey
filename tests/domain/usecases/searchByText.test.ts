import { describe, it, expect } from "vitest";
import { searchByText } from "../../../src/domain/usecases/searchByText";
import { InMemoryTagRepository, InMemoryWorkRepository } from "../../helpers/InMemoryRepositories";
import type { Tag } from "../../../src/domain/models/Tag";
import type { Work } from "../../../src/domain/models/Work";

const sampleTags: Tag[] = [
  { uuid: "t1", name: "Fantasy", description: "魔法と剣の物語" },
  { uuid: "t2", name: "SF", description: "宇宙とテクノロジー" },
  { uuid: "t3", name: "Diary", description: "日記的なメモ" }
];

const sampleWorks: Work[] = [
  {
    uuid: "w1",
    title: "異世界ファンタジー",
    workTags: [{ tag: sampleTags[0], note: "長編" }]
  },
  {
    uuid: "w2",
    title: "宇宙船の旅",
    workTags: [{ tag: sampleTags[1], note: "短編 SF" }]
  },
  {
    uuid: "w3",
    title: "ただの日記",
    workTags: [{ tag: sampleTags[2], note: "プライベート" }]
  }
];

describe("searchByText", () => {
  it("空文字なら全ての works / tags を返す", async () => {
    const workRepo = new InMemoryWorkRepository(sampleWorks);
    const tagRepo = new InMemoryTagRepository(sampleTags);

    const result = await searchByText("", workRepo, tagRepo);

    expect(result.works).toHaveLength(sampleWorks.length);
    expect(result.tags).toHaveLength(sampleTags.length);
  });

  it("work の title に部分一致する", async () => {
    const workRepo = new InMemoryWorkRepository(sampleWorks);
    const tagRepo = new InMemoryTagRepository(sampleTags);

    const result = await searchByText("宇宙船", workRepo, tagRepo);

    expect(result.works.map((w) => w.uuid)).toEqual(["w2"]);
  });

  it("work に紐づく tag.name でもヒットする", async () => {
    const workRepo = new InMemoryWorkRepository(sampleWorks);
    const tagRepo = new InMemoryTagRepository(sampleTags);

    const result = await searchByText("fantasy", workRepo, tagRepo);

    // 大文字小文字を無視して "Fantasy" にマッチする
    expect(result.works.map((w) => w.uuid)).toEqual(["w1"]);
  });

  it("workTag の note に対しても検索する", async () => {
    const workRepo = new InMemoryWorkRepository(sampleWorks);
    const tagRepo = new InMemoryTagRepository(sampleTags);

    const result = await searchByText("短編", workRepo, tagRepo);

    expect(result.works.map((w) => w.uuid)).toEqual(["w2"]);
  });

  it("Tag の name / description に対して検索する", async () => {
    const workRepo = new InMemoryWorkRepository(sampleWorks);
    const tagRepo = new InMemoryTagRepository(sampleTags);

    const result = await searchByText("テクノロジー", workRepo, tagRepo);

    expect(result.tags.map((t) => t.uuid)).toEqual(["t2"]);
  });
});

