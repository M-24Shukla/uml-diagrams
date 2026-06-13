import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import type {
  ArrowKind,
  Branch,
  DiagramModel,
  MessageStep,
  Participant,
  Step,
  StepKind,
} from '../types';

type BuilderPanelProps = {
  model: DiagramModel;
  onChange: (model: DiagramModel) => void;
};

const newId = () => crypto.randomUUID();

const createMessage = (participants: Participant[]): MessageStep => ({
  id: newId(),
  kind: 'message',
  from: participants[0]?.id ?? '',
  to: participants[1]?.id ?? participants[0]?.id ?? '',
  arrow: 'sync',
  label: 'new message',
});

const defaultParticipantColors = [
  '#e0f2fe',
  '#ede9fe',
  '#dcfce7',
  '#fef3c7',
  '#fce7f3',
  '#fee2e2',
  '#ccfbf1',
];

const createBranch = (label: string, participants: Participant[]): Branch => ({
  id: newId(),
  label,
  steps: [createMessage(participants)],
});

const createStep = (kind: StepKind, participants: Participant[]): Step => {
  if (kind === 'message') {
    return createMessage(participants);
  }

  if (kind === 'loop' || kind === 'opt') {
    return {
      id: newId(),
      kind,
      label: kind === 'loop' ? 'condition repeats' : 'optional condition',
      steps: [createMessage(participants)],
    };
  }

  return {
    id: newId(),
    kind,
    branches:
      kind === 'alt'
        ? [
            createBranch('condition A', participants),
            createBranch('condition B', participants),
          ]
        : [
            createBranch('parallel task A', participants),
            createBranch('parallel task B', participants),
          ],
  };
};

