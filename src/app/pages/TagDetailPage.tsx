import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDependencies } from "../contexts/AppDependenciesProvider";
import { getTagById } from "../../domain/usecases/getTagById";
import { deleteTag } from "../../domain/usecases/deleteTag";
import type { Tag } from "../../domain/models/Tag";

export function TagDetailPage() {
  const { uuid } = useParams<"uuid">();
  const navigate = useNavigate();
  const { tagRepository, workRepository } = useDependencies();
  const [tag, setTag] = useState<Tag | null>(null);
  const [linkedWorks, setLinkedWorks] = useState<
    { uuid: string; title: string }[]
  >([]);
  const [worksLoaded, setWorksLoaded] = useState(false);

  useEffect(() => {
    if (!uuid) return;
    getTagById(tagRepository, uuid).then(setTag);
  }, [uuid, tagRepository]);

  useEffect(() => {
    if (!uuid) return;
    workRepository.listAll().then((all) => {
      const filtered = all
        .filter((w) => w.workTags.some((wt) => wt.tag.uuid === uuid))
        .map((w) => ({ uuid: w.uuid, title: w.title }));
      setLinkedWorks(filtered);
      setWorksLoaded(true);
    });
  }, [uuid, workRepository]);

  const handleDelete = async () => {
    if (!uuid) return;

    let message: string;
    if (linkedWorks.length > 0) {
      message = `このタグは ${linkedWorks.length} 件の作品に紐づいています。\n削除してもよいですか？`;
    } else {
      message = "このタグを削除しますか？";
    }

    if (!window.confirm(message)) return;

    await deleteTag(uuid, tagRepository, workRepository);
    navigate("/");
  };

  if (!uuid) return <p>Invalid tag.</p>;
  if (tag === null) return <p>Loading…</p>;

  return (
    <div>
      <p className="mb-2">
        <Link to="/">← Home</Link>
      </p>
      <div className="flex items-start justify-between gap-4">
        <h1 className="mt-0">{tag.name}</h1>
        <button
          type="button"
          onClick={handleDelete}
          disabled={!worksLoaded}
          className="shrink-0 text-red-400 border-red-400/60 hover:bg-red-400/10"
        >
          削除
        </button>
      </div>
      {tag.description ? <p>{tag.description}</p> : null}
      <section>
        <h2>このタグが付いた作品</h2>
        {linkedWorks.length === 0 ? (
          <p>このタグが付いた作品はありません。</p>
        ) : (
          <ul className="list-none p-0">
            {linkedWorks.map((w) => (
              <li key={w.uuid} className="mb-2">
                <Link to={`/works/${w.uuid}`}>{w.title}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
