import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDependencies } from "../contexts/useDependencies";
import { listWorks } from "../../domain/usecases/listWorks";
import { listTags } from "../../domain/usecases/listTags";
import { createWork } from "../../domain/usecases/createWork";
import { createTag } from "../../domain/usecases/createTag";
import type { Work } from "../../domain/models/Work";
import type { Tag } from "../../domain/models/Tag";
import { LinkifiedText } from "../components/LinkifiedText";

export function HomePage() {
  const { workRepository, tagRepository } = useDependencies();
  const [works, setWorks] = useState<Work[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showWorkForm, setShowWorkForm] = useState(false);
  const [showTagForm, setShowTagForm] = useState(false);
  const [workTitle, setWorkTitle] = useState("");
  const [tagName, setTagName] = useState("");
  const [tagDesc, setTagDesc] = useState("");

  const load = useCallback(() => {
    listWorks(workRepository).then(setWorks);
    listTags(tagRepository).then(setTags);
  }, [workRepository, tagRepository]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workTitle.trim()) return;
    await createWork(workRepository, { title: workTitle });
    setWorkTitle("");
    setShowWorkForm(false);
    load();
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    await createTag(tagRepository, { name: tagName, description: tagDesc });
    setTagName("");
    setTagDesc("");
    setShowTagForm(false);
    load();
  };

  return (
    <div>
      <h1 className="mt-0">Home</h1>
      <p className="mb-4">
        <button type="button" onClick={() => setShowWorkForm((v) => !v)}>
          + 作品を追加
        </button>{" "}
        <button type="button" onClick={() => setShowTagForm((v) => !v)}>
          + タグを追加
        </button>
      </p>
      {showWorkForm && (
        <form
          onSubmit={handleCreateWork}
          className="mb-4 flex flex-wrap gap-3 items-center"
        >
          <input
            value={workTitle}
            onChange={(e) => setWorkTitle(e.target.value)}
            placeholder="作品タイトル"
            autoFocus
            className="min-w-[200px]"
          />
          <button type="submit">作成</button>
          <button type="button" onClick={() => setShowWorkForm(false)}>
            キャンセル
          </button>
        </form>
      )}
      {showTagForm && (
        <form
          onSubmit={handleCreateTag}
          className="mb-4 flex flex-wrap gap-3 items-center"
        >
          <input
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            placeholder="タグ名"
            autoFocus
            className="min-w-[160px]"
          />
          <input
            value={tagDesc}
            onChange={(e) => setTagDesc(e.target.value)}
            placeholder="説明（任意）"
            className="min-w-[200px]"
          />
          <button type="submit">作成</button>
          <button type="button" onClick={() => setShowTagForm(false)}>
            キャンセル
          </button>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <h2>作品</h2>
          {works.length === 0 ? (
            <p>作品がありません。</p>
          ) : (
            <ul className="list-none p-0">
              {works.map((w) => (
                <li key={w.uuid} className="mb-2">
                  <Link to={`/works/${w.uuid}`}>{w.title}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2>タグ</h2>
          {tags.length === 0 ? (
            <p>タグがありません。</p>
          ) : (
            <ul className="list-none p-0">
              {tags.map((t) => (
                <li key={t.uuid} className="mb-2">
                  <Link to={`/tags/${t.uuid}`}>{t.name}</Link>
                  {t.description ? (
                    <> — <LinkifiedText text={t.description} /></>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
