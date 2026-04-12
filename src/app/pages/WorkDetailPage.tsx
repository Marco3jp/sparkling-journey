import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDependencies } from "../contexts/useDependencies";
import { getWorkById } from "../../domain/usecases/getWorkById";
import { listTags } from "../../domain/usecases/listTags";
import { createTag } from "../../domain/usecases/createTag";
import { linkTagToWork } from "../../domain/usecases/linkTagToWork";
import { unlinkTagFromWork } from "../../domain/usecases/unlinkTagFromWork";
import { updateWorkTagNote } from "../../domain/usecases/updateWorkTagNote";
import type { Work } from "../../domain/models/Work";
import type { Tag } from "../../domain/models/Tag";
import { LinkifiedText } from "../components/LinkifiedText";
import { Select } from "../components/Select";
import type { SelectOption } from "../components/Select";

const NEW_TAG_VALUE = "__new__";

function buildTagOptions(
  tags: Tag[],
  query: string,
): SelectOption[] {
  const q = query.trim().toLocaleLowerCase();
  const filtered = q
    ? tags.filter(
        (t) =>
          t.name.toLocaleLowerCase().includes(q) ||
          t.description.toLocaleLowerCase().includes(q),
      )
    : tags;

  const options: SelectOption[] = filtered.map((t) => ({
    value: t.uuid,
    label: t.description ? `${t.name} — ${t.description}` : t.name,
  }));

  const exactMatch = tags.some(
    (t) => t.name.toLocaleLowerCase() === q,
  );
  if (q && !exactMatch) {
    options.unshift({
      value: NEW_TAG_VALUE,
      label: `「${query.trim()}」を新規タグとして追加`,
      labelClassName: "text-sky-300",
    });
  }

  return options;
}

function WorkTagNoteInput({
  note,
  onSave,
}: {
  note: string;
  onSave: (nextNote: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(note);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(note);
  }, [note]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [draft, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (draft !== note) {
      void onSave(draft);
    }
  };

  if (!isEditing) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsEditing(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setIsEditing(true);
        }}
        className="w-full leading-relaxed cursor-text whitespace-pre-wrap"
      >
        {draft ? (
          <LinkifiedText text={draft} />
        ) : (
          <span className="text-white/40">メモ</span>
        )}
      </div>
    );
  }

  return (
    <textarea
      ref={textareaRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleBlur}
      autoFocus
      placeholder="メモ"
      className="w-full min-h-[2.5em] resize-y overflow-hidden leading-relaxed"
      rows={1}
    />
  );
}

export function WorkDetailPage() {
  const { uuid } = useParams<"uuid">();
  const { workRepository, tagRepository } = useDependencies();
  const [work, setWork] = useState<Work | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [linkSearchText, setLinkSearchText] = useState("");
  const [linkSelectedValue, setLinkSelectedValue] = useState("");
  const [linkNote, setLinkNote] = useState("");

  useEffect(() => {
    if (!uuid) return;
    getWorkById(workRepository, uuid).then(setWork);
    listTags(tagRepository).then(setAllTags);
  }, [uuid, workRepository, tagRepository]);

  const reload = () => {
    if (!uuid) return;
    getWorkById(workRepository, uuid).then(setWork);
    listTags(tagRepository).then(setAllTags);
  };

  const handleLinkTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uuid || !linkSelectedValue) return;
    try {
      if (linkSelectedValue === NEW_TAG_VALUE) {
        const name = linkSearchText.trim();
        if (!name) return;
        const newTag = await createTag(tagRepository, {
          name,
          description: "",
        });
        await linkTagToWork(
          uuid,
          newTag.uuid,
          linkNote,
          workRepository,
          tagRepository,
        );
      } else {
        await linkTagToWork(
          uuid,
          linkSelectedValue,
          linkNote,
          workRepository,
          tagRepository,
        );
      }
      setLinkSearchText("");
      setLinkSelectedValue("");
      setLinkNote("");
      reload();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleUnlink = async (tagId: string) => {
    if (!uuid) return;
    await unlinkTagFromWork(uuid, tagId, workRepository);
    reload();
  };

  const handleNoteChange = async (tagId: string, note: string) => {
    if (!uuid) return;
    try {
      const updatedWork = await updateWorkTagNote(
        uuid,
        tagId,
        note,
        workRepository,
      );
      setWork(updatedWork);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (!uuid) return <p>Invalid work.</p>;
  if (work === null) return <p>Loading…</p>;

  const alreadyLinkedIds = new Set(work.workTags.map((wt) => wt.tag.uuid));
  const tagsToAdd = allTags.filter((t) => !alreadyLinkedIds.has(t.uuid));
  const tagOptions = buildTagOptions(tagsToAdd, linkSearchText);

  return (
    <div>
      <p className="mb-2">
        <Link to="/">← Home</Link>
      </p>
      <h1 className="mt-0">{work.title}</h1>
      <section className="mb-6">
        <h2>紐付いたタグ</h2>
        {work.workTags.length === 0 ? (
          <p>タグはまだありません。</p>
        ) : (
          <ul className="list-none p-0">
            {work.workTags.map((wt) => (
              <li
                key={wt.tag.uuid}
                className="mb-3 flex items-center gap-3"
              >
                <Link to={`/tags/${wt.tag.uuid}`} className="shrink-0">
                  {wt.tag.name}
                </Link>
                <div className="min-w-0 flex-1">
                  <WorkTagNoteInput
                    note={wt.note}
                    onSave={(nextNote) =>
                      handleNoteChange(wt.tag.uuid, nextNote)}
                  />
                </div>
                <button type="button" onClick={() => handleUnlink(wt.tag.uuid)}>
                  外す
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <form onSubmit={handleLinkTag} className="relative">
        <h3>タグを追加</h3>
        <div className="flex flex-wrap gap-3 items-start">
          <Select
            value={linkSelectedValue}
            options={tagOptions}
            onChange={(val) => {
              setLinkSelectedValue(val);
              if (val !== NEW_TAG_VALUE) {
                const found = tagsToAdd.find((t) => t.uuid === val);
                if (found) setLinkSearchText(found.name);
              }
            }}
            onQueryChange={setLinkSearchText}
            valueLabel={
              linkSelectedValue === NEW_TAG_VALUE ? linkSearchText : undefined
            }
            searchable
            placeholder="タグ名で検索 or 新規タグ名を入力"
            className="w-[280px]"
          />
          <input
            value={linkNote}
            onChange={(e) => setLinkNote(e.target.value)}
            placeholder="メモ（任意）"
            className="w-[160px]"
          />
          <button type="submit" disabled={!linkSelectedValue}>
            追加
          </button>
        </div>
        <p className="mt-1.5 text-sm text-white/60">
          候補から選ぶか、そのまま入力して追加すると新規タグを作成して紐付けます。
        </p>
      </form>
    </div>
  );
}
