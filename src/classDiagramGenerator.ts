import type {
  ClassDiagramModel,
  ClassRelationshipKind,
  ClassStereotype,
} from './classTypes';

export const classRelationshipSymbols: Record<ClassRelationshipKind, string> = {
  inheritance: '<|--',
  composition: '*--',
  aggregation: 'o--',
  association: '-->',
  link: '--',
  dependency: '..>',
  realization: '..|>',
  dottedLink: '..',
};

export const classRelationshipLabels: Record<ClassRelationshipKind, string> = {
  inheritance: 'Inheritance',
  composition: 'Composition',
  aggregation: 'Aggregation',
  association: 'Association',
  link: 'Link',
  dependency: 'Dependency',
  realization: 'Realization',
  dottedLink: 'Dotted link',
};

export const classRelationshipColors: Record<ClassRelationshipKind, string> = {
  inheritance: '#2563eb',
  composition: '#7c3aed',
  aggregation: '#0891b2',
  association: '#16a34a',
  link: '#64748b',
  dependency: '#ea580c',
  realization: '#c026d3',
  dottedLink: '#475569',
};

export const classStereotypeLabels: Record<ClassStereotype, string> = {
  class: 'Class',
  abstract: 'Abstract',
  interface: 'Interface',
  service: 'Service',
  enumeration: 'Enumeration',
};

const stereotypeAnnotations: Partial<Record<ClassStereotype, string>> = {
  abstract: 'Abstract',
  interface: 'Interface',
  service: 'Service',
  enumeration: 'Enumeration',
};

const line = (depth: number, value: string) => `${'    '.repeat(depth)}${value}`;

const normalizeClassName = (value: string) =>
  value.trim().replace(/\s+/g, '_') || 'ClassName';

export const generateClassMermaid = (model: ClassDiagramModel) => {
  const classLines = model.classes.flatMap((classEntity) => {
    const name = normalizeClassName(classEntity.name);
    const annotation = stereotypeAnnotations[classEntity.stereotype ?? 'class'];
    const members = [...classEntity.fields, ...classEntity.methods]
      .map((member) => member.value.trim())
      .filter(Boolean);

    if (members.length === 0 && !annotation) {
      return [line(1, `class ${name}`)];
    }

    return [
      line(1, `class ${name} {`),
      ...(annotation ? [line(2, `<<${annotation}>>`)] : []),
      ...members.map((member) => line(2, member)),
      line(1, '}'),
    ];
  });

  const relationshipLines = model.relationships
    .filter((relationship) => relationship.from && relationship.to)
    .map((relationship) => {
      const from = normalizeClassName(relationship.from);
      const to = normalizeClassName(relationship.to);
      const symbol = classRelationshipSymbols[relationship.kind];
      const label = relationship.label.trim();

      return line(1, `${from} ${symbol} ${to}${label ? ` : ${label}` : ''}`);
    });

  return [
    'classDiagram',
    ...classLines,
    ...(classLines.length && relationshipLines.length ? [''] : []),
    ...relationshipLines,
  ].join('\n');
};
