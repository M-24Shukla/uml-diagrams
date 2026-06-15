import type {
  StateMachineModel,
  StateNode,
  StateNodeKind,
} from './stateMachineTypes';

const newId = () => crypto.randomUUID();

const cleanLabel = (value: string) =>
  value
    .trim()
    .replace(/^"+|"+$/g, '')
    .replace(/#quot;/g, '"');

const inferKind = (stereotype = ''): StateNodeKind => {
  if (stereotype === 'choice') {
    return 'choice';
  }

  if (stereotype === 'fork') {
    return 'fork';
  }

  if (stereotype === 'join') {
    return 'join';
  }

  return 'state';
};

const ensureState = (
  statesById: Map<string, StateNode>,
  id: string,
  previousById: Map<string, StateNode>,
  kind: StateNodeKind = 'state',
) => {
  const existing = statesById.get(id);
  if (existing) {
    return existing;
  }

  const previous = previousById.get(id);
  const state: StateNode = previous
    ? { ...previous }
    : {
        id,
        name: id,
        kind,
        parentId: '',
      };

  statesById.set(id, state);
  return state;
};

export const parseStateMachineMermaidToModel = (
  code: string,
  previousModel?: StateMachineModel,
): StateMachineModel => {
  const previousById = new Map(
    previousModel?.states.map((state) => [state.id, state]) ?? [],
  );
  const statesById = new Map<string, StateNode>();
  const transitions: StateMachineModel['transitions'] = [];
  let startId = previousModel?.states.find((state) => state.kind === 'start')?.id ?? 'start';
  let endId = previousModel?.states.find((state) => state.kind === 'end')?.id ?? 'end';
  let lastEndpointWasStart = false;

  code.split('\n').forEach((rawLine) => {
    const trimmedLine = rawLine.trim();

    if (
      !trimmedLine ||
      /^stateDiagram(?:-v2)?\b/i.test(trimmedLine) ||
      trimmedLine === '{' ||
      trimmedLine === '}'
    ) {
      return;
    }

    const stateWithAliasMatch = trimmedLine.match(/^state\s+"(.+)"\s+as\s+(\S+)$/i);
    if (stateWithAliasMatch) {
      statesById.set(stateWithAliasMatch[2], {
        id: stateWithAliasMatch[2],
        name: cleanLabel(stateWithAliasMatch[1]),
        kind: 'state',
        parentId: '',
      });
      return;
    }

    const stateWithStereotypeMatch = trimmedLine.match(
      /^state\s+(\S+)\s+<<(choice|fork|join)>>$/i,
    );
    if (stateWithStereotypeMatch) {
      statesById.set(stateWithStereotypeMatch[1], {
        id: stateWithStereotypeMatch[1],
        name: stateWithStereotypeMatch[1],
        kind: inferKind(stateWithStereotypeMatch[2].toLowerCase()),
        parentId: '',
      });
      return;
    }

    const transitionMatch = trimmedLine.match(/^(\S+)\s+-->\s+(\S+)(?:\s*:\s*(.+))?$/);
    if (transitionMatch) {
      const rawFrom = transitionMatch[1];
      const rawTo = transitionMatch[2];
      const fromIsEndpoint = rawFrom === '[*]';
      const toIsEndpoint = rawTo === '[*]';

      if (fromIsEndpoint && !statesById.has(startId)) {
        statesById.set(startId, {
          id: startId,
          name: 'Start',
          kind: 'start',
          parentId: '',
        });
      }

      if (toIsEndpoint && !statesById.has(endId)) {
        statesById.set(endId, {
          id: endId,
          name: 'End',
          kind: 'end',
          parentId: '',
        });
      }

      const from = fromIsEndpoint ? startId : rawFrom;
      const to = toIsEndpoint ? endId : rawTo;
      ensureState(statesById, from, previousById, fromIsEndpoint ? 'start' : 'state');
      ensureState(statesById, to, previousById, toIsEndpoint ? 'end' : 'state');

      transitions.push({
        id: newId(),
        from,
        to,
        label: cleanLabel(transitionMatch[3] || ''),
      });
      lastEndpointWasStart = fromIsEndpoint;
      return;
    }

    if (trimmedLine === '[*]') {
      const id = lastEndpointWasStart ? endId : startId;
      const kind: StateNodeKind = lastEndpointWasStart ? 'end' : 'start';
      statesById.set(id, {
        id,
        name: kind === 'start' ? 'Start' : 'End',
        kind,
        parentId: '',
      });
    }
  });

  return {
    states: Array.from(statesById.values()),
    transitions,
  };
};
