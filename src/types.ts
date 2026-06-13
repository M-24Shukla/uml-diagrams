export type ThemeMode = 'light' | 'dark';

export type Participant = {
  id: string;
  name: string;
  color: string;
  type: 'actor' | 'participant';
};

export type StepKind = 'message' | 'alt' | 'loop' | 'opt' | 'par';

export type ArrowKind = 'sync' | 'response' | 'async' | 'create' | 'destroy';

export type MessageStep = {
  id: string;
  kind: 'message';
  from: string;
  to: string;
  arrow: ArrowKind;
  label: string;
};

export type Branch = {
  id: string;
  label: string;
  steps: Step[];
};

export type AltStep = {
  id: string;
  kind: 'alt';
  branches: Branch[];
};

export type LoopStep = {
  id: string;
  kind: 'loop';
  label: string;
  steps: Step[];
};

export type OptStep = {
  id: string;
  kind: 'opt';
  label: string;
  steps: Step[];
};

export type ParStep = {
  id: string;
  kind: 'par';
  branches: Branch[];
};

export type Step = MessageStep | AltStep | LoopStep | OptStep | ParStep;

export type DiagramModel = {
  participants: Participant[];
  steps: Step[];
};
