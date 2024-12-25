import { useState } from 'react';
import './App.css';
import GLPK from 'glpk.js'; // Install glpk.js for solving LPP
import ForceGraph2D from 'react-force-graph-2d';

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

const adjMatrixToGraph = (adjMatrix) => {
  const nodes = adjMatrix.map((_, i) => ({ id: i }));
  const links = [];
  adjMatrix.forEach((row, i) => {
    row.forEach((val, j) => {
      if (val === 1 && i < j) {
        links.push({ source: i, target: j });
      }
    });
  });
  return { nodes, links };
};

// Random graph generator
const generateRandomGraph = (nVertices, nEdges) => {
  const adjMatrix = Array(nVertices).fill().map(() => Array(nVertices).fill(0));

  let edgeCount = 0;
  while (edgeCount < nEdges) {
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

const checkIsomorphismLPP = async (graph1, graph2) => {
  if (!graph1 || !graph2 || graph1.length !== graph2.length) {
    return { isIsomorphic: false, mapping: {} };
  }

  const n = graph1.length;
  const glpk = await GLPK();

  // LPP for Permutation Matrix Constraints
  const lp = {
    name: "Graph Isomorphism",
    objective: {
      direction: glpk.GLP_MIN,
      name: "cost",
      vars: Array(n * n).fill(0).map((_, i) => ({
        name: `x${i}`,
        coef: 0,
      })),
    },
    subjectTo: [],
    binaries: Array(n * n).fill(0).map((_, i) => ({
      name: `x${i}`,
    })),
  };

  // Constraint 1: Each row has exactly one 1
  for (let i = 0; i < n; i++) {
    lp.subjectTo.push({
      name: `row_${i}`,
      vars: Array(n).fill(0).map((_, j) => ({
        name: `x${i * n + j}`,
        coef: 1,
      })),
      bnds: { type: glpk.GLP_FX, lb: 1, ub: 1 },
    });
  }

  // Constraint 2: Each column has exactly one 1
  for (let j = 0; j < n; j++) {
    lp.subjectTo.push({
      name: `col_${j}`,
      vars: Array(n).fill(0).map((_, i) => ({
        name: `x${i * n + j}`,
        coef: 1,
      })),
      bnds: { type: glpk.GLP_FX, lb: 1, ub: 1 },
    });
  }

  // Objective Function: Match graph1 and graph2 under permutation
  lp.subjectTo.push({
    name: "isomorphism",
    vars: [],
    bnds: { type: glpk.GLP_FX, lb: 0, ub: 0 },
  });

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < n; k++) {
        for (let l = 0; l < n; l++) {
          if (graph1[i][j] !== graph2[k][l]) continue;
          lp.subjectTo[lp.subjectTo.length - 1].vars.push({
            name: `x${i * n + k}`,
            coef: -graph1[i][j],
          });
        }
      }
    }
  }

  // Solve the LPP
  const result = glpk.solve(lp, glpk.GLP_MSG_OFF);
  if (result.status === glpk.GLP_OPT) {
    const mapping = {};
    result.vars.forEach((val, key) => {
      if (val === 1) {
        const i = Math.floor(key / n);
        const j = key % n;
        mapping[i] = j;
      }
    });
    return { isIsomorphic: true, mapping };
  }
  return { isIsomorphic: false, mapping: {} };
};

function App() {
  const [graph1, setGraph1] = useState(null);
  const [graph2, setGraph2] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [graphData1, setGraphData1] = useState(null);
  const [graphData2, setGraphData2] = useState(null);

  const handleGenerateGraph = (setGraph, setGraphData) => {
    const vertices = parseInt(prompt("Enter number of vertices:"));
    const edges = parseInt(prompt("Enter number of edges:"));
    if (!isNaN(vertices) && !isNaN(edges) && vertices > 0 && edges >= 0) {
      const randomGraph = generateRandomGraph(vertices, edges);
      setGraph(randomGraph);
      setGraphData(adjMatrixToGraph(randomGraph));
    } else {
      alert("Invalid input. Please enter valid values.");
    }
  };

  const handleFileUpload = (event, setGraph, setGraphData) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const graph = parseGraphFile(content);
        setGraph(graph);
        setGraphData(adjMatrixToGraph(graph));
      };
      reader.readAsText(file);
    }
  };

  const checkGraphs = async () => {
    if (graph1 && graph2) {
      const { isIsomorphic } = await checkIsomorphismLPP(graph1, graph2);
      setResult(isIsomorphic);
    }
  };

  return (
    <div className="app-container">
      <h1>Graph Isomorphism Checker</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="graphs-container">
        <div className="graph-section">
          <h2>Graph 1</h2>
          <button onClick={() => handleGenerateGraph(setGraph1, setGraphData1)}>Generate Random Graph</button>
          <input type="file" accept=".txt" onChange={(e) => handleFileUpload(e, setGraph1, setGraphData1)} />
          {graphData1 && (
            <div className="graph-container">
              <ForceGraph2D graphData={graphData1} />
            </div>
          )}
        </div>

        <div className="graph-section">
          <h2>Graph 2</h2>
          <button onClick={() => handleGenerateGraph(setGraph2, setGraphData2)}>Generate Random Graph</button>
          <input type="file" accept=".txt" onChange={(e) => handleFileUpload(e, setGraph2, setGraphData2)} />
          {graphData2 && (
            <div className="graph-container">
              <ForceGraph2D graphData={graphData2} />
            </div>
          )}
        </div>
      </div>

      <button onClick={checkGraphs} disabled={!graph1 || !graph2}>
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
