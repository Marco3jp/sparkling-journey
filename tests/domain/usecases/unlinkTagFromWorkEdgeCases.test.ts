import { describe, it, expect } from "vitest";
import { unlinkTagFromWork } from "../../../src/domain/usecases/unlinkTagFromWork";
import { InMemoryWorkRepository } from "../../helpers/InMemoryRepositories";

describe("unlinkTagFromWork - 追加ケース", () => {
  it("存在しない Work を指定した場合はエラーになる", async () => {
    const workRepo = new InMemoryWorkRepository([]);

    await expect(
      unlinkTagFromWork("missing-work", "t1", workRepo),
    ).rejects.toThrowError(/Work not found/);
  });

  it("workTags が空の Work に対して unlink してもエラーにならない", async () => {
    const workRepo = new InMemoryWorkRepository([
      { uuid: "w1", title: "Empty Work", workTags: [] },
    ]);

    const result = await unlinkTagFromWork("w1", "t1", workRepo);

    expect(result.workTags).toHaveLength(0);
  });
});
