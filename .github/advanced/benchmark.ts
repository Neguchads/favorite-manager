/* Microbenchmark: informational JSON and GitHub summary; never blocks on timing. */
import { performance } from 'node:perf_hooks';
import { writeFileSync, appendFileSync } from 'node:fs';

type Metric = { name: string; median_ms_per_operation: number; samples_ms: number[] };
async function measure(name: string, operation: () => unknown | Promise<unknown>, iterations: number): Promise<Metric> {
  await operation();
  const samples: number[] = [];
  for (let trial = 0; trial < 5; trial++) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) await operation();
    samples.push(Number(((performance.now() - start) / iterations).toFixed(6)));
  }
  const median = [...samples].sort((a, b) => a - b)[2];
  return { name, median_ms_per_operation: median, samples_ms: samples };
}
function emit(metrics: Metric[]): void {
  const report = {
    schema: 'stage3-benchmarks-v1', repository: process.env.GITHUB_REPOSITORY ?? 'local',
    sha: process.env.GITHUB_SHA ?? '', node: process.version, platform: process.platform,
    metrics, note: 'Informational only: compare on equivalent runners; no hard timing gate.'
  };
  writeFileSync('benchmark-results.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      '### Stage 3 benchmarks (informational)\n\n| Test | Median ms/op |\n| --- | ---: |\n' +
      metrics.map(m => `| ${m.name} | ${m.median_ms_per_operation} |`).join('\n') + '\n');
  }
}


import { levenshteinDistance, parseSearchQuery } from '../../src/utils/search';
import { normalizeUrl } from '../../src/utils/url';

const metrics = [
  await measure('levenshteinDistance_32_chars',
    () => levenshteinDistance('synthetic bookmark title abcdef 1', 'synthetic bookmark topic abcdef 123'), 1500),
  await measure('parseSearchQuery',
    () => parseSearchQuery('domain:github.com folder:source sample keyword'), 1500),
  await measure('normalizeUrl',
    () => normalizeUrl('https://www.example.com/path/?utm_source=ad&keep=valid'), 1500)
];
emit(metrics);
