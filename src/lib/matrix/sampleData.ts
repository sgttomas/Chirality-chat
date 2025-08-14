import type { ChiralityMatrix } from './types'

// Sample chiral molecule: (R)-2-Butanol
export const sampleChiralMolecule: ChiralityMatrix = {
  id: 'r-2-butanol',
  title: '(R)-2-Butanol',
  nodes: [
    {
      id: 'c1',
      position: { x: 0, y: 0, z: 0 },
      label: 'C1',
      type: 'atom',
      properties: {
        element: 'C',
        chirality: 'none'
      },
      connections: ['c2', 'h1', 'h2', 'h3']
    },
    {
      id: 'c2',
      position: { x: 30, y: 0, z: 0 },
      label: 'C2*',
      type: 'center',
      properties: {
        element: 'C',
        chirality: 'R'
      },
      connections: ['c1', 'c3', 'o1', 'h4']
    },
    {
      id: 'c3',
      position: { x: 60, y: 0, z: 0 },
      label: 'C3',
      type: 'atom',
      properties: {
        element: 'C',
        chirality: 'none'
      },
      connections: ['c2', 'c4', 'h5', 'h6']
    },
    {
      id: 'c4',
      position: { x: 90, y: 0, z: 0 },
      label: 'C4',
      type: 'atom',
      properties: {
        element: 'C',
        chirality: 'none'
      },
      connections: ['c3', 'h7', 'h8', 'h9']
    },
    {
      id: 'o1',
      position: { x: 30, y: -25, z: 0 },
      label: 'O',
      type: 'atom',
      properties: {
        element: 'O',
        chirality: 'none'
      },
      connections: ['c2', 'h10']
    },
    // Hydrogen atoms
    {
      id: 'h1',
      position: { x: -15, y: 10, z: 0 },
      label: 'H',
      type: 'atom',
      properties: { element: 'H' },
      connections: ['c1']
    },
    {
      id: 'h2',
      position: { x: -15, y: -10, z: 0 },
      label: 'H',
      type: 'atom',
      properties: { element: 'H' },
      connections: ['c1']
    },
    {
      id: 'h3',
      position: { x: 0, y: 15, z: -10 },
      label: 'H',
      type: 'atom',
      properties: { element: 'H' },
      connections: ['c1']
    },
    {
      id: 'h4',
      position: { x: 30, y: 15, z: 10 },
      label: 'H',
      type: 'atom',
      properties: { element: 'H' },
      connections: ['c2']
    },
    {
      id: 'h5',
      position: { x: 60, y: 15, z: 0 },
      label: 'H',
      type: 'atom',
      properties: { element: 'H' },
      connections: ['c3']
    },
    {
      id: 'h6',
      position: { x: 60, y: -15, z: 0 },
      label: 'H',
      type: 'atom',
      properties: { element: 'H' },
      connections: ['c3']
    },
    {
      id: 'h7',
      position: { x: 105, y: 10, z: 0 },
      label: 'H',
      type: 'atom',
      properties: { element: 'H' },
      connections: ['c4']
    },
    {
      id: 'h8',
      position: { x: 105, y: -10, z: 0 },
      label: 'H',
      type: 'atom',
      properties: { element: 'H' },
      connections: ['c4']
    },
    {
      id: 'h9',
      position: { x: 90, y: 15, z: -10 },
      label: 'H',
      type: 'atom',
      properties: { element: 'H' },
      connections: ['c4']
    },
    {
      id: 'h10',
      position: { x: 30, y: -40, z: 0 },
      label: 'H',
      type: 'atom',
      properties: { element: 'H' },
      connections: ['o1']
    }
  ],
  edges: [
    { id: 'b1', from: 'c1', to: 'c2', type: 'bond', strength: 1 },
    { id: 'b2', from: 'c2', to: 'c3', type: 'bond', strength: 1 },
    { id: 'b3', from: 'c3', to: 'c4', type: 'bond', strength: 1 },
    { id: 'b4', from: 'c2', to: 'o1', type: 'bond', strength: 1 },
    { id: 'b5', from: 'c1', to: 'h1', type: 'bond', strength: 1 },
    { id: 'b6', from: 'c1', to: 'h2', type: 'bond', strength: 1 },
    { id: 'b7', from: 'c1', to: 'h3', type: 'bond', strength: 1 },
    { id: 'b8', from: 'c2', to: 'h4', type: 'bond', strength: 1 },
    { id: 'b9', from: 'c3', to: 'h5', type: 'bond', strength: 1 },
    { id: 'b10', from: 'c3', to: 'h6', type: 'bond', strength: 1 },
    { id: 'b11', from: 'c4', to: 'h7', type: 'bond', strength: 1 },
    { id: 'b12', from: 'c4', to: 'h8', type: 'bond', strength: 1 },
    { id: 'b13', from: 'c4', to: 'h9', type: 'bond', strength: 1 },
    { id: 'b14', from: 'o1', to: 'h10', type: 'bond', strength: 1 }
  ],
  metadata: {
    molecularFormula: 'C₄H₁₀O',
    stereoCenters: 1,
    confidence: 0.95,
    timestamp: new Date().toISOString(),
    source: 'sample_data'
  }
}

