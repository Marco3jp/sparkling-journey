import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDependencies } from "../contexts/useDependencies";
import { getTagById } from "../../domain/usecases/getTagById";
import { deleteTag } from "../../domain/usecases/deleteTag";
import { updateTag } from "../../domain/usecases/updateTag";
import { getRelationsForTag, type ResolvedTagRelation } from "../../domain/usecases/getRelationsForTag";
import { createTagRelation } from "../../domain/usecases/createTagRelation";
import { updateTagRelation } from "../../domain/usecases/updateTagRelation";
import { deleteTagRelation } from "../../domain/usecases/deleteTagRelation";
import { listTags } from "../../domain/usecases/listTags";
import type { Tag } from "../../domain/models/Tag";
import { LinkifiedText } from "../components/LinkifiedText";
import { Select } from "../components/Select";

function TagDescriptionInput({
  description,
  onSave,
}: {
  description: string;
  onSave: (next: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(description);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(description);
  }, [description]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [draft, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (draft !== description) {
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
        className="w-full min-h-[2.5em] leading-relaxed cursor-text whitespace-pre-wrap"
      >
        {draft ? (
          <LinkifiedText text={draft} />
        ) : (
          <span className="text-white/40">説明を入力（任意）</span>
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
      placeholder="説明を入力（任意）"
      className="w-full min-h-[2.5em] resize-y overflow-hidden leading-relaxed"
      rows={1}
    />
  );
}

const WEIGHT_LEVELS = [1, 2, 3, 4, 5] as const;
type WeightLevel = (typeof WEIGHT_LEVELS)[number];

function weightToLevel(weight: number): WeightLevel {
  const level = Math.round(weight / 20) as WeightLevel;
  if (level < 1) return 1;
  if (level > 5) return 5;
  return level;
}

function WeightDisplay({ weight }: { weight: number }) {
  const level = weightToLevel(weight);
  return (
    <span className="flex gap-0.5" aria-label={`関連度 ${level}`}>
      {WEIGHT_LEVELS.map((l) => (
        <span
          key={l}
          className={`w-2 h-2 rounded-full ${l <= level ? "bg-indigo-400" : "bg-white/20"}`}
        />
      ))}
    </span>
  );
}

function RelationRow({
  resolved,
  onUpdate,
  onDelete,
}: {
  resolved: ResolvedTagRelation;
  onUpdate: (id: string, level: WeightLevel, note: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLevel, setEditLevel] = useState<WeightLevel>(
    weightToLevel(resolved.relation.weight),
  );
  const [editNote, setEditNote] = useState(resolved.relation.note);

  const handleSave = async () => {
    await onUpdate(resolved.relation.uuid, editLevel, editNote);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditLevel(weightToLevel(resolved.relation.weight));
    setEditNote(resolved.relation.note);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <li className="mb-3 p-3 border border-white/20 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Link to={`/tags/${resolved.relatedTag.uuid}`} className="font-medium">
            {resolved.relatedTag.name}
          </Link>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-white/60">関連度:</span>
          <div className="flex gap-1">
            {WEIGHT_LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setEditLevel(l)}
                className={`w-7 h-7 flex items-center justify-center rounded text-sm ${
                  l === editLevel
                    ? "bg-indigo-500 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
                aria-label={`関連度 ${l}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <input
          type="text"
          value={editNote}
          onChange={(e) => setEditNote(e.target.value)}
          placeholder="メモ（任意）"
          className="w-full mb-2 text-sm"
        />
        <div className="flex gap-2">
          <button type="button" onClick={handleSave} className="text-sm">
            保存
          </button>
          <button type="button" onClick={handleCancel} className="text-sm">
            キャンセル
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="mb-2 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Link to={`/tags/${resolved.relatedTag.uuid}`} className="truncate">
          {resolved.relatedTag.name}
        </Link>
        <WeightDisplay weight={resolved.relation.weight} />
        {resolved.relation.note && (
          <span className="text-sm text-white/60 truncate">
            {resolved.relation.note}
          </span>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-sm px-2 py-0.5"
        >
          編集
        </button>
        <button
          type="button"
          onClick={() => onDelete(resolved.relation.uuid)}
          className="text-sm px-2 py-0.5 text-red-400 border-red-400/60 hover:bg-red-400/10"
        >
          削除
        </button>
      </div>
    </li>
  );
}

function AddRelationForm({
  currentTagId,
  allTags,
  existingRelatedTagIds,
  onAdd,
}: {
  currentTagId: string;
  allTags: Tag[];
  existingRelatedTagIds: Set<string>;
  onAdd: (targetTagId: string, level: WeightLevel, note: string) => Promise<void>;
}) {
  const [selectedTagId, setSelectedTagId] = useState("");
  const [level, setLevel] = useState<WeightLevel>(3);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const candidates = allTags.filter(
    (t) => t.uuid !== currentTagId && !existingRelatedTagIds.has(t.uuid),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTagId) return;
    setIsSubmitting(true);
    try {
      await onAdd(selectedTagId, level, note);
      setSelectedTagId("");
      setLevel(3);
      setNote("");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (candidates.length === 0) {
    return (
      <p className="text-sm text-white/40">
        関連付けできるタグがありません。
      </p>
    );
  }

  const candidateOptions = candidates.map((t) => ({
    value: t.uuid,
    label: t.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-sm text-white/60 mb-1">タグ</label>
          <Select
            value={selectedTagId}
            options={candidateOptions}
            onChange={setSelectedTagId}
            placeholder="選択してください"
            searchable
            className="w-44"
            inputClassName="text-sm"
          />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1">関連度</label>
          <div className="flex gap-1">
            {WEIGHT_LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={`w-7 h-7 flex items-center justify-center rounded text-sm ${
                  l === level
                    ? "bg-indigo-500 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
                aria-label={`関連度 ${l}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-40">
          <label className="block text-sm text-white/60 mb-1">メモ（任意）</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="関係性のメモ"
            className="w-full text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={!selectedTagId || isSubmitting}
          className="h-9 px-3 text-sm"
        >
          追加
        </button>
      </div>
    </form>
  );
}

export function TagDetailPage() {
  const { uuid } = useParams<"uuid">();
  const navigate = useNavigate();
  const { tagRepository, workRepository, tagRelationRepository } = useDependencies();
  const [tag, setTag] = useState<Tag | null>(null);
  const [linkedWorks, setLinkedWorks] = useState<
    { uuid: string; title: string }[]
  >([]);
  const [worksLoaded, setWorksLoaded] = useState(false);
  const [relations, setRelations] = useState<ResolvedTagRelation[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);

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

  useEffect(() => {
    if (!uuid) return;
    void getRelationsForTag(tagRelationRepository, tagRepository, uuid).then(setRelations);
    void listTags(tagRepository).then(setAllTags);
  }, [uuid, tagRelationRepository, tagRepository]);

  const handleDelete = async () => {
    if (!uuid) return;

    let message: string;
    if (linkedWorks.length > 0) {
      message = `このタグは ${linkedWorks.length} 件の作品に紐づいています。\n削除してもよいですか？`;
    } else {
      message = "このタグを削除しますか？";
    }

    if (!window.confirm(message)) return;

    await deleteTag(uuid, tagRepository, workRepository, tagRelationRepository);
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

  const handleAddRelation = async (
    targetTagId: string,
    level: WeightLevel,
    note: string,
  ) => {
    if (!uuid) return;
    await createTagRelation(tagRelationRepository, uuid, targetTagId, level, note);
    const updated = await getRelationsForTag(tagRelationRepository, tagRepository, uuid);
    setRelations(updated);
  };

  const handleUpdateRelation = async (
    id: string,
    level: WeightLevel,
    note: string,
  ) => {
    await updateTagRelation(tagRelationRepository, id, level, note);
    if (!uuid) return;
    const updated = await getRelationsForTag(tagRelationRepository, tagRepository, uuid);
    setRelations(updated);
  };

  const handleDeleteRelation = async (id: string) => {
    await deleteTagRelation(tagRelationRepository, id);
    if (!uuid) return;
    const updated = await getRelationsForTag(tagRelationRepository, tagRepository, uuid);
    setRelations(updated);
  };

  if (!uuid) return <p>Invalid tag.</p>;
  if (tag === null) return <p>Loading…</p>;

  const existingRelatedTagIds = new Set(
    relations.map((r) => r.relatedTag.uuid),
  );

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
      <section className="mb-6">
        <h2>関連タグ</h2>
        {relations.length === 0 ? (
          <p className="text-white/60 text-sm">関連タグはまだありません。</p>
        ) : (
          <ul className="list-none p-0">
            {relations.map((r) => (
              <RelationRow
                key={r.relation.uuid}
                resolved={r}
                onUpdate={handleUpdateRelation}
                onDelete={handleDeleteRelation}
              />
            ))}
          </ul>
        )}
        <AddRelationForm
          currentTagId={uuid}
          allTags={allTags}
          existingRelatedTagIds={existingRelatedTagIds}
          onAdd={handleAddRelation}
        />
      </section>
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
