# Reproduce a measurement with Chrome DevTools

1. Build and serve the production apps:
   ```bash
   npm run build
   npm run serve      # React :4171, Angular :4172, Vue :4173, Svelte :4174
   ```
2. Open one app in Chrome, then DevTools > **Performance** tab.
3. Click **Record**, click a benchmark button in the page (e.g. *Render 1000*), wait for the list, click **Stop**.
4. In the recording, read the click task in the **Main** track: *Scripting* (framework work + DOM patch),
   then *Rendering* (style/layout) and *Painting*. The page also prints its own result under the buttons.
5. Memory: DevTools > **Memory** tab, click the trash icon (collect garbage), take a heap snapshot,
   then *Render 1000*, collect garbage again and take a second snapshot. Compare the totals.

You can also call the API from the Console, exactly as the automated runner does:

```js
await __bench.render(1000)   // { scriptMs, totalMs }
await __bench.update(50)
await __bench.remove(50)
__bench.heap()               // performance.memory.usedJSHeapSize (Chrome only)
```

Tip: in the Performance tab you can enable **CPU: 4x slowdown** to simulate a slower phone;
the differences between frameworks become larger.
