export type StateNodeKind =
  | 'state'
  | 'start'
  | 'end'
  | 'choice'
  | 'fork'
  | 'join';

export type StateNode = {
  id: string;
  name: string;
  kind: StateNodeKind;
  parentId: string;
};

export type StateTransition = {
  id: string;
  from: string;
  to: string;
  label: string;
};

export type StateMachineModel = {
  states: StateNode[];
  transitions: StateTransition[];
};