// Sample complex molecule with multiple stereocenters
export const sampleComplexMolecule: ChiralityMatrix = {
  id: 'glucose',
  title: 'D-Glucose',
  nodes: [
    {
      id: 'c1',
      position: { x: 0, y: 0, z: 0 },
      label: 'C1*',
      type: 'center',
      properties: { element: 'C', chirality: 'R' },
      connections: ['c2', 'o1', 'h1', 'oh1']
    },
    {
      id: 'c2',
      position: { x: 30, y: 20, z: 0 },
      label: 'C2*',
      type: 'center',
      properties: { element: 'C', chirality: 'R' },
      connections: ['c1', 'c3', 'h2', 'oh2']
    },
    {
      id: 'c3',
      position: { x: 60, y: 0, z: 0 },
      label: 'C3*',
      type: 'center',
      properties: { element: 'C', chirality: 'S' },
      connections: ['c2', 'c4', 'h3', 'oh3']
    },
    {
      id: 'c4',
      position: { x: 90, y: 20, z: 0 },
      label: 'C4*',
      type: 'center',
      properties: { element: 'C', chirality: 'S' },
      connections: ['c3', 'c5', 'h4', 'oh4']
    },
    {
      id: 'c5',
      position: { x: 120, y: 0, z: 0 },
      label: 'C5*',
      type: 'center',
      properties: { element: 'C', chirality: 'R' },
      connections: ['c4', 'c6', 'h5', 'o1']
    },
    {
      id: 'c6',
      position: { x: 140, y: -20, z: 0 },
      label: 'C6',
      type: 'atom',
      properties: { element: 'C', chirality: 'none' },
      connections: ['c5', 'h6a', 'h6b', 'oh6']
    },
    {
      id: 'o1',
      position: { x: 100, y: -25, z: 0 },
      label: 'O',
      type: 'atom',
      properties: { element: 'O', chirality: 'none' },
      connections: ['c1', 'c5']
    },
    // OH groups and H atoms (simplified representation)
    {
      id: 'oh1',
      position: { x: -15, y: -15, z: 0 },
      label: 'OH',
      type: 'group',
      properties: { chirality: 'none' },
      connections: ['c1']
    },
    {
      id: 'oh2',
      position: { x: 30, y: 40, z: 0 },
      label: 'OH',
      type: 'group',
      properties: { chirality: 'none' },
      connections: ['c2']
    },
    {
      id: 'oh3',
      position: { x: 60, y: -20, z: 0 },
      label: 'OH',
      type: 'group',
      properties: { chirality: 'none' },
      connections: ['c3']
    },
    {
      id: 'oh4',
      position: { x: 90, y: 40, z: 0 },
      label: 'OH',
      type: 'group',
      properties: { chirality: 'none' },
      connections: ['c4']
    },
    {
      id: 'oh6',
      position: { x: 160, y: -30, z: 0 },
      label: 'OH',
      type: 'group',
      properties: { chirality: 'none' },
      connections: ['c6']
    }
  ],
  edges: [
    { id: 'b1', from: 'c1', to: 'c2', type: 'bond', strength: 1 },
    { id: 'b2', from: 'c2', to: 'c3', type: 'bond', strength: 1 },
    { id: 'b3', from: 'c3', to: 'c4', type: 'bond', strength: 1 },
    { id: 'b4', from: 'c4', to: 'c5', type: 'bond', strength: 1 },
    { id: 'b5', from: 'c5', to: 'c6', type: 'bond', strength: 1 },
    { id: 'b6', from: 'c1', to: 'o1', type: 'bond', strength: 1 },
    { id: 'b7', from: 'c5', to: 'o1', type: 'bond', strength: 1 },
    { id: 'b8', from: 'c1', to: 'oh1', type: 'bond', strength: 1 },
    { id: 'b9', from: 'c2', to: 'oh2', type: 'bond', strength: 1 },
    { id: 'b10', from: 'c3', to: 'oh3', type: 'bond', strength: 1 },
    { id: 'b11', from: 'c4', to: 'oh4', type: 'bond', strength: 1 },
    { id: 'b12', from: 'c6', to: 'oh6', type: 'bond', strength: 1 }
  ],
  metadata: {
    molecularFormula: 'C₆H₁₂O₆',
    stereoCenters: 5,
    confidence: 0.92,
    timestamp: new Date().toISOString(),
    source: 'sample_data'
  }
}

export const sampleMatrices = [sampleChiralMolecule, sampleComplexMolecule]