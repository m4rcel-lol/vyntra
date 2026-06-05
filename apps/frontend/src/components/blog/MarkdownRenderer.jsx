import { cn } from '@/lib/utils';

const safeHref = (href) => {
  const value = String(href || '').trim();
  if (/^(https?:|mailto:)/i.test(value)) return value;
  return '#';
};

const inlinePattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;

function renderInline(text, keyPrefix = 'inline') {
  const parts = [];
  let lastIndex = 0;
  const source = String(text || '');
  for (const match of source.matchAll(inlinePattern)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push(source.slice(lastIndex, index));
    }

    const key = `${keyPrefix}-${index}`;
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={key}>{renderInline(token.slice(2, -2), key)}</strong>);
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith('[')) {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        parts.push(
          <a key={key} href={safeHref(link[2])} target="_blank" rel="noopener noreferrer">
            {renderInline(link[1], key)}
          </a>
        );
      } else {
        parts.push(token);
      }
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={key}>{renderInline(token.slice(1, -1), key)}</em>);
    } else {
      parts.push(token);
    }
    lastIndex = index + token.length;
  }
  if (lastIndex < source.length) {
    parts.push(source.slice(lastIndex));
  }
  return parts;
}

export function MarkdownRenderer({ markdown = '', className }) {
  const blocks = parseBlocks(markdown);
  return (
    <article className={cn('blog-markdown', className)}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </article>
  );
}

function renderBlock(block, index) {
  const key = `block-${index}`;
  switch (block.type) {
    case 'heading': {
      const Heading = `h${block.level}`;
      return <Heading key={key}>{renderInline(block.text, key)}</Heading>;
    }
    case 'quote':
      return <blockquote key={key}>{block.lines.map((line, lineIndex) => <p key={`${key}-${lineIndex}`}>{renderInline(line, `${key}-${lineIndex}`)}</p>)}</blockquote>;
    case 'code':
      return (
        <pre key={key}>
          <code>{block.code}</code>
        </pre>
      );
    case 'ul':
      return <ul key={key}>{block.items.map((item, itemIndex) => <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>)}</ul>;
    case 'ol':
      return <ol key={key}>{block.items.map((item, itemIndex) => <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>)}</ol>;
    default:
      return <p key={key}>{renderInline(block.text, key)}</p>;
  }
}

function parseBlocks(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.trim().startsWith('```')) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !(lines[index] ?? '').trim().startsWith('```')) {
        codeLines.push(lines[index] ?? '');
        index += 1;
      }
      index += 1;
      blocks.push({ type: 'code', code: codeLines.join('\n') });
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() });
      index += 1;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quoteLines = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index] ?? '')) {
        quoteLines.push((lines[index] ?? '').replace(/^\s*>\s?/, '').trim());
        index += 1;
      }
      blocks.push({ type: 'quote', lines: quoteLines });
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index] ?? '')) {
        items.push((lines[index] ?? '').replace(/^\s*[-*]\s+/, '').trim());
        index += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index] ?? '')) {
        items.push((lines[index] ?? '').replace(/^\s*\d+\.\s+/, '').trim());
        index += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    const paragraph = [];
    while (
      index < lines.length
      && (lines[index] ?? '').trim()
      && !(lines[index] ?? '').trim().startsWith('```')
      && !/^(#{1,3})\s+/.test(lines[index] ?? '')
      && !/^\s*>\s?/.test(lines[index] ?? '')
      && !/^\s*[-*]\s+/.test(lines[index] ?? '')
      && !/^\s*\d+\.\s+/.test(lines[index] ?? '')
    ) {
      paragraph.push((lines[index] ?? '').trim());
      index += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
  }

  return blocks;
}
