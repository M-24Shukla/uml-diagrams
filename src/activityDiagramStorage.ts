import { generateActivityMermaid } from './activityDiagramGenerator';
import { defaultActivityDiagramModel } from './activityDiagramSample';
import type { ActivityDiagramModel } from './activityTypes';
import type { EditorMode } from './storage';

const MODEL_KEY = 'activity-builder:model';
const CODE_KEY = 'activity-builder:code';
const MODE_KEY = 'activity-builder:mode';

export const loadActivityModel = (): ActivityDiagramModel => {
  const saved = localStorage.getItem(MODEL_KEY);
  if (!saved) {
    return defaultActivityDiagramModel;
  }

  try {
    return normalizeActivityModel(JSON.parse(saved) as ActivityDiagramModel);
  } catch {
    return defaultActivityDiagramModel;
  }
};

export const saveActivityModel = (model: ActivityDiagramModel) => {
  localStorage.setItem(MODEL_KEY, JSON.stringify(model));
};

export const loadActivityCode = (
  fallback = generateActivityMermaid(defaultActivityDiagramModel),
) => localStorage.getItem(CODE_KEY) || fallback;

export const saveActivityCode = (code: string) => {
  localStorage.setItem(CODE_KEY, code);
};

export const loadActivityMode = (): EditorMode =>
  localStorage.getItem(MODE_KEY) === 'code' ? 'code' : 'builder';

export const saveActivityMode = (mode: EditorMode) => {
  localStorage.setItem(MODE_KEY, mode);
};

const normalizeActivityModel = (model: ActivityDiagramModel): ActivityDiagramModel => ({
  swimlanes: model.swimlanes ?? [],
  nodes: model.nodes ?? [],
  transitions: model.transitions ?? [],
});
