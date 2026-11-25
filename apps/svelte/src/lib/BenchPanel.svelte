<script>
  let result = $state('');

  async function run(label, fn) {
    const r = await fn(window.__bench);
    result = `${label}: ${r.scriptMs} ms script, ${r.totalMs} ms until paint`;
  }
</script>

<div class="card bench">
  <div class="row">
    <strong>Benchmark</strong>
    <button onclick={() => run('Render 100', (b) => b.render(100))}>Render 100</button>
    <button onclick={() => run('Render 500', (b) => b.render(500))}>Render 500</button>
    <button onclick={() => run('Render 1000', (b) => b.render(1000))}>Render 1000</button>
    <button onclick={() => run('Update 50', (b) => b.update(50))}>Update 50</button>
    <button onclick={() => run('Delete 50', (b) => b.remove(50))}>Delete 50</button>
    <button class="ghost" onclick={() => run('Clear', (b) => b.clear())}>Clear</button>
  </div>
  <div class="result" data-testid="bench-result">{result}</div>
</div>
