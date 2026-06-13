import { useEffect, useMemo, useState } from 'react';
import {
  Code2,
  Copy,
  Download,
  Eye,
  Home,
  Moon,
  Plus,
  RefreshCcw,
  Sun,
  Trash2,
} from 'lucide-react';
import MermaidPreview from '../components/MermaidPreview';
import { BuilderPanel } from '../components/BuilderPanel';
import { generateMermaid } from '../mermaidGenerator';
import { parseMermaidToModel } from '../mermaidParser';
import { defaultModel } from '../sample';
import {
  type EditorMode,
  loadCode,
  loadMode,
  loadModel,
  loadTheme,
  saveCode,
  saveMode,
  saveModel,
  saveTheme,
} from '../storage';
import type { DiagramModel, ThemeMode } from '../types';

type ActiveView = EditorMode | 'preview';

type SequenceDiagramPageProps = {
  onNavigateHome: () => void;
};

const downloadText = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const getSvgFromPreview = () =>
  document.querySelector<HTMLElement>('.preview-scroll svg')?.outerHTML ?? '';

export function SequenceDiagramPage({ onNavigateHome }: SequenceDiagramPageProps) {
  const [model, setModel] = useState<DiagramModel>(() => loadModel());
  const generatedCode = useMemo(() => generateMermaid(model), [model]);
  const [code, setCode] = useState(() => loadCode(generatedCode));
  const [mode, setMode] = useState<EditorMode>(() => loadMode());
  const [activeView, setActiveView] = useState<ActiveView>(() => loadMode());
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());
  const activeCode = mode === 'builder' ? generatedCode : code;

  useEffect(() => {
    saveModel(model);
  }, [model]);

  useEffect(() => {
    saveCode(code);
  }, [code]);

  useEffect(() => {
    if (mode === 'builder' && code !== generatedCode) {
      setCode(generatedCode);
    }
  }, [code, generatedCode, mode]);

  useEffect(() => {
    saveMode(mode);
  }, [mode]);

  useEffect(() => {
    saveTheme(theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const resetExample = () => {
    const nextCode = generateMermaid(defaultModel);
    setModel(defaultModel);
    setCode(nextCode);
  };

  const clearDiagram = () => {
    const emptyModel: DiagramModel = {
      participants: [],
      steps: [],
    };
    const nextCode = generateMermaid(emptyModel);
    setModel(emptyModel);
    setCode(nextCode);
    setMode('builder');
    setActiveView('builder');
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(activeCode);
  };

  const updateCode = (nextCode: string) => {
    setCode(nextCode);

    try {
      setModel(parseMermaidToModel(nextCode, model));
    } catch {
      // Keep raw code editable; the preview remains responsible for syntax errors.
    }
  };

  const switchMode = (nextMode: EditorMode) => {
    if (nextMode === 'builder') {
      try {
        setModel(parseMermaidToModel(code, model));
      } catch {
        // If the raw code is invalid, keep the last valid builder model.
      }
    }

    setMode(nextMode);
    setActiveView(nextMode);
  };

  const downloadSvg = () => {
    const svg = getSvgFromPreview();
    if (svg) {
      downloadText('sequence-diagram.svg', svg, 'image/svg+xml');
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>Sequence Diagram Builder</h1>
          <p>Build visually or edit Mermaid directly.</p>
        </div>
        <div className="toolbar" aria-label="Diagram actions">
          <button type="button" onClick={onNavigateHome} aria-label="Go home">
            <Home size={16} />
            Home
          </button>
          <div className="segmented" aria-label="Editor mode">
            <button
              className={activeView === 'builder' ? 'active' : ''}
              type="button"
              onClick={() => switchMode('builder')}
            >
              <Plus size={16} />
              Builder
            </button>
            <button
              className={activeView === 'code' ? 'active' : ''}
              type="button"
              onClick={() => switchMode('code')}
            >
              <Code2 size={16} />
              Code
            </button>
            <button
              className={`preview-mode-button ${
                activeView === 'preview' ? 'active' : ''
              }`}
              type="button"
              onClick={() => setActiveView('preview')}
            >
              <Eye size={16} />
              Preview
            </button>
          </div>
          <button type="button" onClick={resetExample} aria-label="Reset example">
            <RefreshCcw size={16} />
            Reset
          </button>
          <button type="button" onClick={clearDiagram} aria-label="Clear diagram">
            <Trash2 size={16} />
            Clear
          </button>
          <button type="button" onClick={copyCode} aria-label="Copy Mermaid code">
            <Copy size={16} />
            Copy
          </button>
          <button
            type="button"
            onClick={() => downloadText('sequence-diagram.mmd', activeCode, 'text/plain')}
            aria-label="Download Mermaid file"
          >
            <Download size={16} />
            .mmd
          </button>
          <button type="button" onClick={downloadSvg} aria-label="Download SVG">
            <Download size={16} />
            .svg
          </button>
          <button
            type="button"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </header>

      <section className="workspace">
        <section
          className={`pane editor-pane ${
            activeView === 'preview' ? 'is-hidden-view' : ''
          }`}
          aria-label="Diagram editor"
        >
          <div className="pane-title">
            <h2>{mode === 'builder' ? 'Builder' : 'Mermaid Code'}</h2>
            {mode === 'builder' && <span>Generates Mermaid automatically</span>}
          </div>
          {activeView === 'builder' ? (
            <BuilderPanel model={model} onChange={setModel} />
          ) : (
            <textarea
              className="code-editor"
              value={code}
              onChange={(event) => updateCode(event.target.value)}
              spellCheck={false}
              aria-label="Mermaid sequence diagram code"
            />
          )}
        </section>

        <section
          className={`pane preview-pane ${
            activeView === 'preview' ? 'is-active-preview' : ''
          }`}
          aria-label="Live diagram preview"
        >
          <div className="pane-title">
            <h2>Live Preview</h2>
            <span>{mode === 'builder' ? 'Generated Mermaid' : 'Raw Mermaid'}</span>
          </div>
          <MermaidPreview
            code={activeCode}
            participants={model.participants}
            theme={theme}
          />
        </section>
      </section>
    </main>
  );
}
