'use client';

import { useState } from 'react';

export default function TestCore() {
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadState = async () => {
    try {
      const response = await fetch('/api/core/state');
      const data = await response.json();
      setState(data);
    } catch (error) {
      console.error('Error loading state:', error);
    }
  };

  const setProblem = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/core/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: {
            title: 'Data Pipeline Optimization',
            statement: 'We need to optimize our data processing pipeline for better performance',
            initialVector: ['performance', 'scalability', 'cost-effective']
          }
        })
      });
      const data = await response.json();
      setState(data);
    } catch (error) {
      console.error('Error setting problem:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDS = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/core/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'DS' })
      });
      const data = await response.json();
      console.log('DS Generation Result:', data);
      
      // Reload state to see the updated finals
      await loadState();
    } catch (error) {
      console.error('Error generating DS:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Chirality Core Test Interface</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={loadState} style={{ marginRight: '10px' }}>
          Load State
        </button>
        <button onClick={setProblem} disabled={loading} style={{ marginRight: '10px' }}>
          {loading ? 'Setting...' : 'Set Test Problem'}
        </button>
        <button onClick={generateDS} disabled={loading || !state?.problem?.statement}>
          {loading ? 'Generating...' : 'Generate DS'}
        </button>
      </div>

      {state && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Current State:</h3>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '400px'
          }}>
            {JSON.stringify(state, null, 2)}
          </pre>
        </div>
      )}

      {state?.finals?.DS && (
        <div>
          <h3>Generated Data Sheet (DS):</h3>
          <div style={{ background: '#e8f5e8', padding: '15px', borderRadius: '8px' }}>
            <h4>Data Field:</h4>
            <p>{state.finals.DS.text.data_field}</p>
            
            <h4>Type:</h4>
            <p>{state.finals.DS.text.type || 'Not specified'}</p>
            
            <h4>Terms Used:</h4>
            <p>{state.finals.DS.terms_used?.join(', ') || 'None'}</p>
            
            <h4>Source References:</h4>
            <p>{state.finals.DS.text.source_refs?.join(', ') || 'None'}</p>
            
            {state.finals.DS.warnings?.length > 0 && (
              <>
                <h4 style={{ color: 'orange' }}>Warnings:</h4>
                <p style={{ color: 'orange' }}>{state.finals.DS.warnings.join(', ')}</p>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>This test interface verifies the graph-free Chirality Core system is working.</p>
        <p>The DS generation uses OpenAI gpt-4.1-nano to create structured documents.</p>
      </div>
    </div>
  );
}