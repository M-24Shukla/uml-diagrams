import { type MouseEvent, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { stateNodeKindLabels } from '../stateMachineGenerator';
import type {
  StateMachineModel,
  StateNode,
  StateNodeKind,
  StateTransition,
} from '../stateMachineTypes';

type StateMachineBuilderProps = {
  model: StateMachineModel;
  onChange: (model: StateMachineModel) => void;
};

const newId = () => crypto.randomUUID();

const stateKinds = Object.keys(stateNodeKindLabels) as StateNodeKind[];

const createState = (kind: StateNodeKind, index: number): StateNode => ({
  id: `state-${newId()}`,
  name:
    kind === 'state'
      ? `State ${index + 1}`
      : stateNodeKindLabels[kind],
  kind,
  parentId: '',
});

const createTransition = (states: StateNode[]): StateTransition => ({
  id: newId(),
  from: states[0]?.id ?? '',
  to: states.find((state) => state.id !== states[0]?.id)?.id ?? '',
  label: '',
});

export function StateMachineBuilder({
  model,
  onChange,
}: StateMachineBuilderProps) {
  const [isStatesCollapsed, setIsStatesCollapsed] = useState(false);
  const [isTransitionsCollapsed, setIsTransitionsCollapsed] = useState(false);

  const stateNameById = useMemo(
    () => new Map(model.states.map((state) => [state.id, state.name])),
    [model.states],
  );

  const updateStates = (states: StateNode[]) => {
    onChange({ ...model, states });
  };

  const updateTransitions = (transitions: StateTransition[]) => {
    onChange({ ...model, transitions });
  };

  const toggleFromHeaderSpace = (
    event: MouseEvent<HTMLElement>,
    toggle: () => void,
  ) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, input, select, textarea, label')) {
      return;
    }

    toggle();
  };

  const addState = (kind: StateNodeKind) => {
    updateStates([...model.states, createState(kind, model.states.length)]);
  };

  const updateState = (stateId: string, patch: Partial<StateNode>) => {
    updateStates(
      model.states.map((state) =>
        state.id === stateId ? { ...state, ...patch } : state,
      ),
    );
  };

  const removeState = (stateId: string) => {
    onChange({
      ...model,
      states: model.states
        .filter((state) => state.id !== stateId)
        .map((state) =>
          state.parentId === stateId ? { ...state, parentId: '' } : state,
        ),
      transitions: model.transitions.filter(
        (transition) => transition.from !== stateId && transition.to !== stateId,
      ),
    });
  };

  const addTransition = () => {
    updateTransitions([...model.transitions, createTransition(model.states)]);
  };

  const updateTransition = (
    transitionId: string,
    patch: Partial<StateTransition>,
  ) => {
    updateTransitions(
      model.transitions.map((transition) => {
        if (transition.id !== transitionId) {
          return transition;
        }

        const nextTransition = { ...transition, ...patch };
        if (nextTransition.from === nextTransition.to) {
          nextTransition.to =
            model.states.find((state) => state.id !== nextTransition.from)?.id ?? '';
        }

        return nextTransition;
      }),
    );
  };

  return (
    <div className="builder state-machine-builder">
      <section className="builder-section">
        <div
          className="section-title"
          onClick={(event) =>
            toggleFromHeaderSpace(event, () =>
              setIsStatesCollapsed((value) => !value),
            )
          }
        >
          <button
            type="button"
            className="section-toggle"
            onClick={() => setIsStatesCollapsed((value) => !value)}
            aria-expanded={!isStatesCollapsed}
            aria-controls="state-machine-states-panel"
          >
            {isStatesCollapsed ? (
              <ChevronRight size={15} />
            ) : (
              <ChevronDown size={15} />
            )}
            <h3>States</h3>
          </button>
          {!isStatesCollapsed && (
            <div className="state-action-bar">
              {stateKinds.map((kind) => (
                <button
                  type="button"
                  key={kind}
                  onClick={() => addState(kind)}
                  aria-label={`Add ${stateNodeKindLabels[kind]}`}
                >
                  <Plus size={15} />
                  {stateNodeKindLabels[kind]}
                </button>
              ))}
            </div>
          )}
        </div>

        {!isStatesCollapsed && (
          <div className="state-card-grid" id="state-machine-states-panel">
            {model.states.length === 0 ? (
              <p className="empty-state">No states created.</p>
            ) : (
              model.states.map((state) => (
                <article className={`state-card state-card-${state.kind}`} key={state.id}>
                  <div className="state-card-header">
                    <strong>{stateNodeKindLabels[state.kind]}</strong>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => removeState(state.id)}
                      aria-label={`Remove ${state.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="state-editor-grid">
                    <label>
                      Name
                      <input
                        value={state.name}
                        onChange={(event) =>
                          updateState(state.id, { name: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Type
                      <select
                        value={state.kind}
                        onChange={(event) =>
                          updateState(state.id, {
                            kind: event.target.value as StateNodeKind,
                          })
                        }
                      >
                        {stateKinds.map((kind) => (
                          <option key={kind} value={kind}>
                            {stateNodeKindLabels[kind]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Parent
                      <select
                        value={state.parentId}
                        onChange={(event) =>
                          updateState(state.id, { parentId: event.target.value })
                        }
                        disabled={state.kind !== 'state'}
                      >
                        <option value="">Top level</option>
                        {model.states
                          .filter(
                            (item) =>
                              item.id !== state.id && item.kind === 'state',
                          )
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </section>

      <section className="builder-section">
        <div
          className="section-title"
          onClick={(event) =>
            toggleFromHeaderSpace(event, () =>
              setIsTransitionsCollapsed((value) => !value),
            )
          }
        >
          <button
            type="button"
            className="section-toggle"
            onClick={() => setIsTransitionsCollapsed((value) => !value)}
            aria-expanded={!isTransitionsCollapsed}
            aria-controls="state-machine-transitions-panel"
          >
            {isTransitionsCollapsed ? (
              <ChevronRight size={15} />
            ) : (
              <ChevronDown size={15} />
            )}
            <h3>Transitions</h3>
          </button>
          {!isTransitionsCollapsed && (
            <button
              type="button"
              onClick={addTransition}
              disabled={model.states.length < 2}
              aria-label="Add transition"
            >
              <Plus size={15} />
              Transition
            </button>
          )}
        </div>

        {!isTransitionsCollapsed && (
          <div className="state-transition-list" id="state-machine-transitions-panel">
            {model.transitions.length === 0 ? (
              <p className="empty-state">No transitions created.</p>
            ) : (
              model.transitions.map((transition) => (
                <article className="state-transition-card" key={transition.id}>
                  <div className="state-transition-summary">
                    <p>
                      <strong>{stateNameById.get(transition.from) || 'From'}</strong>
                      {transition.label && <span> [{transition.label}] </span>}
                      <strong>{stateNameById.get(transition.to) || 'To'}</strong>
                    </p>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() =>
                        updateTransitions(
                          model.transitions.filter((item) => item.id !== transition.id),
                        )
                      }
                      aria-label="Remove transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="state-transition-grid">
                    <label>
                      From
                      <select
                        value={transition.from}
                        onChange={(event) =>
                          updateTransition(transition.id, { from: event.target.value })
                        }
                      >
                        {model.states.map((state) => (
                          <option key={state.id} value={state.id}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      To
                      <select
                        value={transition.to}
                        onChange={(event) =>
                          updateTransition(transition.id, { to: event.target.value })
                        }
                      >
                        {model.states
                          .filter((state) => state.id !== transition.from)
                          .map((state) => (
                            <option key={state.id} value={state.id}>
                              {state.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      Event / guard / action
                      <input
                        value={transition.label}
                        placeholder="submit [valid] / save"
                        onChange={(event) =>
                          updateTransition(transition.id, {
                            label: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
