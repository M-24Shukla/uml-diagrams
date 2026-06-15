import { type MouseEvent, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { activityNodeKindLabels } from '../activityDiagramGenerator';
import type {
  ActivityDiagramModel,
  ActivityNode,
  ActivityNodeKind,
  ActivityTransition,
  Swimlane,
} from '../activityTypes';

type ActivityDiagramBuilderProps = {
  model: ActivityDiagramModel;
  onChange: (model: ActivityDiagramModel) => void;
};

const newId = () => crypto.randomUUID();

const nodeKinds = Object.keys(activityNodeKindLabels) as ActivityNodeKind[];

const createSwimlane = (index: number): Swimlane => ({
  id: `lane-${newId()}`,
  name: `Swimlane ${index + 1}`,
});

const createNode = (
  kind: ActivityNodeKind,
  index: number,
  laneId = '',
): ActivityNode => ({
  id: `activity-${newId()}`,
  label:
    kind === 'start' || kind === 'end' || kind === 'fork' || kind === 'join'
      ? activityNodeKindLabels[kind]
      : `${activityNodeKindLabels[kind]} ${index + 1}`,
  kind,
  laneId,
});

const createTransition = (nodes: ActivityNode[]): ActivityTransition => ({
  id: newId(),
  from: nodes[0]?.id ?? '',
  to: nodes.find((node) => node.id !== nodes[0]?.id)?.id ?? '',
  label: '',
});

export function ActivityDiagramBuilder({
  model,
  onChange,
}: ActivityDiagramBuilderProps) {
  const [isSwimlanesCollapsed, setIsSwimlanesCollapsed] = useState(false);
  const [isTransitionsCollapsed, setIsTransitionsCollapsed] = useState(false);
  const [collapsedLaneIds, setCollapsedLaneIds] = useState<Set<string>>(
    () => new Set(model.swimlanes.map((lane) => lane.id)),
  );

  const nodeNameById = useMemo(
    () => new Map(model.nodes.map((node) => [node.id, node.label])),
    [model.nodes],
  );
  const nodesByLaneId = useMemo(() => {
    const laneIds = new Set(model.swimlanes.map((lane) => lane.id));
    const grouped = new Map<string, ActivityNode[]>();
    const unassigned: ActivityNode[] = [];

    model.nodes.forEach((node) => {
      if (!node.laneId || !laneIds.has(node.laneId)) {
        unassigned.push(node);
        return;
      }

      grouped.set(node.laneId, [...(grouped.get(node.laneId) ?? []), node]);
    });

    return { grouped, unassigned };
  }, [model.nodes, model.swimlanes]);

  const updateSwimlanes = (swimlanes: Swimlane[]) => {
    onChange({ ...model, swimlanes });
  };

  const updateNodes = (nodes: ActivityNode[]) => {
    onChange({ ...model, nodes });
  };

  const updateTransitions = (transitions: ActivityTransition[]) => {
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

  const addSwimlane = () => {
    updateSwimlanes([...model.swimlanes, createSwimlane(model.swimlanes.length)]);
  };

  const toggleLane = (laneId: string) => {
    setCollapsedLaneIds((current) => {
      const next = new Set(current);
      if (next.has(laneId)) {
        next.delete(laneId);
      } else {
        next.add(laneId);
      }

      return next;
    });
  };

  const removeSwimlane = (laneId: string) => {
    setCollapsedLaneIds((current) => {
      const next = new Set(current);
      next.delete(laneId);
      return next;
    });
    onChange({
      ...model,
      swimlanes: model.swimlanes.filter((lane) => lane.id !== laneId),
      nodes: model.nodes.map((node) =>
        node.laneId === laneId ? { ...node, laneId: '' } : node,
      ),
    });
  };

  const addNode = (kind: ActivityNodeKind, laneId: string) => {
    updateNodes([
      ...model.nodes,
      createNode(kind, model.nodes.length, laneId),
    ]);
  };

  const updateNode = (nodeId: string, patch: Partial<ActivityNode>) => {
    updateNodes(
      model.nodes.map((node) => (node.id === nodeId ? { ...node, ...patch } : node)),
    );
  };

  const removeNode = (nodeId: string) => {
    onChange({
      ...model,
      nodes: model.nodes.filter((node) => node.id !== nodeId),
      transitions: model.transitions.filter(
        (transition) => transition.from !== nodeId && transition.to !== nodeId,
      ),
    });
  };

  const addTransition = () => {
    updateTransitions([...model.transitions, createTransition(model.nodes)]);
  };

  const updateTransition = (
    transitionId: string,
    patch: Partial<ActivityTransition>,
  ) => {
    updateTransitions(
      model.transitions.map((transition) => {
        if (transition.id !== transitionId) {
          return transition;
        }

        const nextTransition = { ...transition, ...patch };
        if (nextTransition.from === nextTransition.to) {
          nextTransition.to =
            model.nodes.find((node) => node.id !== nextTransition.from)?.id ?? '';
        }

        return nextTransition;
      }),
    );
  };

  const renderNodeCard = (node: ActivityNode, showSwimlanePicker = false) => (
    <article className={`activity-node-card activity-node-${node.kind}`} key={node.id}>
      <div className="activity-card-header">
        <strong>{activityNodeKindLabels[node.kind]}</strong>
        <button
          type="button"
          className="icon-button"
          onClick={() => removeNode(node.id)}
          aria-label={`Remove ${node.label}`}
        >
          <Trash2 size={15} />
        </button>
      </div>
      <div
        className={
          showSwimlanePicker
            ? 'activity-node-fields'
            : 'activity-node-fields activity-node-fields-compact'
        }
      >
        <label>
          Label
          <input
            value={node.label}
            onChange={(event) => updateNode(node.id, { label: event.target.value })}
          />
        </label>
        <label>
          Type
          <select
            value={node.kind}
            onChange={(event) =>
              updateNode(node.id, {
                kind: event.target.value as ActivityNodeKind,
              })
            }
          >
            {nodeKinds.map((kind) => (
              <option key={kind} value={kind}>
                {activityNodeKindLabels[kind]}
              </option>
            ))}
          </select>
        </label>
        {showSwimlanePicker && (
          <label>
            Swimlane
            <select
              value={node.laneId}
              onChange={(event) => updateNode(node.id, { laneId: event.target.value })}
            >
              <option value="">No swimlane</option>
              {model.swimlanes.map((lane) => (
                <option key={lane.id} value={lane.id}>
                  {lane.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </article>
  );

  return (
    <div className="builder activity-builder">
      <section className="builder-section">
        <div
          className="section-title"
          onClick={(event) =>
            toggleFromHeaderSpace(event, () =>
              setIsSwimlanesCollapsed((value) => !value),
            )
          }
        >
          <button
            type="button"
            className="section-toggle"
            onClick={() => setIsSwimlanesCollapsed((value) => !value)}
            aria-expanded={!isSwimlanesCollapsed}
            aria-controls="activity-swimlanes-panel"
          >
            {isSwimlanesCollapsed ? (
              <ChevronRight size={15} />
            ) : (
              <ChevronDown size={15} />
            )}
            <h3>Swimlanes &amp; Subgraphs</h3>
          </button>
          {!isSwimlanesCollapsed && (
            <button type="button" onClick={addSwimlane} aria-label="Add swimlane">
              <Plus size={15} />
              Swimlane
            </button>
          )}
        </div>

        {!isSwimlanesCollapsed && (
          <div className="activity-list" id="activity-swimlanes-panel">
            {model.swimlanes.length === 0 ? (
              <p className="empty-state">No swimlanes created.</p>
            ) : (
              model.swimlanes.map((lane) => {
                const laneNodes = nodesByLaneId.grouped.get(lane.id) ?? [];
                const isLaneCollapsed = collapsedLaneIds.has(lane.id);

                return (
                  <article
                    className={`activity-swimlane-card ${
                      isLaneCollapsed ? 'is-collapsed' : ''
                    }`}
                    key={lane.id}
                  >
                    <div
                      className="activity-swimlane-header"
                      onClick={(event) =>
                        toggleFromHeaderSpace(event, () => toggleLane(lane.id))
                      }
                    >
                      <button
                        type="button"
                        className="section-toggle activity-lane-toggle"
                        onClick={() => toggleLane(lane.id)}
                        aria-expanded={!isLaneCollapsed}
                        aria-label={`${isLaneCollapsed ? 'Expand' : 'Collapse'} ${lane.name}`}
                      >
                        {isLaneCollapsed ? (
                          <ChevronRight size={15} />
                        ) : (
                          <ChevronDown size={15} />
                        )}
                      </button>
                      <input
                        value={lane.name}
                        onChange={(event) =>
                          updateSwimlanes(
                            model.swimlanes.map((item) =>
                              item.id === lane.id
                                ? { ...item, name: event.target.value }
                                : item,
                            ),
                          )
                        }
                        aria-label="Swimlane name"
                      />
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => removeSwimlane(lane.id)}
                        aria-label={`Remove ${lane.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {!isLaneCollapsed && (
                      <>
                        <div className="activity-action-bar activity-lane-actions">
                          {nodeKinds.map((kind) => (
                            <button
                              type="button"
                              key={kind}
                              onClick={() => addNode(kind, lane.id)}
                              aria-label={`Add ${activityNodeKindLabels[kind]} to ${lane.name}`}
                            >
                              <Plus size={15} />
                              {activityNodeKindLabels[kind]}
                            </button>
                          ))}
                        </div>
                        <div className="activity-lane-node-list">
                          {laneNodes.length === 0 ? (
                            <p className="empty-state">No activity nodes in this swimlane.</p>
                          ) : (
                            laneNodes.map((node) => renderNodeCard(node))
                          )}
                        </div>
                      </>
                    )}
                  </article>
                );
              })
            )}

            {nodesByLaneId.unassigned.length > 0 && (
              <article className="activity-swimlane-card activity-unassigned-card">
                <div className="activity-swimlane-header">
                  <strong>Unassigned activity nodes</strong>
                </div>
                <div className="activity-lane-node-list">
                  {nodesByLaneId.unassigned.map((node) => renderNodeCard(node, true))}
                </div>
              </article>
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
            aria-controls="activity-transitions-panel"
          >
            {isTransitionsCollapsed ? (
              <ChevronRight size={15} />
            ) : (
              <ChevronDown size={15} />
            )}
            <h3>Transitions, Conditions &amp; Loops</h3>
          </button>
          {!isTransitionsCollapsed && (
            <button
              type="button"
              onClick={addTransition}
              disabled={model.nodes.length < 2}
              aria-label="Add transition"
            >
              <Plus size={15} />
              Transition
            </button>
          )}
        </div>

        {!isTransitionsCollapsed && (
          <div className="activity-list" id="activity-transitions-panel">
            {model.transitions.length === 0 ? (
              <p className="empty-state">No transitions created.</p>
            ) : (
              model.transitions.map((transition) => (
                <div className="activity-transition-card" key={transition.id}>
                  <div className="activity-transition-summary">
                    <p>
                      <strong>{nodeNameById.get(transition.from) || 'From'}</strong>
                      {transition.label && <span> [{transition.label}] </span>}
                      <strong>{nodeNameById.get(transition.to) || 'To'}</strong>
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
                  <div className="activity-transition-grid">
                    <label>
                      From
                      <select
                        value={transition.from}
                        onChange={(event) =>
                          updateTransition(transition.id, { from: event.target.value })
                        }
                      >
                        {model.nodes.map((node) => (
                          <option key={node.id} value={node.id}>
                            {node.label}
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
                        {model.nodes
                          .filter((node) => node.id !== transition.from)
                          .map((node) => (
                            <option key={node.id} value={node.id}>
                              {node.label}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      Guard / condition
                      <input
                        value={transition.label}
                        placeholder="yes, no, retry, loop condition"
                        onChange={(event) =>
                          updateTransition(transition.id, { label: event.target.value })
                        }
                      />
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
