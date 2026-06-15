import { ArrowRight } from 'lucide-react';
import type { DiagramDefinition } from '../toolRegistry';

type HomePageProps = {
  diagrams: DiagramDefinition[];
  onNavigate: (path: string) => void;
};

export function HomePage({ diagrams, onNavigate }: HomePageProps) {
  return (
    <main className="home-shell">
      <section className="home-header">
        <div>
          <h1>UML Diagram Studio</h1>
          <p>Build Mermaid diagrams visually or from code.</p>
        </div>
      </section>

      <section className="diagram-grid" aria-label="Supported diagrams">
        {diagrams.map((diagram) => (
          <button
            className="diagram-card"
            key={diagram.path}
            type="button"
            onClick={() => onNavigate(diagram.path)}
          >
            <span>
              <strong>{diagram.title}</strong>
              <small>{diagram.description}</small>
            </span>
            <ArrowRight size={18} />
          </button>
        ))}
      </section>
    </main>
  );
}
