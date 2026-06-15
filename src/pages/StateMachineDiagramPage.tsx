import { useEffect, useMemo, useState } from 'react';
import {
  Code2,
  Copy,
  Download,
  Eye,
  ArrowLeft,
  Moon,
  Plus,
  RefreshCcw,
  Sun,
  Trash2,
} from 'lucide-react';
import MermaidPreview from '../components/MermaidPreview';
import { StateMachineBuilder } from '../components/StateMachineBuilder';
import { generateStateMachineMermaid } from '../stateMachineGenerator';
import { parseStateMachineMermaidToModel } from '../stateMachineParser';
import { defaultStateMachineModel } from '../stateMachineSample';
import {
  loadStateMachineCode,
  loadStateMachineMode,
  loadStateMachineModel,
  saveStateMachineCode,
  saveStateMachineMode,
  saveStateMachineModel,
} from '../stateMachineStorage';
import {
  type EditorMode,
  loadTheme,
  saveTheme,
} from '../storage';
import type { StateMachineModel } from '../stateMachineTypes';
import type { ThemeMode } from '../types';

type ActiveView = EditorMode | 'preview';

type StateMachineDiagramPageProps = {
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

export function StateMachineDiagramPage({
  onNavigateHome,
}: StateMachineDiagramPageProps) {
  const [model, setModel] = useState<StateMachineModel>(() =>
    loadStateMachineModel(),
  );
  const generatedCode = useMemo(() => generateStateMachineMermaid(model), [model]);
  const [code, setCode] = useState(() => loadStateMachineCode(generatedCode));
  const [mode, setMode] = useState<EditorMode>(() => loadStateMachineMode());
  const [activeView, setActiveView] = useState<ActiveView>(() =>
    loadStateMachineMode(),
  );
  const [theme, setTheme] = useState<ThemeMode>(() => loadTheme());
  const activeCode = mode === 'builder' ? generatedCode : code;

  useEffect(() => {
    saveStateMachineModel(model);
  }, [model]);

  useEffect(() => {
    saveStateMachineCode(code);
  }, [code]);

  useEffect(() => {
    if (mode === 'builder' && code !== generatedCode) {
      setCode(generatedCode);
    }
  }, [code, generatedCode, mode]);

  useEffect(() => {
    saveStateMachineMode(mode);
  }, [mode]);

  useEffect(() => {
    saveTheme(theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const resetExample = () => {
    const nextCode = generateStateMachineMermaid(defaultStateMachineModel);
    setModel(defaultStateMachineModel);
    setCode(nextCode);
  };

  const clearDiagram = () => {
    const emptyModel: StateMachineModel = {
      states: [],
      transitions: [],
    };
    const nextCode = generateStateMachineMermaid(emptyModel);
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
      setModel(parseStateMachineMermaidToModel(nextCode, model));
    } catch {
      // Keep code mode editable; MermaidPreview handles syntax errors.
    }
  };

  const switchMode = (nextMode: EditorMode) => {
    if (nextMode === 'builder') {
      try {
        setModel(parseStateMachineMermaidToModel(code, model));
      } catch {
        // Keep the last valid builder model if raw code is temporarily invalid.
      }
    }

    setMode(nextMode);
    setActiveView(nextMode);
  };

  const downloadSvg = () => {
    const svg = getSvgFromPreview();
    if (svg) {
      downloadText('state-machine-diagram.svg', svg, 'image/svg+xml');
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>State Machine Diagram Builder</h1>
          <p>Model states, transitions, choices, forks, joins, and terminal paths.</p>
        </div>
        <div className="toolbar" aria-label="Diagram actions">
          <button type="button" className="back-button" onClick={onNavigateHome} aria-label="Back to home">
            <ArrowLeft size={18} />
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
            onClick={() =>
              downloadText('state-machine-diagram.mmd', activeCode, 'text/plain')
            }
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
          aria-label="State machine diagram editor"
        >
          <div className="pane-title">
            <h2>{mode === 'builder' ? 'Builder' : 'Mermaid Code'}</h2>
            {mode === 'builder' && <span>Generates Mermaid automatically</span>}
          </div>
          {activeView === 'builder' ? (
            <StateMachineBuilder model={model} onChange={setModel} />
          ) : (
            <textarea
              className="code-editor"
              value={code}
              onChange={(event) => updateCode(event.target.value)}
              spellCheck={false}
              aria-label="Mermaid state machine diagram code"
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
          <MermaidPreview code={activeCode} theme={theme} />
        </section>
      </section>
    </main>
  );
}
