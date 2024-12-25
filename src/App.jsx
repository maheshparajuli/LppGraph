import { useState } from 'react';
import './App.css';
import GLPK from 'glpk.js'; // Install glpk.js for solving LPP
import ForceGraph2D from 'react-force-graph-2d'; // Install react-force-graph

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

const generateGraphData = (adjMatrix) => {
  const nodes = adjMatrix.map((_, i) => ({ id: i }));
  const links = [];

  adjMatrix.forEach((row, i) => {
    row.forEach((value, j) => {
      if (value === 1 && i < j) {
        links.push({ source: i, target: j });
      }
    });
  });

  return { nodes, links };
};

const generateRandomGraph = (nVertices, edgeDensity) => {
  const adjMatrix = Array(nVertices).fill().map(() => Array(nVertices).fill(0));
  const maxEdges = Math.floor(nVertices * (nVertices - 1) / 2 * edgeDensity);

  let edgeCount = 0;
  while (edgeCount < maxEdges) {
    const v1 = Math.floor(Math.random() * nVertices);
    const v2 = Math.floor(Math.random() * nVertices);
    if (v1 !== v2 && adjMatrix[v1][v2] === 0) {
      adjMatrix[v1][v2] = 1;
      adjMatrix[v2][v1] = 1;
      edgeCount++;
    }
  }

  return adjMatrix;
};

const App = () => {
  const [graph1, setGraph1] = useState(null);
  const [graph2, setGraph2] = useState(null);
  const [error, setError] = useState(null);

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

  const handleGenerateGraph = (setGraph) => {
    const vertices = parseInt(prompt("Enter number of vertices:"));
    const density = parseFloat(prompt("Enter edge density (0.0 to 1.0):"));
    if (!isNaN(vertices) && !isNaN(density) && vertices > 0 && density >= 0 && density <= 1) {
      const randomGraph = generateRandomGraph(vertices, density);
      setGraph(randomGraph);
    } else {
      alert("Invalid input. Please enter valid values.");
    }
  };

  return (
    <div className="app-container">
      <h1>Graph Isomorphism Checker</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="graphs-container">
        <div className="graph-section">
          <h2>Graph 1</h2>
          <input type="file" accept=".graph" onChange={(e) => handleFileUpload(e, setGraph1)} />
          <button onClick={() => handleGenerateGraph(setGraph1)}>Generate Random Graph</button>
          {graph1 && <ForceGraph2D graphData={generateGraphData(graph1)} />} 
        </div>

        <div className="graph-section">
          <h2>Graph 2</h2>
          <input type="file" accept=".graph" onChange={(e) => handleFileUpload(e, setGraph2)} />
          <button onClick={() => handleGenerateGraph(setGraph2)}>Generate Random Graph</button>
          {graph2 && <ForceGraph2D graphData={generateGraphData(graph2)} />} 
        </div>
      </div>
    </div>
  );
};

export default App;
