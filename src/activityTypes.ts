export type ActivityNodeKind =
  | 'start'
  | 'end'
  | 'action'
  | 'decision'
  | 'merge'
  | 'fork'
  | 'join'
  | 'loop';

export type Swimlane = {
  id: string;
  name: string;
};

export type ActivityNode = {
  id: string;
  label: string;
  kind: ActivityNodeKind;
  laneId: string;
};

export type ActivityTransition = {
  id: string;
  from: string;
  to: string;
  label: string;
};

export type ActivityDiagramModel = {
  swimlanes: Swimlane[];
  nodes: ActivityNode[];
  transitions: ActivityTransition[];
};
