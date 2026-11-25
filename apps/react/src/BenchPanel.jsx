import { useState } from 'react';

// Buttons call the same window.__bench API used by the automated runner.
export default function BenchPanel() {
  const [result, setResult] = useState('');

  async function run(label, fn) {
    const r = await fn(window.__bench);
    setResult(`${label}: ${r.scriptMs} ms script, ${r.totalMs} ms until paint`);
  }

  return (
    <div className="card bench">
      <div className="row">
        <strong>Benchmark</strong>
        <button onClick={() => run('Render 100', (b) => b.render(100))}>Render 100</button>
        <button onClick={() => run('Render 500', (b) => b.render(500))}>Render 500</button>
        <button onClick={() => run('Render 1000', (b) => b.render(1000))}>Render 1000</button>
        <button onClick={() => run('Update 50', (b) => b.update(50))}>Update 50</button>
        <button onClick={() => run('Delete 50', (b) => b.remove(50))}>Delete 50</button>
        <button className="ghost" onClick={() => run('Clear', (b) => b.clear())}>Clear</button>
      </div>
      <div className="result" data-testid="bench-result">{result}</div>
    </div>
  );
}
