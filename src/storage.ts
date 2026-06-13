import { defaultModel } from './sample';
import type { DiagramModel, ThemeMode } from './types';

const MODEL_KEY = 'sequence-builder:model';
const CODE_KEY = 'sequence-builder:code';
const MODE_KEY = 'sequence-builder:mode';
const THEME_KEY = 'sequence-builder:theme';

export type EditorMode = 'builder' | 'code';

export const loadModel = (): DiagramModel => {
  const saved = localStorage.getItem(MODEL_KEY);
  if (!saved) {
    return defaultModel;
  }

  try {
    return normalizeModel(JSON.parse(saved) as DiagramModel);
  } catch {
    return defaultModel;
  }
};

export const saveModel = (model: DiagramModel) => {
  localStorage.setItem(MODEL_KEY, JSON.stringify(model));
};

const participantColors = [
  '#e0f2fe',
  '#ede9fe',
  '#dcfce7',
  '#fef3c7',
  '#fce7f3',
  '#fee2e2',
  '#ccfbf1',
];

const normalizeModel = (model: DiagramModel): DiagramModel => ({
  ...model,
  participants: model.participants.map((participant, index) => ({
    ...participant,
    color: participant.color || participantColors[index % participantColors.length],
    type: participant.type || 'participant',
  })),
});

export const loadCode = (fallback: string) =>
  normalizeCreatedParticipants(localStorage.getItem(CODE_KEY) || fallback);

export const saveCode = (code: string) => {
  localStorage.setItem(CODE_KEY, code);
};

const normalizeCreatedParticipants = (code: string) => {
  const createdNames = new Set<string>();
  const createdParticipantPattern = /^\s*create\s+(?:participant|actor)\s+([A-Za-z_][\w-]*)\b/;

  code.split('\n').forEach((line) => {
    const match = line.match(createdParticipantPattern);
    if (match) {
      createdNames.add(match[1]);
    }
  });

  if (createdNames.size === 0) {
    return code;
  }

  const declaredParticipantPattern = /^(\s*)(participant|actor)\s+([A-Za-z_][\w-]*)\s*$/;

  return code
    .split('\n')
    .filter((line) => {
      const match = line.match(declaredParticipantPattern);
      return !match || !createdNames.has(match[3]);
    })
    .join('\n');
};

export const loadMode = (): EditorMode =>
  localStorage.getItem(MODE_KEY) === 'code' ? 'code' : 'builder';

export const saveMode = (mode: EditorMode) => {
  localStorage.setItem(MODE_KEY, mode);
};

export const loadTheme = (): ThemeMode =>
  localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';

export const saveTheme = (theme: ThemeMode) => {
  localStorage.setItem(THEME_KEY, theme);
};
