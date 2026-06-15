import { generateStateMachineMermaid } from './stateMachineGenerator';
import { defaultStateMachineModel } from './stateMachineSample';
import type { StateMachineModel } from './stateMachineTypes';
import type { EditorMode } from './storage';

const MODEL_KEY = 'state-machine-builder:model';
const CODE_KEY = 'state-machine-builder:code';
const MODE_KEY = 'state-machine-builder:mode';

const normalizeStateMachineModel = (
  model: StateMachineModel,
): StateMachineModel => ({
  states: model.states ?? [],
  transitions: model.transitions ?? [],
});

export const loadStateMachineModel = (): StateMachineModel => {
  const saved = localStorage.getItem(MODEL_KEY);
  if (!saved) {
    return defaultStateMachineModel;
  }

  try {
    return normalizeStateMachineModel(JSON.parse(saved) as StateMachineModel);
  } catch {
    return defaultStateMachineModel;
  }
};

export const saveStateMachineModel = (model: StateMachineModel) => {
  localStorage.setItem(MODEL_KEY, JSON.stringify(model));
};

export const loadStateMachineCode = (
  fallback = generateStateMachineMermaid(defaultStateMachineModel),
) => localStorage.getItem(CODE_KEY) || fallback;

export const saveStateMachineCode = (code: string) => {
  localStorage.setItem(CODE_KEY, code);
};

export const loadStateMachineMode = (): EditorMode =>
  localStorage.getItem(MODE_KEY) === 'code' ? 'code' : 'builder';

export const saveStateMachineMode = (mode: EditorMode) => {
  localStorage.setItem(MODE_KEY, mode);
};
