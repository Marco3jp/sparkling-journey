import { describe, it, expect } from "vitest";
import { searchByText } from "../../../src/domain/usecases/searchByText";
import {
  InMemoryTagRepository,
  InMemoryWorkRepository,
} from "../../helpers/InMemoryRepositories";
import type { Tag } from "../../../src/domain/models/Tag";
import type { Work } from "../../../src/domain/models/Work";

const tagA: Tag = { uuid: "t1", name: "Fantasy", description: "魔法と剣の物語" };
const tagB: Tag = { uuid: "t2", name: "SF", description: "宇宙とテクノロジー" };

const workWithTags: Work = {
  uuid: "w1",
  title: "異世界冒険",
  workTags: [
    { tag: tagA, note: "長編 Fantasy 作品" },
    { tag: tagB, note: "ハードSF" },
  ],
};
const workNoTags: Work = {
  uuid: "w2",
  title: "普通の話",
  workTags: [],
};

describe("searchByText - 追加ケース", () => {
  it("クエリ前後の空白は無視して検索される", async () => {
    const workRepo = new InMemoryWorkRepository([workWithTags, workNoTags]);
    const tagRepo = new InMemoryTagRepository([tagA, tagB]);

    const result = await searchByText("  Fantasy  ", workRepo, tagRepo);

    expect(result.works.map((w) => w.uuid)).toContain("w1");
    expect(result.tags.map((t) => t.uuid)).toContain("t1");
  });

  it("tag の description に一致した場合は tags に含まれる", async () => {
    const workRepo = new InMemoryWorkRepository([]);
    const tagRepo = new InMemoryTagRepository([tagA, tagB]);

    const result = await searchByText("魔法", workRepo, tagRepo);

    expect(result.tags.map((t) => t.uuid)).toEqual(["t1"]);
    expect(result.works).toHaveLength(0);
  });

  it("マッチなしのクエリは空の結果を返す", async () => {
    const workRepo = new InMemoryWorkRepository([workWithTags]);
    const tagRepo = new InMemoryTagRepository([tagA]);

    const result = await searchByText("xyz-no-match-at-all", workRepo, tagRepo);

    expect(result.works).toHaveLength(0);
    expect(result.tags).toHaveLength(0);
  });

  it("空白のみのクエリは全件返す", async () => {
    const workRepo = new InMemoryWorkRepository([workWithTags, workNoTags]);
    const tagRepo = new InMemoryTagRepository([tagA, tagB]);

    const result = await searchByText("   ", workRepo, tagRepo);

    expect(result.works).toHaveLength(2);
    expect(result.tags).toHaveLength(2);
  });

  it("workTag の note にのみマッチした場合も work が結果に含まれる", async () => {
    const workRepo = new InMemoryWorkRepository([workWithTags, workNoTags]);
    const tagRepo = new InMemoryTagRepository([tagA, tagB]);

    const result = await searchByText("ハードSF", workRepo, tagRepo);

    expect(result.works.map((w) => w.uuid)).toContain("w1");
  });

  it("workTag の tag.name にのみマッチした場合も work が結果に含まれる", async () => {
    const workRepo = new InMemoryWorkRepository([workWithTags, workNoTags]);
    const tagRepo = new InMemoryTagRepository([tagA, tagB]);

    const result = await searchByText("fantasy", workRepo, tagRepo);

    expect(result.works.map((w) => w.uuid)).toContain("w1");
  });

  it("同一クエリが work・tag 両方にマッチする場合は両方に含まれる", async () => {
    const workMatchingTitle: Work = {
      uuid: "w3",
      title: "SF Adventure",
      workTags: [],
    };
    const workRepo = new InMemoryWorkRepository([workMatchingTitle]);
    const tagRepo = new InMemoryTagRepository([tagB]);

    const result = await searchByText("sf", workRepo, tagRepo);

    expect(result.works.map((w) => w.uuid)).toContain("w3");
    expect(result.tags.map((t) => t.uuid)).toContain("t2");
  });
});
