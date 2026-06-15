import type {
  ActivityDiagramModel,
  ActivityNode,
  ActivityNodeKind,
} from './activityTypes';

export const activityNodeKindLabels: Record<ActivityNodeKind, string> = {
  start: 'Start',
  end: 'End',
  action: 'Action',
  decision: 'Decision',
  merge: 'Merge',
  fork: 'Fork',
  join: 'Join',
  loop: 'Loop',
};

const line = (depth: number, value: string) => `${'    '.repeat(depth)}${value}`;

export const toMermaidId = (value: string) =>
  value
    .trim()
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/^([^A-Za-z_])/, '_$1') || 'node';

const escapeLabel = (value: string) => value.replace(/"/g, '#quot;');

const renderNode = (node: ActivityNode, depth: number) => {
  const id = toMermaidId(node.id);
  const label = escapeLabel(node.label || activityNodeKindLabels[node.kind]);

  if (node.kind === 'start') {
    return line(depth, `${id}(["${label}"])`);
  }

  if (node.kind === 'end') {
    return line(depth, `${id}(["${label}"])`);
  }

  if (node.kind === 'decision' || node.kind === 'loop') {
    return line(depth, `${id}{"${label}"}`);
  }

  if (node.kind === 'merge') {
    return line(depth, `${id}{{"${label}"}}`);
  }

  if (node.kind === 'fork' || node.kind === 'join') {
    return line(depth, `${id}{{${label}}}`);
  }

  return line(depth, `${id}["${label}"]`);
};

const renderTransitionLabel = (label: string) =>
  label.trim() ? `|${escapeLabel(label.trim())}|` : '';

export const generateActivityMermaid = (model: ActivityDiagramModel) => {
  const laneIds = new Set(model.swimlanes.map((lane) => lane.id));
  const nodesByLane = new Map<string, ActivityNode[]>();
  const ungroupedNodes: ActivityNode[] = [];

  model.nodes.forEach((node) => {
    if (!node.laneId || !laneIds.has(node.laneId)) {
      ungroupedNodes.push(node);
      return;
    }

    nodesByLane.set(node.laneId, [...(nodesByLane.get(node.laneId) ?? []), node]);
  });

  const laneLines = model.swimlanes.flatMap((lane) => {
    const nodes = nodesByLane.get(lane.id) ?? [];
    if (nodes.length === 0) {
      return [];
    }

    return [
      line(1, `subgraph ${toMermaidId(lane.name)}["${escapeLabel(lane.name)}"]`),
      line(2, 'direction TB'),
      ...nodes.map((node) => renderNode(node, 2)),
      line(1, 'end'),
    ];
  });

  const transitionLines = model.transitions
    .filter((transition) => transition.from && transition.to && transition.from !== transition.to)
    .map((transition) =>
      line(
        1,
        `${toMermaidId(transition.from)} -->${renderTransitionLabel(transition.label)} ${toMermaidId(
          transition.to,
        )}`,
      ),
    );

  const barStyleLines = model.nodes
    .filter((node) => node.kind === 'fork' || node.kind === 'join')
    .map((node) =>
      line(
        1,
        `style ${toMermaidId(node.id)} fill:#111827,stroke:#111827,color:#ffffff`,
      ),
    );

  return [
    'flowchart TD',
    ...laneLines,
    ...(ungroupedNodes.length ? ungroupedNodes.map((node) => renderNode(node, 1)) : []),
    ...(transitionLines.length ? ['', ...transitionLines] : []),
    ...(barStyleLines.length ? ['', ...barStyleLines] : []),
  ].join('\n');
};
