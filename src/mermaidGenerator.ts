import type {
  ArrowKind,
  Branch,
  DiagramModel,
  MessageStep,
  Participant,
  Step,
} from './types';

const arrowByKind: Record<ArrowKind, string> = {
  sync: '->>',
  response: '-->>',
  async: '-)',
  create: '->>',
  destroy: '-x',
};

const nameFor = (participants: Participant[], id: string) =>
  participants.find((participant) => participant.id === id)?.name.trim() || id;

const line = (depth: number, value: string) => `${'    '.repeat(depth)}${value}`;

const renderMessage = (
  step: MessageStep,
  participants: Participant[],
  depth: number,
) => {
  const from = nameFor(participants, step.from);
  const to = nameFor(participants, step.to);
  const messageLines: string[] = [];

  if (step.arrow === 'create') {
    const toParticipant = participants.find((participant) => participant.id === step.to);
    messageLines.push(line(depth, `create ${toParticipant?.type ?? 'participant'} ${to}`));
  }

  if (step.arrow === 'destroy') {
    messageLines.push(line(depth, `destroy ${to}`));
  }

  messageLines.push(
    line(depth, `${from}${arrowByKind[step.arrow]}${to}: ${step.label || 'message'}`),
  );

  return messageLines;
};

const renderBranchSteps = (
  branch: Branch,
  participants: Participant[],
  depth: number,
) => branch.steps.flatMap((step) => renderStep(step, participants, depth));

const renderStep = (
  step: Step,
  participants: Participant[],
  depth: number,
): string[] => {
  if (step.kind === 'message') {
    return renderMessage(step, participants, depth);
  }

  if (step.kind === 'loop' || step.kind === 'opt') {
    return [
      line(depth, `${step.kind} ${step.label || 'condition'}`),
      ...step.steps.flatMap((childStep) => renderStep(childStep, participants, depth + 1)),
      line(depth, 'end'),
    ];
  }

  if (step.kind === 'alt') {
    const [firstBranch, ...remainingBranches] = step.branches;
    if (!firstBranch) {
      return [];
    }

    return [
      line(depth, `alt ${firstBranch.label || 'condition'}`),
      ...renderBranchSteps(firstBranch, participants, depth + 1),
      ...remainingBranches.flatMap((branch) => [
        line(depth, `else ${branch.label || 'condition'}`),
        ...renderBranchSteps(branch, participants, depth + 1),
      ]),
      line(depth, 'end'),
    ];
  }

  const [firstBranch, ...remainingBranches] = step.branches;
  if (!firstBranch) {
    return [];
  }

  return [
    line(depth, `par ${firstBranch.label || 'branch'}`),
    ...renderBranchSteps(firstBranch, participants, depth + 1),
    ...remainingBranches.flatMap((branch) => [
      line(depth, `and ${branch.label || 'branch'}`),
      ...renderBranchSteps(branch, participants, depth + 1),
    ]),
    line(depth, 'end'),
  ];
};

const collectCreatedParticipantIds = (steps: Step[]): Set<string> => {
  const createdIds = new Set<string>();

  const visit = (step: Step) => {
    if (step.kind === 'message') {
      if (step.arrow === 'create') {
        createdIds.add(step.to);
      }
      return;
    }

    if (step.kind === 'loop' || step.kind === 'opt') {
      step.steps.forEach(visit);
      return;
    }

    step.branches.forEach((branch) => branch.steps.forEach(visit));
  };

  steps.forEach(visit);
  return createdIds;
};

export const generateMermaid = (model: DiagramModel) => {
  const createdParticipantIds = collectCreatedParticipantIds(model.steps);
  const participantLines = model.participants
    .filter(
      (participant) =>
        participant.name.trim() && !createdParticipantIds.has(participant.id),
    )
    .map((participant) =>
      line(1, `${participant.type ?? 'participant'} ${participant.name.trim()}`),
    );

  return [
    'sequenceDiagram',
    line(1, 'autonumber'),
    ...participantLines,
    '',
    ...model.steps.flatMap((step) => renderStep(step, model.participants, 1)),
  ].join('\n');
};
