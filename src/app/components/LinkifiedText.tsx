import type { ReactNode } from "react";

const URL_REGEX = /https?:\/\/[^\s]+/g;

export function LinkifiedText({ text }: { text: string }) {
  const segments: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(URL_REGEX.source, "g");
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(text.slice(lastIndex, match.index));
    }
    const url = match[0];
    segments.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="underline"
      >
        {url}
      </a>,
    );
    lastIndex = match.index + url.length;
  }

  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex));
  }

  return <>{segments}</>;
}
