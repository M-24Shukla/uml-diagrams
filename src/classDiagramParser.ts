import type {
  ClassDiagramModel,
  ClassEntity,
  ClassRelationshipKind,
  ClassStereotype,
} from './classTypes';
import { classRelationshipSymbols } from './classDiagramGenerator';

const memberId = () => crypto.randomUUID();

const slugify = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'class';

const cleanClassName = (value: string) =>
  value.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');

const kindBySymbol = Object.entries(classRelationshipSymbols).reduce(
  (result, [kind, symbol]) => {
    result[symbol] = kind as ClassRelationshipKind;
    return result;
  },
  {} as Record<string, ClassRelationshipKind>,
);

const relationshipSymbols = Object.values(classRelationshipSymbols)
  .sort((left, right) => right.length - left.length)
  .map((symbol) => symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

const relationshipPattern = new RegExp(
  `^([\\w"'][\\w\\s"'-]*?)\\s+(${relationshipSymbols})\\s+([\\w"'][\\w\\s"'-]*?)(?:\\s*:\\s*(.*))?$`,
);

const ensureClass = (
  classesByName: Map<string, ClassEntity>,
  rawName: string,
  previousByName: Map<string, ClassEntity>,
) => {
  const name = cleanClassName(rawName);
  const existing = classesByName.get(name);

  if (existing) {
    return existing;
  }

  const previous = previousByName.get(name);
  const classEntity: ClassEntity = previous
    ? {
        ...previous,
        stereotype: previous.stereotype ?? 'class',
        fields: [...previous.fields],
        methods: [...previous.methods],
      }
    : {
        id: slugify(name),
        name,
        stereotype: 'class',
        fields: [],
        methods: [],
      };

  classesByName.set(name, classEntity);
  return classEntity;
};

const addMember = (classEntity: ClassEntity, value: string) => {
  const stereotypeMatch = value.match(/^<<(.+)>>$/);
  if (stereotypeMatch) {
    const normalized = stereotypeMatch[1].trim().toLowerCase();
    const stereotypeByAnnotation: Record<string, ClassStereotype> = {
      abstract: 'abstract',
      interface: 'interface',
      service: 'service',
      enumeration: 'enumeration',
      enum: 'enumeration',
    };
    classEntity.stereotype = stereotypeByAnnotation[normalized] ?? 'class';
    return;
  }

  const member = { id: memberId(), value: value.trim() };

  if (/\)\s*$/.test(value)) {
    classEntity.methods.push(member);
    return;
  }

  classEntity.fields.push(member);
};

export const parseClassMermaidToModel = (
  code: string,
  previousModel?: ClassDiagramModel,
): ClassDiagramModel => {
  const previousByName = new Map(
    previousModel?.classes.map((classEntity) => [classEntity.name, classEntity]) ?? [],
  );
  const classesByName = new Map<string, ClassEntity>();
  const relationships: ClassDiagramModel['relationships'] = [];
  let activeClass: ClassEntity | null = null;

  code.split('\n').forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line || line === 'classDiagram') {
      return;
    }

    if (
      /^classDef\s+/i.test(line) ||
      /^cssClass\s+/i.test(line) ||
      /^class\s+\S+\s+classAccent\d+\s*;?$/i.test(line)
    ) {
      return;
    }

    const classBlockMatch = line.match(/^class\s+(.+?)\s*\{$/);
    if (classBlockMatch) {
      activeClass = ensureClass(classesByName, classBlockMatch[1], previousByName);
      activeClass.fields = [];
      activeClass.methods = [];
      activeClass.stereotype = 'class';
      return;
    }

    if (line === '}') {
      activeClass = null;
      return;
    }

    if (activeClass) {
      addMember(activeClass, line);
      return;
    }

    const standaloneClassMatch = line.match(/^class\s+(.+)$/);
    if (standaloneClassMatch) {
      ensureClass(classesByName, standaloneClassMatch[1], previousByName);
      return;
    }

    const relationshipMatch = line.match(relationshipPattern);
    if (relationshipMatch) {
      const from = cleanClassName(relationshipMatch[1]);
      const to = cleanClassName(relationshipMatch[3]);
      ensureClass(classesByName, from, previousByName);
      ensureClass(classesByName, to, previousByName);
      relationships.push({
        id: crypto.randomUUID(),
        from,
        to,
        kind: kindBySymbol[relationshipMatch[2]] ?? 'association',
        label: relationshipMatch[4] ?? '',
      });
    }
  });

  return {
    classes: Array.from(classesByName.values()),
    relationships,
  };
};
