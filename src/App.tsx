import { useEffect, useMemo, useState } from 'react';
import { HomePage } from './pages/HomePage';
import { diagrams } from './toolRegistry';

const normalizePath = (path: string) => {
  if (!path || path === '/') {
    return '/';
  }

  return path.endsWith('/') ? path.slice(0, -1) : path;
};

function App() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setPath(normalizePath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const activeDiagram = useMemo(
    () => diagrams.find((diagram) => diagram.path === path),
    [path],
  );

  const navigate = (nextPath: string) => {
    const normalizedPath = normalizePath(nextPath);
    window.history.pushState({}, '', normalizedPath);
    setPath(normalizedPath);
  };

  if (activeDiagram) {
    const DiagramPage = activeDiagram.Component;
    return <DiagramPage onNavigateHome={() => navigate('/')} />;
  }

  return <HomePage diagrams={diagrams} onNavigate={navigate} />;
}

export default App;
