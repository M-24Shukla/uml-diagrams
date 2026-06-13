import type {
  ArrowKind,
  Branch,
  DiagramModel,
  Participant,
  Step,
} from './types';

const participantColors = [
  '#e0f2fe',
  '#ede9fe',
  '#dcfce7',
  '#fef3c7',
  '#fce7f3',
  '#fee2e2',
  '#ccfbf1',
];

type ParseContext =
  | { type: 'root'; steps: Step[] }
  | { type: 'loop' | 'opt'; step: Extract<Step, { kind: 'loop' | 'opt' }> }
  | { type: 'alt' | 'par'; step: Extract<Step, { kind: 'alt' | 'par' }> };

const slugify = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'participant';

const uniqueId = (base: string, usedIds: Set<string>) => {
  let candidate = base;
  let index = 2;

  while (usedIds.has(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  usedIds.add(candidate);
  return candidate;
};

const makeStepId = (kind: string, usedIds: Set<string>) =>
  uniqueId(`${kind}-${usedIds.size + 1}`, usedIds);

const branch = (label: string, usedIds: Set<string>): Branch => ({
  id: makeStepId('branch', usedIds),
  label,
  steps: [],
});

const currentSteps = (context: ParseContext) => {
  if (context.type === 'root') {
    return context.steps;
  }

  if (context.type === 'loop' || context.type === 'opt') {
    return context.step.steps;
  }

  if (context.type === 'alt' || context.type === 'par') {
    return context.step.branches.at(-1)?.steps ?? [];
  }

  return [];
};

const normalizeName = (value: string) =>
  value
    .trim()
    .replace(/^"|"$/g, '')
    .replace(/^'|'$/g, '');

const arrowPatterns: Array<[RegExp, ArrowKind]> = [
  [/^(.+?)-->>(.+?):\s*(.*)$/, 'response'],
  [/^(.+?)-\)(.+?):\s*(.*)$/, 'async'],
  [/^(.+?)-x(.+?):\s*(.*)$/, 'destroy'],
  [/^(.+?)->>(.+?):\s*(.*)$/, 'sync'],
  [/^(.+?)->(.+?):\s*(.*)$/, 'sync'],
];

export const parseMermaidToModel = (
  code: string,
  previousModel?: DiagramModel,
): DiagramModel => {
  const usedIds = new Set<string>();
  const stepIds = new Set<string>();
  const participantsByName = new Map<string, Participant>();
  const previousByName = new Map(
    previousModel?.participants.map((participant) => [
      participant.name.trim(),
      participant,
    ]) ?? [],
  );

  const ensureParticipant = (
    name: string,
    type: Participant['type'] = 'participant',
  ) => {
    const normalizedName = normalizeName(name);
    const existing = participantsByName.get(normalizedName);

    if (existing) {
      return existing;
    }

    const previous = previousByName.get(normalizedName);
    const participant: Participant = previous
      ? previous
      : {
          id: uniqueId(slugify(normalizedName), usedIds),
          name: normalizedName,
          color: participantColors[participantsByName.size % participantColors.length],
          type,
        };

    usedIds.add(participant.id);
    participantsByName.set(normalizedName, { ...participant, type: participant.type || type });
    return participant;
  };

  const root: ParseContext = { type: 'root', steps: [] };
  const stack: ParseContext[] = [root];
  let pendingCreateTarget: string | null = null;
  const lines = code.split('\n');

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    const context = stack.at(-1) ?? root;

    if (!line || line === 'sequenceDiagram' || line === 'autonumber') {
      return;
    }

    const participantMatch = line.match(/^(participant|actor)\s+(.+?)(?:\s+as\s+(.+))?$/i);
    if (participantMatch) {
      ensureParticipant(
        participantMatch[3] || participantMatch[2],
        participantMatch[1].toLowerCase() === 'actor' ? 'actor' : 'participant',
      );
      return;
    }

    const createMatch = line.match(/^create\s+(?:participant|actor)\s+(.+)$/i);
    if (createMatch) {
      pendingCreateTarget = normalizeName(createMatch[1]);
      ensureParticipant(pendingCreateTarget);
      return;
    }

    const destroyMatch = line.match(/^destroy\s+(.+)$/i);
    if (destroyMatch) {
      ensureParticipant(destroyMatch[1]);
      return;
    }

    const altMatch = line.match(/^alt\s*(.*)$/i);
    if (altMatch) {
      const step: Extract<Step, { kind: 'alt' }> = {
        id: makeStepId('alt', stepIds),
        kind: 'alt',
        branches: [branch(altMatch[1] || 'condition', stepIds)],
      };
      currentSteps(context).push(step);
      stack.push({ type: 'alt', step });
      return;
    }

    const elseMatch = line.match(/^else\s*(.*)$/i);
    if (elseMatch && context.type === 'alt') {
      context.step.branches.push(branch(elseMatch[1] || 'condition', stepIds));
      return;
    }

    const parMatch = line.match(/^par\s*(.*)$/i);
    if (parMatch) {
      const step: Extract<Step, { kind: 'par' }> = {
        id: makeStepId('par', stepIds),
        kind: 'par',
        branches: [branch(parMatch[1] || 'branch', stepIds)],
      };
      currentSteps(context).push(step);
      stack.push({ type: 'par', step });
      return;
    }

    const andMatch = line.match(/^and\s*(.*)$/i);
    if (andMatch && context.type === 'par') {
      context.step.branches.push(branch(andMatch[1] || 'branch', stepIds));
      return;
    }

    const loopMatch = line.match(/^loop\s*(.*)$/i);
    if (loopMatch) {
      const step: Extract<Step, { kind: 'loop' }> = {
        id: makeStepId('loop', stepIds),
        kind: 'loop',
        label: loopMatch[1] || 'condition',
        steps: [],
      };
      currentSteps(context).push(step);
      stack.push({ type: 'loop', step });
      return;
    }

    const optMatch = line.match(/^opt\s*(.*)$/i);
    if (optMatch) {
      const step: Extract<Step, { kind: 'opt' }> = {
        id: makeStepId('opt', stepIds),
        kind: 'opt',
        label: optMatch[1] || 'condition',
        steps: [],
      };
      currentSteps(context).push(step);
      stack.push({ type: 'opt', step });
      return;
    }

    if (/^end$/i.test(line)) {
      if (stack.length > 1) {
        stack.pop();
      }
      return;
    }

    for (const [pattern, arrow] of arrowPatterns) {
      const messageMatch = line.match(pattern);
      if (!messageMatch) {
        continue;
      }

      const from = ensureParticipant(messageMatch[1]);
      const to = ensureParticipant(messageMatch[2]);
      const effectiveArrow =
        pendingCreateTarget === to.name ? 'create' : arrow;

      currentSteps(context).push({
        id: makeStepId('message', stepIds),
        kind: 'message',
        from: from.id,
        to: to.id,
        arrow: effectiveArrow,
        label: messageMatch[3] || 'message',
      });

      pendingCreateTarget = null;
      return;
    }
  });

  return {
    participants: Array.from(participantsByName.values()),
    steps: root.steps,
  };
};
