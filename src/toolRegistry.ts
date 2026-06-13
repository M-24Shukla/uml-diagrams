import type { ComponentType } from 'react';
import { ClassDiagramPage } from './pages/ClassDiagramPage';
import { SequenceDiagramPage } from './pages/SequenceDiagramPage';

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
];
