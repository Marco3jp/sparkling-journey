import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDependencies } from "../contexts/useDependencies";
import { getTagById } from "../../domain/usecases/getTagById";
import { deleteTag } from "../../domain/usecases/deleteTag";
import { updateTag } from "../../domain/usecases/updateTag";
import type { Tag } from "../../domain/models/Tag";

function TagDescriptionInput({
  description,
  onSave,
}: {
  description: string;
  onSave: (next: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(description);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(description);
  }, [description]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [draft]);

  const handleBlur = () => {
    if (draft === description) return;
    void onSave(draft);
  };

  return (
    <textarea
      ref={textareaRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleBlur}
      placeholder="説明を入力（任意）"
      className="w-full min-h-[2.5em] resize-y overflow-hidden leading-relaxed"
      rows={1}
    />
  );
}

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

  const handleDescriptionSave = async (nextDescription: string) => {
    if (!tag) return;
    const updated = await updateTag(tagRepository, {
      uuid: tag.uuid,
      name: tag.name,
      description: nextDescription,
    });
    setTag(updated);
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
      <div className="mb-6">
        <p className="text-sm text-white/60 mb-1">説明</p>
        <TagDescriptionInput
          description={tag.description}
          onSave={handleDescriptionSave}
        />
      </div>
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
