import { useState, useRef } from "react";
import { useDependencies } from "../contexts/useDependencies";
import { exportData } from "../../domain/usecases/exportData";
import { previewImport } from "../../domain/usecases/previewImport";
import { importData } from "../../domain/usecases/importData";
import { listWorks } from "../../domain/usecases/listWorks";
import { listTags } from "../../domain/usecases/listTags";
import type { ImportPreviewResult } from "../../domain/usecases/previewImport";

export function SettingsPage() {
  const { workRepository, tagRepository, serializer } = useDependencies();
  const [importPreview, setImportPreview] = useState<ImportPreviewResult | null>(null);
  const [pendingJson, setPendingJson] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const json = await exportData(workRepository, tagRepository, serializer);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sparkling-journey-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportPreview(null);
    setPendingJson(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const [currentTags, currentWorks] = await Promise.all([
        listTags(tagRepository),
        listWorks(workRepository),
      ]);
      const preview = previewImport(text, currentTags, currentWorks, serializer);
      setPendingJson(text);
      setImportPreview(preview);
    } catch (err) {
      setImportError((err as Error).message);
    }
    e.target.value = "";
  };

  const handleImportConfirm = async () => {
    if (!pendingJson) return;
    try {
      await importData(pendingJson, workRepository, tagRepository, serializer);
      setPendingJson(null);
      setImportPreview(null);
      window.location.reload();
    } catch (err) {
      setImportError((err as Error).message);
    }
  };

  const handleImportCancel = () => {
    setPendingJson(null);
    setImportPreview(null);
    setImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const hasOverrides =
    importPreview &&
    (importPreview.willOverrideTags.length > 0 || importPreview.willOverrideWorks.length > 0);

  return (
    <div>
      <h1 className="mt-0">Settings</h1>
      <section className="mb-6">
        <h2>エクスポート</h2>
        <p>現在のデータを JSON ファイルとしてダウンロードします。</p>
        <div className="mt-3">
          <button type="button" onClick={handleExport}>
            エクスポート
          </button>
        </div>
      </section>
      <section>
        <h2>インポート</h2>
        <p>JSON ファイルを選択すると、内容をプレビューし、上書きがある場合は確認してから反映します。</p>
        <div className="mt-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
          />
        </div>
        {importError && (
          <p className="text-red-400 mt-2">{importError}</p>
        )}
        {importPreview && pendingJson && (
          <div className="mt-4 p-4 border border-white/30 rounded-lg">
            <h3>プレビュー</h3>
            <p>
              新規追加: タグ {importPreview.willCreateTags.length} 件、作品 {importPreview.willCreateWorks.length} 件
            </p>
            {hasOverrides && (
              <p className="text-yellow-400">
                上書き: タグ {importPreview.willOverrideTags.length} 件、作品 {importPreview.willOverrideWorks.length} 件
                （既存の同じ ID のデータが置き換えられます）
              </p>
            )}
            {importPreview.willOverrideTags.length > 0 && (
              <details className="mt-2">
                <summary>上書きされるタグ</summary>
                <ul className="mt-1 ml-4 p-0">
                  {importPreview.willOverrideTags.slice(0, 10).map((t) => (
                    <li key={t.uuid}>{t.name}</li>
                  ))}
                  {importPreview.willOverrideTags.length > 10 && (
                    <li>…他 {importPreview.willOverrideTags.length - 10} 件</li>
                  )}
                </ul>
              </details>
            )}
            {importPreview.willOverrideWorks.length > 0 && (
              <details className="mt-2">
                <summary>上書きされる作品</summary>
                <ul className="mt-1 ml-4 p-0">
                  {importPreview.willOverrideWorks.slice(0, 10).map((w) => (
                    <li key={w.uuid}>{w.title}</li>
                  ))}
                  {importPreview.willOverrideWorks.length > 10 && (
                    <li>…他 {importPreview.willOverrideWorks.length - 10} 件</li>
                  )}
                </ul>
              </details>
            )}
            <p className="mt-4 flex gap-3 flex-wrap">
              <button type="button" onClick={handleImportConfirm}>
                インポートを実行
              </button>
              <button type="button" onClick={handleImportCancel}>
                キャンセル
              </button>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
