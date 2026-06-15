import type { ComponentType } from 'react';
import { ActivityDiagramPage } from './pages/ActivityDiagramPage';
import { ClassDiagramPage } from './pages/ClassDiagramPage';
import { SequenceDiagramPage } from './pages/SequenceDiagramPage';
import { StateMachineDiagramPage } from './pages/StateMachineDiagramPage';

export type DiagramPageProps = {
  onNavigateHome: () => void;
};

export type DiagramDefinition = {
  path: string;
  title: string;
  description: string;
  Component: ComponentType<DiagramPageProps>;
};

export const diagrams: DiagramDefinition[] = [
  {
    path: '/sequence-diagram',
    title: 'Sequence Diagram',
    description: 'Model actors, calls, branches, loops, and Mermaid output.',
    Component: SequenceDiagramPage,
  },
  {
    path: '/class-diagram',
    title: 'Class Diagram',
    description: 'Design classes, members, and UML relationships with Mermaid.',
    Component: ClassDiagramPage,
  },
  {
    path: '/activity-diagram',
    title: 'Activity Diagram',
    description: 'Map workflows with swimlanes, decisions, loops, and fork/join paths.',
    Component: ActivityDiagramPage,
  },
  {
    path: '/state-machine-diagram',
    title: 'State Machine Diagram',
    description: 'Model state lifecycles with events, choices, forks, and terminal states.',
    Component: StateMachineDiagramPage,
  },
];
