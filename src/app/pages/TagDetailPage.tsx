import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDependencies } from "../contexts/useDependencies";
import { getTagById } from "../../domain/usecases/getTagById";
import type { Tag } from "../../domain/models/Tag";

export function TagDetailPage() {
  const { uuid } = useParams<"uuid">();
  const { tagRepository } = useDependencies();
  const [tag, setTag] = useState<Tag | null>(null);

  useEffect(() => {
    if (!uuid) return;
    getTagById(tagRepository, uuid).then(setTag);
  }, [uuid, tagRepository]);

  if (!uuid) return <p>Invalid tag.</p>;
  if (tag === null) return <p>Loading…</p>;

  return (
    <div>
      <p className="mb-2">
        <Link to="/">← Home</Link>
      </p>
      <h1 className="mt-0">{tag.name}</h1>
      {tag.description ? <p>{tag.description}</p> : null}
      <section>
        <h2>このタグが付いた作品</h2>
        <TagDetailWorks tagId={tag.uuid} />
      </section>
    </div>
  );
}

function TagDetailWorks({ tagId }: { tagId: string }) {
  const { workRepository } = useDependencies();
  const [works, setWorks] = useState<{ uuid: string; title: string }[]>([]);

  useEffect(() => {
    workRepository.listAll().then((all) => {
      const filtered = all
        .filter((w) => w.workTags.some((wt) => wt.tag.uuid === tagId))
        .map((w) => ({ uuid: w.uuid, title: w.title }));
      setWorks(filtered);
    });
  }, [tagId, workRepository]);

  if (works.length === 0) return <p>このタグが付いた作品はありません。</p>;
  return (
    <ul className="list-none p-0">
      {works.map((w) => (
        <li key={w.uuid} className="mb-2">
          <Link to={`/works/${w.uuid}`}>{w.title}</Link>
        </li>
      ))}
    </ul>
  );
}
