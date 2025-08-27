import { Link } from "@mui/material";
import React from "react";

interface MarkdownLinkRendererProps {
  text: string;
}

function renderMarkdownInline(text: string): (string | React.ReactNode)[] {
  const parts: (string | React.ReactNode)[] = [];
  const regex = /(?:\*(.*?)\*|_(.*?)_)/g; // matches *italic* or _italic_
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<em key={match.index}>{match[1] || match[2]}</em>);
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export const MarkdownLinkRenderer: React.FC<MarkdownLinkRendererProps> = ({
  text,
}) => {
  const regex = /\[([^\]]+)\]\((\S+)(?:\s+"([^"]+)")?\)/g;
  const matches = Array.from(text.matchAll(regex));
  const result: (string | React.ReactNode)[] = [];
  let lastIndex = 0;

  matches.forEach((match) => {
    const [fullMatch, linkText, linkUrl] = match;
    const matchIndex = match.index!;

    // Add text before the link
    if (matchIndex > lastIndex) {
      result.push(text.substring(lastIndex, matchIndex));
    }

    // Render link text with inline markdown (italics)
    result.push(
      <Link key={matchIndex} href={linkUrl}>
        {renderMarkdownInline(linkText)}
      </Link>,
    );

    lastIndex = matchIndex + fullMatch.length;
  });

  // Add any remaining text after the last link
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }

  return (
    <>
      {result.map((item, index) => (
        <React.Fragment key={index}>{item}</React.Fragment>
      ))}
    </>
  );
};

