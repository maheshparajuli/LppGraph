import { useState } from 'react';
import './App.css';

const parseGraphFile = (content) => {
  const lines = content.split('\n');
  let edges = [];
  let nVertices = 0;

  for (const line of lines) {
    if (line.startsWith('p')) {
      const parts = line.split(' ');
      nVertices = parseInt(parts[2]);
    } else if (line.startsWith('e')) {
      const [, v1, v2] = line.split(' ');
      edges.push([parseInt(v1) - 1, parseInt(v2) - 1]);
    }
  }

  const adjMatrix = Array(nVertices).fill().map(() => Array(nVertices).fill(0));
  edges.forEach(([v1, v2]) => {
    adjMatrix[v1][v2] = 1;
    adjMatrix[v2][v1] = 1;
  });

  return adjMatrix;
};

const checkIsomorphism = (graph1, graph2) => {
  if (!graph1 || !graph2 || graph1.length !== graph2.length) {
    return { isIsomorphic: false, mapping: {} };
  }

  const edges1 = graph1.flat().reduce((a, b) => a + b, 0) / 2;
  const edges2 = graph2.flat().reduce((a, b) => a + b, 0) / 2;

  if (edges1 !== edges2) {
    return { isIsomorphic: false, mapping: {} };
  }

  const degrees1 = graph1.map(row => row.reduce((a, b) => a + b, 0)).sort();
  const degrees2 = graph2.map(row => row.reduce((a, b) => a + b, 0)).sort();

  if (JSON.stringify(degrees1) !== JSON.stringify(degrees2)) {
    return { isIsomorphic: false, mapping: {} };
  }

  return {
    isIsomorphic: JSON.stringify(degrees1) === JSON.stringify(degrees2),
    mapping: {}
  };
};

function App() {
  const [graph1, setGraph1] = useState(null);
  const [graph2, setGraph2] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [vertices1, setVertices1] = useState(4);
  const [vertices2, setVertices2] = useState(4);

  const generateRandomGraph = (vertices) => {
    const matrix = Array(vertices).fill().map(() => Array(vertices).fill(0));
    for (let i = 0; i < vertices; i++) {
      for (let j = i + 1; j < vertices; j++) {
        if (Math.random() > 0.5) {
          matrix[i][j] = 1;
          matrix[j][i] = 1;
        }
      }
    }
    return matrix;
  };

  const handleFileUpload = (e, setGraph) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const matrix = parseGraphFile(content);
          setGraph(matrix);
          setError(null);
        } catch (err) {
          setError("Error parsing graph file. Please check the format.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleGenerateGraph = (setGraph, vertices) => {
    const graph = generateRandomGraph(vertices);
    setGraph(graph);
    setError(null);
  };

  const checkGraphs = () => {
    if (graph1 && graph2) {
      const { isIsomorphic } = checkIsomorphism(graph1, graph2);
      setResult(isIsomorphic);
    }
  };

  const renderMatrix = (matrix) => {
    if (!matrix) return null;
    return (
      <div className="matrix-container">
        {matrix.map((row, i) => (
          <div key={i} className="matrix-row">
            {row.map((cell, j) => (
              <div key={j} className="matrix-cell">
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="app-container">
      <h1>Graph Isomorphism Checker</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="graphs-container">
        <div className="graph-section">
          <h2>Graph 1</h2>
          <div className="graph-input-options">
            <input
              type="file"
              accept=".graph"
              onChange={(e) => handleFileUpload(e, setGraph1)}
              className="file-input"
            />
            <div className="generate-section">
              <input
                type="number"
                min="2"
                max="10"
                value={vertices1}
                onChange={(e) => setVertices1(parseInt(e.target.value))}
                className="vertices-input"
              />
              <button 
                onClick={() => handleGenerateGraph(setGraph1, vertices1)}
                className="generate-button"
              >
                Generate Random Graph
              </button>
            </div>
          </div>
          {renderMatrix(graph1)}
        </div>

        <div className="graph-section">
          <h2>Graph 2</h2>
          <div className="graph-input-options">
            <input
              type="file"
              accept=".graph"
              onChange={(e) => handleFileUpload(e, setGraph2)}
              className="file-input"
            />
            <div className="generate-section">
              <input
                type="number"
                min="2"
                max="10"
                value={vertices2}
                onChange={(e) => setVertices2(parseInt(e.target.value))}
                className="vertices-input"
              />
              <button 
                onClick={() => handleGenerateGraph(setGraph2, vertices2)}
                className="generate-button"
              >
                Generate Random Graph
              </button>
            </div>
          </div>
          {renderMatrix(graph2)}
        </div>
      </div>

      <button
        onClick={checkGraphs}
        disabled={!graph1 || !graph2}
        className="check-button"
      >
        Check Isomorphism
      </button>

      {result !== null && (
        <div className="result-container">
          <h2>Result:</h2>
          <p>{result ? "The graphs are isomorphic!" : "The graphs are not isomorphic."}</p>
        </div>
      )}
    </div>
  );
}

export default App;
