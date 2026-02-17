import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { useDependencies } from "../contexts/AppDependenciesProvider";
import { searchByText } from "../../domain/usecases/searchByText";
import type { SearchResult } from "../../domain/usecases/searchByText";

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const text = searchParams.get("text") ?? "";
  const { workRepository, tagRepository } = useDependencies();
  const [result, setResult] = useState<SearchResult | null>(null);

  useEffect(() => {
    searchByText(text, workRepository, tagRepository).then(setResult);
  }, [text, workRepository, tagRepository]);

  if (result === null) return <p>Loading…</p>;

  return (
    <div>
      <h1 className="mt-0">検索: {text || "(全件)"}</h1>
      <section className="mb-6">
        <h2>作品 ({result.works.length})</h2>
        {result.works.length === 0 ? (
          <p>該当なし</p>
        ) : (
          <ul className="list-none p-0">
            {result.works.map((w) => (
              <li key={w.uuid} className="mb-2">
                <Link to={`/works/${w.uuid}`}>{w.title}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2>タグ ({result.tags.length})</h2>
        {result.tags.length === 0 ? (
          <p>該当なし</p>
        ) : (
          <ul className="list-none p-0">
            {result.tags.map((t) => (
              <li key={t.uuid} className="mb-2">
                <Link to={`/tags/${t.uuid}`}>{t.name}</Link>
                {t.description ? ` — ${t.description}` : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