export function BuilderPanel({ model, onChange }: BuilderPanelProps) {
  const [focusedStepId, setFocusedStepId] = useState<string | null>(null);
  const [focusedParticipantId, setFocusedParticipantId] = useState<string | null>(null);
  const [isParticipantsCollapsed, setIsParticipantsCollapsed] = useState(false);
  const [isFlowCollapsed, setIsFlowCollapsed] = useState(false);
  const participantRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const sequenceNumbers = useMemo(() => getSequenceNumbers(model.steps), [model.steps]);

  useEffect(() => {
    if (!focusedParticipantId) {
      return;
    }

    const input = participantRefs.current[focusedParticipantId];
    input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input?.focus();
    input?.select();
    setFocusedParticipantId(null);
  }, [focusedParticipantId, model.participants]);

  const updateParticipants = (participants: Participant[]) => {
    onChange({ ...model, participants });
  };

  const updateSteps = (steps: Step[]) => {
    onChange({ ...model, steps });
  };

  const addParticipant = (type: Participant['type']) => {
    const participant = {
      id: newId(),
      name: `${type === 'actor' ? 'Actor' : 'Participant'} ${model.participants.length + 1}`,
      color: defaultParticipantColors[model.participants.length % defaultParticipantColors.length],
      type,
    };
    setFocusedParticipantId(participant.id);
    updateParticipants([...model.participants, participant]);
  };

  const addStep = (kind: StepKind) => {
    const step = createStep(kind, model.participants);
    setFocusedStepId(step.id);
    updateSteps([...model.steps, step]);
  };

  return (
    <div className="builder">
      <section
        className={`builder-section participants-section ${
          isParticipantsCollapsed ? 'is-collapsed' : ''
        }`}
      >
        <div className="section-title">
          <button
            type="button"
            className="section-toggle"
            onClick={() => setIsParticipantsCollapsed((value) => !value)}
            aria-expanded={!isParticipantsCollapsed}
            aria-controls="participants-panel"
          >
            {isParticipantsCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
            <h3>Actors &amp; Participants</h3>
          </button>
          {!isParticipantsCollapsed && (
            <div className="anp-actions">
              <button
                type="button"
                onClick={() => addParticipant('actor')}
                aria-label="Add actor"
              >
                <Plus size={15} />
                Actor
              </button>
              <button
                type="button"
                onClick={() => addParticipant('participant')}
                aria-label="Add participant"
              >
                <Plus size={15} />
                Participant
              </button>
            </div>
          )}
        </div>
        {!isParticipantsCollapsed && (
          <div className="participant-list" id="participants-panel">
            {model.participants.map((participant) => (
              <div className="participant-row" key={participant.id}>
                <input
                  type="color"
                  className="color-input"
                  value={participant.color || '#ede9fe'}
                  onChange={(event) =>
                    updateParticipants(
                      model.participants.map((item) =>
                        item.id === participant.id
                          ? { ...item, color: event.target.value }
                          : item,
                      ),
                    )
                  }
                  aria-label={`Color for ${participant.name}`}
                />
                <select
                  className="participant-type-select"
                  value={participant.type || 'participant'}
                  onChange={(event) =>
                    updateParticipants(
                      model.participants.map((item) =>
                        item.id === participant.id
                          ? {
                              ...item,
                              type: event.target.value as Participant['type'],
                            }
                          : item,
                      ),
                    )
                  }
                  aria-label={`Type for ${participant.name}`}
                >
                  <option value="actor">🧟‍♂️</option>
                  <option value="participant">🫂</option>
                </select>
                <input
                  ref={(node) => {
                    participantRefs.current[participant.id] = node;
                  }}
                  value={participant.name}
                  onChange={(event) =>
                    updateParticipants(
                      model.participants.map((item) =>
                        item.id === participant.id
                          ? { ...item, name: event.target.value }
                          : item,
                      ),
                    )
                  }
                  aria-label={`Actor or participant ${participant.name}`}
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() =>
                    updateParticipants(
                      model.participants.filter((item) => item.id !== participant.id),
                    )
                  }
                  aria-label={`Remove ${participant.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section
        className={`builder-section flow-section ${
          isFlowCollapsed ? 'is-collapsed' : ''
        }`}
      >
        <div className="section-title">
          <button
            type="button"
            className="section-toggle"
            onClick={() => setIsFlowCollapsed((value) => !value)}
            aria-expanded={!isFlowCollapsed}
            aria-controls="flow-panel"
          >
            {isFlowCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
            <h3>Flow</h3>
          </button>
        </div>
        {!isFlowCollapsed && (
          <>
            <StepList
              focusedStepId={focusedStepId}
              participants={model.participants}
              sequenceNumbers={sequenceNumbers}
              steps={model.steps}
              onFocused={() => setFocusedStepId(null)}
              onFocusStep={setFocusedStepId}
              onChange={updateSteps}
            />
            <div className="flow-action-bar" id="flow-panel">
              <AddStepButtons onAdd={addStep} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}

type AddStepButtonsProps = {
  onAdd: (kind: StepKind) => void;
};

function AddStepButtons({ onAdd }: AddStepButtonsProps) {
  return (
    <div className="add-buttons">
      {(['message', 'alt', 'loop', 'opt', 'par'] as StepKind[]).map((kind) => (
        <button key={kind} type="button" onClick={() => onAdd(kind)}>
          <Plus size={14} />
          {kind}
        </button>
      ))}
    </div>
  );
}

type StepListProps = {
  focusedStepId: string | null;
  onFocused: () => void;
  onFocusStep: (id: string) => void;
  participants: Participant[];
  sequenceNumbers: Map<string, number>;
  steps: Step[];
  onChange: (steps: Step[]) => void;
};

function StepList({
  focusedStepId,
  onFocused,
  onFocusStep,
  participants,
  sequenceNumbers,
  steps,
  onChange,
}: StepListProps) {
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [collapsedStepIds, setCollapsedStepIds] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    if (!focusedStepId || !steps.some((step) => step.id === focusedStepId)) {
      return;
    }

    const card = cardRefs.current[focusedStepId];
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card?.focus({ preventScroll: true });
    onFocused();
  }, [focusedStepId, onFocused, steps]);

  const updateStep = (step: Step) => {
    onChange(steps.map((item) => (item.id === step.id ? step : item)));
  };

  const moveStep = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= steps.length || fromIndex === toIndex) {
      return;
    }

    const nextSteps = [...steps];
    const [movedStep] = nextSteps.splice(fromIndex, 1);
    nextSteps.splice(toIndex, 0, movedStep);
    onFocusStep(movedStep.id);
    onChange(nextSteps);
  };

  const toggleStepCollapsed = (stepId: string) => {
    setCollapsedStepIds((current) => {
      const next = new Set(current);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  return (
    <div className="step-list">
      {steps.map((step, index) => {
        const isCollapsible = step.kind !== 'message';
        const isCollapsed = collapsedStepIds.has(step.id);

        return (
          <div
            className={`step-card step-card-${step.kind} ${
              isCollapsed ? 'is-collapsed' : ''
            }`}
            data-step-id={step.id}
            key={step.id}
            ref={(node) => {
              cardRefs.current[step.id] = node;
            }}
            tabIndex={-1}
          >
            <div className="step-heading">
              <div className="step-title">
                {isCollapsible && (
                  <button
                    type="button"
                    className="collapse-button"
                    onClick={() => toggleStepCollapsed(step.id)}
                    aria-expanded={!isCollapsed}
                    aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${step.kind}`}
                  >
                    {isCollapsed ? (
                      <ChevronRight size={15} />
                    ) : (
                      <ChevronDown size={15} />
                    )}
                  </button>
                )}
                <span>
                  {step.kind === 'message'
                    ? `Message #${sequenceNumbers.get(step.id) ?? index + 1}`
                    : step.kind}
                </span>
              </div>
              <div className="step-actions">
                <button
                  type="button"
                  className="icon-button"
                  disabled={index === 0}
                  onClick={() => moveStep(index, index - 1)}
                  aria-label={`Move step ${index + 1} up`}
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  disabled={index === steps.length - 1}
                  onClick={() => moveStep(index, index + 1)}
                  aria-label={`Move step ${index + 1} down`}
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => onChange(steps.filter((item) => item.id !== step.id))}
                  aria-label={`Remove step ${index + 1}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            {!isCollapsed && (
              <StepEditor
                focusedStepId={focusedStepId}
                onFocused={onFocused}
                onFocusStep={onFocusStep}
                participants={participants}
                sequenceNumbers={sequenceNumbers}
                step={step}
                onChange={updateStep}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

type StepEditorProps = {
  focusedStepId: string | null;
  onFocused: () => void;
  onFocusStep: (id: string) => void;
  participants: Participant[];
  sequenceNumbers: Map<string, number>;
  step: Step;
  onChange: (step: Step) => void;
};

function StepEditor({
  focusedStepId,
  onFocused,
  onFocusStep,
  participants,
  sequenceNumbers,
  step,
  onChange,
}: StepEditorProps) {
  if (step.kind === 'message') {
    return (
      <MessageEditor
        participants={participants}
        step={step}
        onChange={onChange}
      />
    );
  }

  if (step.kind === 'loop' || step.kind === 'opt') {
    return (
      <div className="block-editor">
        <label>
          Condition
          <input
            value={step.label}
            onChange={(event) => onChange({ ...step, label: event.target.value })}
          />
        </label>
        <NestedFlow
          focusedStepId={focusedStepId}
          onFocused={onFocused}
          onFocusStep={onFocusStep}
          participants={participants}
          sequenceNumbers={sequenceNumbers}
          steps={step.steps}
          onChange={(steps) => onChange({ ...step, steps })}
        />
      </div>
    );
  }

  return (
    <BranchEditor
      focusedStepId={focusedStepId}
      onFocused={onFocused}
      onFocusStep={onFocusStep}
      participants={participants}
      sequenceNumbers={sequenceNumbers}
      step={step}
      onChange={onChange}
    />
  );
}

type MessageEditorProps = {
  participants: Participant[];
  step: MessageStep;
  onChange: (step: MessageStep) => void;
};

function MessageEditor({ participants, step, onChange }: MessageEditorProps) {
  return (
    <div className="message-grid">
      <label>
        From
        <select
          value={step.from}
          onChange={(event) => onChange({ ...step, from: event.target.value })}
        >
          {participants.map((participant) => (
            <option key={participant.id} value={participant.id}>
              {participant.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Arrow
        <select
          value={step.arrow}
          onChange={(event) =>
            onChange({ ...step, arrow: event.target.value as ArrowKind })
          }
        >
          <option value="sync">request -&gt;&gt;</option>
          <option value="response">response --&gt;&gt;</option>
          <option value="async">async -)</option>
          <option value="create">create</option>
          <option value="destroy">destroy</option>
        </select>
      </label>
      <label>
        To
        <select
          value={step.to}
          onChange={(event) => onChange({ ...step, to: event.target.value })}
        >
          {participants.map((participant) => (
            <option key={participant.id} value={participant.id}>
              {participant.name}
            </option>
          ))}
        </select>
      </label>
      <label className="message-label">
        Message
        <textarea
          rows={1}
          value={step.label}
          onChange={(event) => onChange({ ...step, label: event.target.value })}
        />
      </label>
    </div>
  );
}

type BranchEditorProps = {
  focusedStepId: string | null;
  onFocused: () => void;
  onFocusStep: (id: string) => void;
  participants: Participant[];
  sequenceNumbers: Map<string, number>;
  step: Extract<Step, { kind: 'alt' | 'par' }>;
  onChange: (step: Extract<Step, { kind: 'alt' | 'par' }>) => void;
};

function BranchEditor({
  focusedStepId,
  onFocused,
  onFocusStep,
  participants,
  sequenceNumbers,
  step,
  onChange,
}: BranchEditorProps) {
  const branchJoiner = step.kind === 'alt' ? 'else' : 'and';
  const [collapsedBranchIds, setCollapsedBranchIds] = useState<Set<string>>(
    () => new Set(step.branches.map((branch) => branch.id)),
  );

  const updateBranch = (branch: Branch) => {
    onChange({
      ...step,
      branches: step.branches.map((item) =>
        item.id === branch.id ? branch : item,
      ),
    });
  };

  const toggleBranchCollapsed = (branchId: string) => {
    setCollapsedBranchIds((current) => {
      const next = new Set(current);
      if (next.has(branchId)) {
        next.delete(branchId);
      } else {
        next.add(branchId);
      }
      return next;
    });
  };

  return (
    <div className="branch-list">
      {step.branches.map((branch, index) => {
        const isCollapsed = collapsedBranchIds.has(branch.id);

        return (
          <div
            className={`branch-card branch-card-${
              index === 0 ? step.kind : branchJoiner
            } ${isCollapsed ? 'is-collapsed' : ''}`}
            key={branch.id}
          >
            <div className="branch-title">
              <button
                type="button"
                className="collapse-button"
                onClick={() => toggleBranchCollapsed(branch.id)}
                aria-expanded={!isCollapsed}
                aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${
                  index === 0 ? step.kind : branchJoiner
                } branch`}
              >
                {isCollapsed ? (
                  <ChevronRight size={15} />
                ) : (
                  <ChevronDown size={15} />
                )}
              </button>
              <strong>{index === 0 ? step.kind : branchJoiner}</strong>
              <input
                value={branch.label}
                onChange={(event) =>
                  updateBranch({ ...branch, label: event.target.value })
                }
                aria-label={`${step.kind} branch condition`}
              />
              <button
                type="button"
                className="icon-button"
                onClick={() =>
                  onChange({
                    ...step,
                    branches: step.branches.filter((item) => item.id !== branch.id),
                  })
                }
                aria-label="Remove branch"
              >
                <Trash2 size={15} />
              </button>
            </div>
            {!isCollapsed && (
              <NestedFlow
                focusedStepId={focusedStepId}
                onFocused={onFocused}
                onFocusStep={onFocusStep}
                participants={participants}
                sequenceNumbers={sequenceNumbers}
                steps={branch.steps}
                onChange={(steps) => updateBranch({ ...branch, steps })}
              />
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => {
          const branch = createBranch(
            step.kind === 'alt' ? 'another condition' : 'another task',
            participants,
          );
          onChange({
            ...step,
            branches: [
              ...step.branches,
              branch,
            ],
          });
          setCollapsedBranchIds((current) => new Set(current).add(branch.id));
          onFocusStep(branch.steps[0]?.id ?? branch.id);
        }}
      >
        <Plus size={14} />
        Add {branchJoiner}
      </button>
    </div>
  );
}

type NestedFlowProps = {
  focusedStepId: string | null;
  onFocused: () => void;
  onFocusStep: (id: string) => void;
  participants: Participant[];
  sequenceNumbers: Map<string, number>;
  steps: Step[];
  onChange: (steps: Step[]) => void;
};

function NestedFlow({
  focusedStepId,
  onFocused,
  onFocusStep,
  participants,
  sequenceNumbers,
  steps,
  onChange,
}: NestedFlowProps) {
  const addNestedStep = (kind: StepKind) => {
    const step = createStep(kind, participants);
    onFocusStep(step.id);
    onChange([...steps, step]);
  };

  return (
    <div className="nested-flow">
      <StepList
        focusedStepId={focusedStepId}
        onFocused={onFocused}
        onFocusStep={onFocusStep}
        participants={participants}
        sequenceNumbers={sequenceNumbers}
        steps={steps}
        onChange={onChange}
      />
      <div className="flow-action-bar nested-action-bar">
        <AddStepButtons onAdd={addNestedStep} />
      </div>
    </div>
  );
}

const getSequenceNumbers = (steps: Step[]) => {
  const numbers = new Map<string, number>();
  let nextNumber = 1;

  const visit = (step: Step) => {
    if (step.kind === 'message') {
      numbers.set(step.id, nextNumber);
      nextNumber += 1;
      return;
    }

    if (step.kind === 'loop' || step.kind === 'opt') {
      step.steps.forEach(visit);
      return;
    }

    step.branches.forEach((branch) => branch.steps.forEach(visit));
  };

  steps.forEach(visit);
  return numbers;
};
