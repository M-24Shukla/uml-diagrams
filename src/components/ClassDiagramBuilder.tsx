import { type MouseEvent, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import {
  classRelationshipColors,
  classRelationshipLabels,
  classRelationshipSymbols,
  classStereotypeLabels,
} from '../classDiagramGenerator';
import type {
  ClassDiagramModel,
  ClassEntity,
  ClassMember,
  ClassMemberKind,
  ClassRelationship,
  ClassRelationshipKind,
  ClassStereotype,
} from '../classTypes';

type ClassDiagramBuilderProps = {
  model: ClassDiagramModel;
  onChange: (model: ClassDiagramModel) => void;
};

const newId = () => crypto.randomUUID();

const relationshipKinds = Object.keys(
  classRelationshipLabels,
) as ClassRelationshipKind[];

const classStereotypes = Object.keys(classStereotypeLabels) as ClassStereotype[];

const createMember = (value = ''): ClassMember => ({
  id: newId(),
  value,
});

const createClass = (index: number): ClassEntity => ({
  id: newId(),
  name: `Class${index + 1}`,
  stereotype: 'class',
  fields: [createMember('+String value')],
  methods: [createMember('+operation()')],
});

const createRelationship = (classes: ClassEntity[]): ClassRelationship => {
  const from = classes[0]?.name ?? '';
  const to = classes.find((classEntity) => classEntity.name !== from)?.name ?? '';

  return {
    id: newId(),
    from,
    to,
    kind: 'association',
    label: 'uses',
  };
};

export function ClassDiagramBuilder({ model, onChange }: ClassDiagramBuilderProps) {
  const [isClassesCollapsed, setIsClassesCollapsed] = useState(false);
  const [isRelationshipsCollapsed, setIsRelationshipsCollapsed] = useState(false);
  const [collapsedClassIds, setCollapsedClassIds] = useState<Set<string>>(
    () => new Set(model.classes.map((classEntity) => classEntity.id)),
  );

  const classNames = useMemo(
    () => model.classes.map((classEntity) => classEntity.name).filter(Boolean),
    [model.classes],
  );

  useEffect(() => {
    setCollapsedClassIds((current) => {
      const next = new Set(current);
      model.classes.forEach((classEntity) => {
        if (!next.has(classEntity.id)) {
          next.add(classEntity.id);
        }
      });
      return next;
    });
  }, [model.classes]);

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

  const updateClasses = (classes: ClassEntity[]) => {
    onChange({ ...model, classes });
  };

  const updateRelationships = (relationships: ClassRelationship[]) => {
    onChange({ ...model, relationships });
  };

  const addClass = () => {
    const nextClass = createClass(model.classes.length);
    setCollapsedClassIds((current) => new Set(current).add(nextClass.id));
    updateClasses([...model.classes, nextClass]);
  };

  const renameClass = (classId: string, nextName: string) => {
    const previousName =
      model.classes.find((classEntity) => classEntity.id === classId)?.name ?? '';

    onChange({
      classes: model.classes.map((classEntity) =>
        classEntity.id === classId ? { ...classEntity, name: nextName } : classEntity,
      ),
      relationships: model.relationships.map((relationship) => ({
        ...relationship,
        from: relationship.from === previousName ? nextName : relationship.from,
        to: relationship.to === previousName ? nextName : relationship.to,
      })),
    });
  };

  const removeClass = (classId: string) => {
    const className =
      model.classes.find((classEntity) => classEntity.id === classId)?.name ?? '';

    onChange({
      classes: model.classes.filter((classEntity) => classEntity.id !== classId),
      relationships: model.relationships.filter(
        (relationship) =>
          relationship.from !== className && relationship.to !== className,
      ),
    });
  };

  const updateClassMembers = (
    classId: string,
    kind: ClassMemberKind,
    members: ClassMember[],
  ) => {
    updateClasses(
      model.classes.map((classEntity) =>
        classEntity.id === classId
          ? {
              ...classEntity,
              [kind === 'field' ? 'fields' : 'methods']: members,
            }
          : classEntity,
      ),
    );
  };

  const updateClassStereotype = (
    classId: string,
    stereotype: ClassStereotype,
  ) => {
    updateClasses(
      model.classes.map((classEntity) =>
        classEntity.id === classId ? { ...classEntity, stereotype } : classEntity,
      ),
    );
  };

  const updateRelationship = (
    relationshipId: string,
    patch: Partial<ClassRelationship>,
  ) => {
    updateRelationships(
      model.relationships.map((relationship) => {
        if (relationship.id !== relationshipId) {
          return relationship;
        }

        const nextRelationship = { ...relationship, ...patch };
        if (nextRelationship.from === nextRelationship.to) {
          const fallback = classNames.find((name) => name !== nextRelationship.from) ?? '';
          nextRelationship.to = fallback;
        }

        return nextRelationship;
      }),
    );
  };

  const addRelationship = () => {
    updateRelationships([...model.relationships, createRelationship(model.classes)]);
  };

  const toggleClass = (classId: string) => {
    setCollapsedClassIds((current) => {
      const next = new Set(current);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  };

  return (
    <div className="builder">
      <section
        className={`builder-section class-builder-section ${
          isClassesCollapsed ? 'is-collapsed' : ''
        }`}
      >
        <div
          className="section-title"
          onClick={(event) =>
            toggleFromHeaderSpace(event, () =>
              setIsClassesCollapsed((value) => !value),
            )
          }
        >
          <button
            type="button"
            className="section-toggle"
            onClick={() => setIsClassesCollapsed((value) => !value)}
            aria-expanded={!isClassesCollapsed}
            aria-controls="classes-panel"
          >
            {isClassesCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
            <h3>Classes</h3>
          </button>
          {!isClassesCollapsed && (
            <button type="button" onClick={addClass} aria-label="Add class">
              <Plus size={15} />
              Class
            </button>
          )}
        </div>

        {!isClassesCollapsed && (
          <div className="class-section-body" id="classes-panel">
            <div className="visibility-legend" aria-label="Visibility legend">
              <span>+ public</span>
              <span>- private</span>
              <span># protected</span>
              <span>~ package</span>
            </div>

            {model.classes.length === 0 ? (
              <p className="empty-state">No classes created.</p>
            ) : (
              <div className="class-card-grid">
                {model.classes.map((classEntity) => (
                  <ClassCard
                    classEntity={classEntity}
                    isCollapsed={collapsedClassIds.has(classEntity.id)}
                    key={classEntity.id}
                    onRemove={() => removeClass(classEntity.id)}
                    onRename={(nextName) => renameClass(classEntity.id, nextName)}
                    onStereotypeChange={(stereotype) =>
                      updateClassStereotype(classEntity.id, stereotype)
                    }
                    onToggle={() => toggleClass(classEntity.id)}
                    onUpdateMembers={(kind, members) =>
                      updateClassMembers(classEntity.id, kind, members)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section
        className={`builder-section relationships-section ${
          isRelationshipsCollapsed ? 'is-collapsed' : ''
        }`}
      >
        <div
          className="section-title"
          onClick={(event) =>
            toggleFromHeaderSpace(event, () =>
              setIsRelationshipsCollapsed((value) => !value),
            )
          }
        >
          <button
            type="button"
            className="section-toggle"
            onClick={() => setIsRelationshipsCollapsed((value) => !value)}
            aria-expanded={!isRelationshipsCollapsed}
            aria-controls="relationships-panel"
          >
            {isRelationshipsCollapsed ? (
              <ChevronRight size={15} />
            ) : (
              <ChevronDown size={15} />
            )}
            <h3>Relationships</h3>
          </button>
          {!isRelationshipsCollapsed && (
            <button
              type="button"
              onClick={addRelationship}
              disabled={model.classes.length < 2}
              aria-label="Add relationship"
            >
              <Plus size={15} />
              Relationship
            </button>
          )}
        </div>

        {!isRelationshipsCollapsed && (
          <div className="relationship-list" id="relationships-panel">
            {model.relationships.length === 0 ? (
              <p className="empty-state">No relationships created.</p>
            ) : (
              model.relationships.map((relationship) => (
                <div className="relationship-card" key={relationship.id}>
                  <div className="relationship-summary">
                    <p>
                      <strong>{relationship.from || 'From'}</strong>{' '}
                      <span
                        className="relationship-accent"
                        style={{ color: classRelationshipColors[relationship.kind] }}
                      >
                        {relationship.label || 'association'} (
                        {classRelationshipLabels[relationship.kind]})
                      </span>{' '}
                      <strong>{relationship.to || 'To'}</strong>
                    </p>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() =>
                        updateRelationships(
                          model.relationships.filter(
                            (item) => item.id !== relationship.id,
                          ),
                        )
                      }
                      aria-label="Remove relationship"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="relationship-editor-grid">
                    <label>
                      From
                      <select
                        value={relationship.from}
                        onChange={(event) =>
                          updateRelationship(relationship.id, {
                            from: event.target.value,
                          })
                        }
                      >
                        {classNames.map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Relationship
                      <select
                        value={relationship.kind}
                        onChange={(event) =>
                          updateRelationship(relationship.id, {
                            kind: event.target.value as ClassRelationshipKind,
                          })
                        }
                      >
                        {relationshipKinds.map((kind) => (
                          <option key={kind} value={kind}>
                            {classRelationshipLabels[kind]}{' '}
                            {classRelationshipSymbols[kind]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      To
                      <select
                        value={relationship.to}
                        onChange={(event) =>
                          updateRelationship(relationship.id, {
                            to: event.target.value,
                          })
                        }
                      >
                        {classNames
                          .filter((name) => name !== relationship.from)
                          .map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                      </select>
                    </label>

                    <label>
                      Association Name
                      <input
                        value={relationship.label}
                        onChange={(event) =>
                          updateRelationship(relationship.id, {
                            label: event.target.value,
                          })
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

type ClassCardProps = {
  classEntity: ClassEntity;
  isCollapsed: boolean;
  onRemove: () => void;
  onRename: (name: string) => void;
  onStereotypeChange: (stereotype: ClassStereotype) => void;
  onToggle: () => void;
  onUpdateMembers: (kind: ClassMemberKind, members: ClassMember[]) => void;
};

function ClassCard({
  classEntity,
  isCollapsed,
  onRemove,
  onRename,
  onStereotypeChange,
  onToggle,
  onUpdateMembers,
}: ClassCardProps) {
  return (
    <article className={`class-card ${isCollapsed ? 'is-collapsed' : ''}`}>
      <div
        className="class-card-header"
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest('button, input, select, textarea, label')) {
            return;
          }
          onToggle();
        }}
      >
        <button
          type="button"
          className="collapse-button"
          onClick={onToggle}
          aria-expanded={!isCollapsed}
          aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${classEntity.name}`}
        >
          {isCollapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
        </button>
        <input
          className="class-name-input"
          value={classEntity.name}
          onChange={(event) => onRename(event.target.value)}
          aria-label="Class name"
        />
        <select
          className="class-type-select"
          value={classEntity.stereotype ?? 'class'}
          onChange={(event) =>
            onStereotypeChange(event.target.value as ClassStereotype)
          }
          aria-label={`Type for ${classEntity.name}`}
        >
          {classStereotypes.map((stereotype) => (
            <option key={stereotype} value={stereotype}>
              {classStereotypeLabels[stereotype]}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="icon-button"
          onClick={onRemove}
          aria-label={`Remove ${classEntity.name}`}
        >
          <Trash2 size={15} />
        </button>
      </div>

      {!isCollapsed && (
        <div className="class-member-columns">
          <MemberColumn
            title="Data"
            members={classEntity.fields}
            placeholder="+String fieldName"
            onChange={(members) => onUpdateMembers('field', members)}
          />
          <MemberColumn
            title="Methods"
            members={classEntity.methods}
            placeholder="+methodName()"
            onChange={(members) => onUpdateMembers('method', members)}
          />
        </div>
      )}
    </article>
  );
}

type MemberColumnProps = {
  title: string;
  members: ClassMember[];
  placeholder: string;
  onChange: (members: ClassMember[]) => void;
};

function MemberColumn({ title, members, placeholder, onChange }: MemberColumnProps) {
  return (
    <div className="member-column">
      <div className="member-column-title">
        <strong>{title}</strong>
        <button
          type="button"
          className="icon-button"
          onClick={() => onChange([...members, createMember()])}
          aria-label={`Add ${title}`}
        >
          <Plus size={15} />
        </button>
      </div>
      <div className="member-list">
        {members.length === 0 ? (
          <p className="empty-state">No {title.toLowerCase()} added.</p>
        ) : (
          members.map((member) => (
            <div className="member-row" key={member.id}>
              <input
                value={member.value}
                placeholder={placeholder}
                onChange={(event) =>
                  onChange(
                    members.map((item) =>
                      item.id === member.id
                        ? { ...item, value: event.target.value }
                        : item,
                    ),
                  )
                }
                aria-label={`${title} member`}
              />
              <button
                type="button"
                className="icon-button"
                onClick={() => onChange(members.filter((item) => item.id !== member.id))}
                aria-label={`Remove ${title} member`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
