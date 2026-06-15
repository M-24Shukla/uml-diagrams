import type {
  StateMachineModel,
  StateNode,
  StateNodeKind,
} from './stateMachineTypes';

export const stateNodeKindLabels: Record<StateNodeKind, string> = {
  state: 'State',
  start: 'Start',
  end: 'End',
  choice: 'Choice',
  fork: 'Fork',
  join: 'Join',
};

const line = (depth: number, value: string) => `${'    '.repeat(depth)}${value}`;

export const toStateMermaidId = (value: string) =>
  value
    .trim()
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/^([^A-Za-z_])/, '_$1') || 'state';

const escapeLabel = (value: string) => value.replace(/"/g, '#quot;');

const renderStateDeclaration = (state: StateNode, depth: number) => {
  const id = toStateMermaidId(state.id);
  const name = escapeLabel(state.name || stateNodeKindLabels[state.kind]);

  if (state.kind === 'start' || state.kind === 'end') {
    return [];
  }

  if (state.kind === 'state') {
    return [line(depth, `state "${name}" as ${id}`)];
  }

  return [line(depth, `state ${id} <<${state.kind}>>`)];
};

const renderTransitionEndpoint = (state: StateNode | undefined, fallback: string) => {
  if (!state) {
    return toStateMermaidId(fallback);
  }

  if (state.kind === 'start' || state.kind === 'end') {
    return '[*]';
  }

  return toStateMermaidId(state.id);
};

export const generateStateMachineMermaid = (model: StateMachineModel) => {
  const statesById = new Map(model.states.map((state) => [state.id, state]));
  const childrenByParent = new Map<string, StateNode[]>();

  model.states.forEach((state) => {
    childrenByParent.set(state.parentId, [
      ...(childrenByParent.get(state.parentId) ?? []),
      state,
    ]);
  });

  const topLevelStates = childrenByParent.get('') ?? [];
  const nestedParentIds = new Set(
    model.states
      .filter((state) => state.kind === 'state' && childrenByParent.has(state.id))
      .map((state) => state.id),
  );

  const declarationLines = topLevelStates.flatMap((state) => {
    const children = childrenByParent.get(state.id) ?? [];

    if (state.kind === 'state' && children.length > 0) {
      return [
        line(1, `state "${escapeLabel(state.name)}" as ${toStateMermaidId(state.id)} {`),
        ...children.flatMap((child) => renderStateDeclaration(child, 2)),
        line(1, '}'),
      ];
    }

    return renderStateDeclaration(state, 1);
  });

  const nestedDeclarations = model.states
    .filter((state) => state.parentId && !nestedParentIds.has(state.parentId))
    .flatMap((state) => renderStateDeclaration(state, 1));

  const transitionLines = model.transitions
    .filter((transition) => transition.from && transition.to && transition.from !== transition.to)
    .map((transition) => {
      const from = renderTransitionEndpoint(statesById.get(transition.from), transition.from);
      const to = renderTransitionEndpoint(statesById.get(transition.to), transition.to);
      const label = transition.label.trim()
        ? ` : ${escapeLabel(transition.label.trim())}`
        : '';

      return line(1, `${from} --> ${to}${label}`);
    });

  return [
    'stateDiagram-v2',
    ...declarationLines,
    ...nestedDeclarations,
    ...(transitionLines.length ? ['', ...transitionLines] : []),
  ].join('\n');
};
