import type {
  ActivityDiagramModel,
  ActivityNode,
  ActivityNodeKind,
  Swimlane,
} from './activityTypes';

const newId = () => crypto.randomUUID();

const cleanLabel = (value: string) =>
  value
    .trim()
    .replace(/^"+|"+$/g, '')
    .replace(/#quot;/g, '"');

const inferKind = (shape: string, label: string): ActivityNodeKind => {
  const normalizedLabel = label.toLowerCase();

  if (normalizedLabel.includes('fork')) {
    return 'fork';
  }

  if (normalizedLabel.includes('join')) {
    return 'join';
  }

  if (shape === 'circle') {
    return normalizedLabel.includes('end') ? 'end' : 'start';
  }

  if (shape === 'diamond') {
    return normalizedLabel.includes('loop') || normalizedLabel.includes('retry')
      ? 'loop'
      : 'decision';
  }

  if (shape === 'hex') {
    return 'merge';
  }

  return 'action';
};

const ensureNode = (
  nodesById: Map<string, ActivityNode>,
  id: string,
  previousById: Map<string, ActivityNode>,
  laneId = '',
) => {
  const existing = nodesById.get(id);
  if (existing) {
    return existing;
  }

  const previous = previousById.get(id);
  const node: ActivityNode = previous
    ? { ...previous, laneId: laneId || previous.laneId }
    : {
        id,
        label: id,
        kind: 'action',
        laneId,
      };

  nodesById.set(id, node);
  return node;
};

export const parseActivityMermaidToModel = (
  code: string,
  previousModel?: ActivityDiagramModel,
): ActivityDiagramModel => {
  const previousById = new Map(
    previousModel?.nodes.map((node) => [node.id, node]) ?? [],
  );
  const swimlanes: Swimlane[] = [];
  const nodesById = new Map<string, ActivityNode>();
  const transitions: ActivityDiagramModel['transitions'] = [];
  let activeLaneId = '';

  code.split('\n').forEach((rawLine) => {
    const trimmedLine = rawLine.trim();

    if (
      !trimmedLine ||
      /^flowchart\b/i.test(trimmedLine) ||
      /^graph\b/i.test(trimmedLine) ||
      /^direction\b/i.test(trimmedLine) ||
      /^style\b/i.test(trimmedLine)
    ) {
      return;
    }

    const subgraphMatch =
      trimmedLine.match(/^subgraph\s+([^\[\s]+)(?:\["(.+)"\])?$/i) ??
      trimmedLine.match(/^subgraph\s+"?(.+?)"?$/i);
    if (subgraphMatch) {
      activeLaneId = subgraphMatch[1];
      swimlanes.push({
        id: activeLaneId,
        name: cleanLabel(subgraphMatch[2] || activeLaneId),
      });
      return;
    }

    if (/^end$/i.test(trimmedLine)) {
      activeLaneId = '';
      return;
    }

    const transitionMatch = trimmedLine.match(
      /^(\S+)\s+[-.=]+>\s*(?:\|(.+?)\|\s*)?(\S+)$/i,
    );
    if (transitionMatch) {
      ensureNode(nodesById, transitionMatch[1], previousById);
      ensureNode(nodesById, transitionMatch[3], previousById);
      transitions.push({
        id: newId(),
        from: transitionMatch[1],
        to: transitionMatch[3],
        label: cleanLabel(transitionMatch[2] || ''),
      });
      return;
    }

    const nodeMatch =
      trimmedLine.match(/^(\S+)\(\["(.+)"\]\)$/) ??
      trimmedLine.match(/^(\S+)\(\(\("(.+)"\)\)\)$/) ??
      trimmedLine.match(/^(\S+)\{\{"(.+)"\}\}$/) ??
      trimmedLine.match(/^(\S+)\{\{(.+)\}\}$/) ??
      trimmedLine.match(/^(\S+)\{"(.+)"\}$/) ??
      trimmedLine.match(/^(\S+)\["(.+)"\]$/);

    if (nodeMatch) {
      const shape = trimmedLine.includes('([') || trimmedLine.includes('(((')
        ? 'circle'
        : trimmedLine.includes('{{')
          ? 'hex'
          : trimmedLine.includes('{')
            ? 'diamond'
            : 'rect';
      const label = cleanLabel(nodeMatch[2]);
      nodesById.set(nodeMatch[1], {
        id: nodeMatch[1],
        label,
        kind: inferKind(shape, label),
        laneId: activeLaneId,
      });
    }
  });

  return {
    swimlanes,
    nodes: Array.from(nodesById.values()),
    transitions,
  };
};
