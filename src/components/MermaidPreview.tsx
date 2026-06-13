import { useEffect, useMemo, useState } from 'react';
import mermaid from 'mermaid';
import type { Participant, ThemeMode } from '../types';

type MermaidPreviewProps = {
  code: string;
  participants?: Participant[];
  theme: ThemeMode;
};

let renderCounter = 0;

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

export default function MermaidPreview({
  code,
  participants = [],
  theme,
}: MermaidPreviewProps) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const debouncedCode = useDebouncedValue(code, 320);

  const mermaidTheme = useMemo(() => (theme === 'dark' ? 'dark' : 'default'), [theme]);
  const participantColorSignature = useMemo(
    () =>
      participants
        .map((participant) => `${participant.id}:${participant.name}:${participant.color}`)
        .join('|'),
    [participants],
  );

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: mermaidTheme,
          securityLevel: 'strict',
          sequence: {
            showSequenceNumbers: false,
          },
        });

        await mermaid.parse(debouncedCode);

        const id = `sequence-preview-${renderCounter++}`;
        const result = await mermaid.render(id, debouncedCode);

        if (!cancelled) {
          setSvg(applyParticipantColors(result.svg, participants));
          setError('');
        }
      } catch (renderError) {
        if (!cancelled) {
          setError(getErrorMessage(renderError));
        }
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [debouncedCode, mermaidTheme, participantColorSignature]);

  if (error) {
    return (
      <div className="preview-scroll">
        <div className="syntax-error" role="alert">
          <strong>Mermaid syntax error</strong>
          <pre>{error}</pre>
        </div>
      </div>
    );
  }

  return (
    <div
      className="preview-scroll"
      dangerouslySetInnerHTML={{ __html: svg }}
      aria-label="Rendered Mermaid sequence diagram"
    />
  );
}

const applyParticipantColors = (svg: string, participants: Participant[]) => {
  if (!participants.some((participant) => participant.color)) {
    return svg;
  }

  const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const svgElement = document.querySelector('svg');

  if (!svgElement) {
    return svg;
  }

  participants.forEach((participant) => {
    const name = participant.name.trim();
    const color = participant.color || '#ede9fe';

    if (!name) {
      return;
    }

    const textNodes = Array.from(svgElement.querySelectorAll('text')).filter(
      (textNode) => textNode.textContent?.trim() === name,
    );

    textNodes.forEach((textNode) => {
      const actorGroup = findParticipantShapeGroup(textNode);
      const actorShapes = actorGroup
        ? Array.from(actorGroup.querySelectorAll<SVGElement>('rect, polygon, path, circle'))
        : [];

      if (actorShapes.length === 0) {
        return;
      }

      actorShapes.forEach((shape) => {
        shape.setAttribute('fill', color);
        shape.setAttribute('style', mergeStyle(shape.getAttribute('style'), {
          fill: color,
          stroke: darkenHex(color),
        }));
        shape.setAttribute('stroke', darkenHex(color));
      });
    });
  });

  return new XMLSerializer().serializeToString(svgElement);
};

const findParticipantShapeGroup = (textNode: SVGTextElement) => {
  let current: Element | null = textNode.closest('g');

  while (current) {
    if (current.querySelector('rect, polygon, path, circle')) {
      return current;
    }

    const previousSibling = current.previousElementSibling;
    if (previousSibling?.querySelector('rect, polygon, path, circle')) {
      return previousSibling;
    }

    const nextSibling = current.nextElementSibling;
    if (nextSibling?.querySelector('rect, polygon, path, circle')) {
      return nextSibling;
    }

    current = current.parentElement?.closest('g') ?? null;
  }

  return null;
};

const mergeStyle = (
  currentStyle: string | null,
  updates: Record<string, string>,
) => {
  const declarations = new Map<string, string>();

  currentStyle
    ?.split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const [property, value] = item.split(':');
      if (property && value) {
        declarations.set(property.trim(), value.trim());
      }
    });

  Object.entries(updates).forEach(([property, value]) => {
    declarations.set(property, value);
  });

  return Array.from(declarations.entries())
    .map(([property, value]) => `${property}: ${value}`)
    .join('; ');
};

const darkenHex = (hex: string) => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    return '#64748b';
  }

  const channels = normalized.match(/.{2}/g);
  if (!channels) {
    return '#64748b';
  }

  return `#${channels
    .map((channel) =>
      Math.max(0, Math.round(Number.parseInt(channel, 16) * 0.72))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
};

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
}
