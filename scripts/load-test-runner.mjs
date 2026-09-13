const BASE_URL = 'https://careerverse-ai-gold.vercel.app';

// Realistic Journeys
const CANDIDATE_JOURNEY = [
  { path: '/', name: 'Homepage' },
  { path: '/jobs', name: 'Jobs Listing' },
  { path: '/api/opportunities', name: 'Opportunities API' },
  { path: '/internships', name: 'Internships Listing' },
  { path: '/api/search?q=engineer', name: 'Search API' },
  { path: '/create-resume', name: 'Resume Builder' }
];

const BROWSER_JOURNEY = [
  { path: '/', name: 'Homepage' },
  { path: '/events', name: 'Events Page' },
  { path: '/api/events', name: 'Events API' },
  { path: '/internships', name: 'Internships Listing' },
  { path: '/jobs', name: 'Jobs Listing' }
];

const RECRUITER_JOURNEY = [
  { path: '/', name: 'Homepage' },
  { path: '/api/opportunities', name: 'Opportunities API' },
  { path: '/api/search?q=intern', name: 'Talent/Search API' },
  { path: '/create-resume', name: 'Resume Portal' }
];

const JOURNEYS = [CANDIDATE_JOURNEY, BROWSER_JOURNEY, RECRUITER_JOURNEY];

export async function runLoadTest(concurrency, durationSec, rampUpSec = 5) {
  console.log(`\n======================================================`);
  console.log(`Starting Load Test: ${concurrency} Concurrent Virtual Users`);
  console.log(`Duration: ${durationSec}s | Ramp-Up: ${rampUpSec}s | Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  const results = {
    totalRequests: 0,
    status2xx: 0,
    status4xx: 0,
    status429: 0,
    status5xx: 0,
    timeouts: 0,
    errors: 0,
    latencies: [],
    endpointStats: {}
  };

  let stop = false;
  const startTime = Date.now();

  const timer = setTimeout(() => {
    stop = true;
  }, durationSec * 1000);

  // Virtual User worker
  async function virtualUser(id, delayStart) {
    if (delayStart > 0) {
      await new Promise((r) => setTimeout(r, delayStart));
    }
    const journey = JOURNEYS[id % JOURNEYS.length];

    while (!stop) {
      for (const step of journey) {
        if (stop) break;

        const url = BASE_URL + step.path;
        const reqStart = Date.now();

        if (!results.endpointStats[step.path]) {
          results.endpointStats[step.path] = { count: 0, totalMs: 0, errors: 0, latencies: [] };
        }

        try {
          const controller = new AbortController();
          const reqTimeout = setTimeout(() => controller.abort(), 10000);

          const res = await fetch(url, {
            headers: {
              'User-Agent': `CareerVerse-LoadTester-VU/${id}`,
              'Accept': 'text/html,application/json,*/*'
            },
            signal: controller.signal
          });
          clearTimeout(reqTimeout);

          const duration = Date.now() - reqStart;
          results.totalRequests++;
          results.latencies.push(duration);

          results.endpointStats[step.path].count++;
          results.endpointStats[step.path].totalMs += duration;
          results.endpointStats[step.path].latencies.push(duration);

          if (res.status >= 200 && res.status < 300) {
            results.status2xx++;
          } else if (res.status === 429) {
            results.status429++;
            results.status4xx++;
          } else if (res.status >= 400 && res.status < 500) {
            results.status4xx++;
          } else if (res.status >= 500) {
            results.status5xx++;
            results.endpointStats[step.path].errors++;
          }
        } catch (err) {
          const duration = Date.now() - reqStart;
          results.totalRequests++;
          results.endpointStats[step.path].count++;
          results.endpointStats[step.path].errors++;

          if (err.name === 'AbortError') {
            results.timeouts++;
          } else {
            results.errors++;
          }
        }

        // Realistic Think Time between actions (300ms - 800ms)
        const thinkTime = 300 + Math.random() * 500;
        await new Promise((r) => setTimeout(r, thinkTime));
      }
    }
  }

  // Launch virtual users with ramp-up
  const vuPromises = [];
  for (let i = 0; i < concurrency; i++) {
    const delay = (rampUpSec * 1000 * i) / concurrency;
    vuPromises.push(virtualUser(i, delay));
  }

  await Promise.all(vuPromises);
  clearTimeout(timer);

  const totalTimeSec = (Date.now() - startTime) / 1000;
  const sorted = results.latencies.sort((a, b) => a - b);

  function percentile(p) {
    if (sorted.length === 0) return 0;
    const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return sorted[idx];
  }

  const p50 = percentile(50);
  const p90 = percentile(90);
  const p95 = percentile(95);
  const p99 = percentile(99);
  const rps = (results.totalRequests / totalTimeSec).toFixed(2);
  const errorRate = (
    ((results.status5xx + results.timeouts + results.errors) / (results.totalRequests || 1)) *
    100
  ).toFixed(2);

  console.log(`\n--- Test Summary for ${concurrency} VUs ---`);
  console.log(`Total Requests: ${results.totalRequests}`);
  console.log(`Throughput: ${rps} req/sec`);
  console.log(`2xx Success: ${results.status2xx}`);
  console.log(`4xx Client Error: ${results.status4xx} (429 Rate-Limited: ${results.status429})`);
  console.log(`5xx Server Error: ${results.status5xx}`);
  console.log(`Timeouts: ${results.timeouts}`);
  console.log(`Network Errors: ${results.errors}`);
  console.log(`Error Rate: ${errorRate}%`);
  console.log(`Latency P50: ${p50}ms`);
  console.log(`Latency P90: ${p90}ms`);
  console.log(`Latency P95: ${p95}ms`);
  console.log(`Latency P99: ${p99}ms`);

  console.log(`\nPer-Endpoint Breakdown:`);
  for (const [path, data] of Object.entries(results.endpointStats)) {
    const avg = data.count ? Math.round(data.totalMs / data.count) : 0;
    data.latencies.sort((a, b) => a - b);
    const epP95 = data.latencies.length
      ? data.latencies[Math.floor(0.95 * data.latencies.length)]
      : 0;
    console.log(
      `  ${path.padEnd(28)} | Req: ${String(data.count).padStart(4)} | Avg: ${String(avg).padStart(5)}ms | P95: ${String(epP95).padStart(5)}ms | Err: ${data.errors}`
    );
  }

  return {
    concurrency,
    rps: Number(rps),
    totalRequests: results.totalRequests,
    p50,
    p95,
    p99,
    errorRate: Number(errorRate),
    status5xx: results.status5xx,
    status429: results.status429,
    timeouts: results.timeouts,
    endpointStats: results.endpointStats
  };
}

// Check CLI invocation
const args = process.argv.slice(2);
const concurrency = parseInt(args[0] || '100', 10);
const duration = parseInt(args[1] || '20', 10);
const ramp = parseInt(args[2] || '5', 10);

runLoadTest(concurrency, duration, ramp)
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
