import { defaultClassDiagramModel } from './classDiagramSample';
import { generateClassMermaid } from './classDiagramGenerator';
import type { ClassDiagramModel } from './classTypes';
import type { EditorMode } from './storage';

const MODEL_KEY = 'class-builder:model';
const CODE_KEY = 'class-builder:code';
const MODE_KEY = 'class-builder:mode';

export const loadClassModel = (): ClassDiagramModel => {
  const saved = localStorage.getItem(MODEL_KEY);
  if (!saved) {
    return defaultClassDiagramModel;
  }

  try {
    return normalizeClassModel(JSON.parse(saved) as ClassDiagramModel);
  } catch {
    return defaultClassDiagramModel;
  }
};

export const saveClassModel = (model: ClassDiagramModel) => {
  localStorage.setItem(MODEL_KEY, JSON.stringify(model));
};

export const loadClassCode = (fallback = generateClassMermaid(defaultClassDiagramModel)) =>
  stripClassColorLines(localStorage.getItem(CODE_KEY) || fallback);

export const saveClassCode = (code: string) => {
  localStorage.setItem(CODE_KEY, code);
};

export const loadClassMode = (): EditorMode =>
  localStorage.getItem(MODE_KEY) === 'code' ? 'code' : 'builder';

export const saveClassMode = (mode: EditorMode) => {
  localStorage.setItem(MODE_KEY, mode);
};

const normalizeClassModel = (model: ClassDiagramModel): ClassDiagramModel => ({
  ...model,
  classes: model.classes.map((classEntity) => ({
    ...classEntity,
    stereotype: classEntity.stereotype ?? 'class',
    fields: classEntity.fields ?? [],
    methods: classEntity.methods ?? [],
  })),
  relationships: model.relationships ?? [],
});

const stripClassColorLines = (code: string) =>
  code
    .split('\n')
    .filter((line) => {
      const trimmedLine = line.trim();
      return (
        !/^classDef\s+classAccent\d+\b/i.test(trimmedLine) &&
        !/^cssClass\s+/i.test(trimmedLine) &&
        !/^class\s+\S+\s+classAccent\d+\s*;?$/i.test(trimmedLine)
      );
    })
    .join('\n');
