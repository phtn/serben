import { colors, formatBytes, formatDuration } from '../utils/colors.js';
import { progressBar, createBox, statusIndicator, sparkline, createTable } from '../ui/components.js';
import type { BenchmarkResult, ProgressCallback, NetworkBenchmarkOptions } from '../types/index.js';

interface NetworkTestResult {
  name: string;
  score: number;
  value: number;
  unit: string;
  duration: number;
}

interface RequestResult {
  status: number;
  latency: number;
  size: number;
  success: boolean;
  error?: string;
}

// Perform HTTP request and measure latency
async function performRequest(url: string, timeout: number = 10000): Promise<RequestResult> {
  const start = performance.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'NexusBench/1.0',
        'Accept': '*/*',
      },
    });
    
    clearTimeout(timeoutId);
    
    const buffer = await response.arrayBuffer();
    const end = performance.now();
    
    return {
      status: response.status,
      latency: end - start,
      size: buffer.byteLength,
      success: response.ok,
    };
  } catch (error) {
    const end = performance.now();
    return {
      status: 0,
      latency: end - start,
      size: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Latency test - multiple requests to measure round-trip time
async function latencyTest(
  url: string,
  requests: number,
  onProgress?: (completed: number, total: number) => void
): Promise<{ avg: number; min: number; max: number; p95: number; p99: number }> {
  const latencies: number[] = [];
  
  for (let i = 0; i < requests; i++) {
    const result = await performRequest(url);
    if (result.success) {
      latencies.push(result.latency);
    }
    onProgress?.(i + 1, requests);
  }
  
  if (latencies.length === 0) {
    return { avg: 0, min: 0, max: 0, p95: 0, p99: 0 };
  }
  
  latencies.sort((a, b) => a - b);
  
  return {
    avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    min: latencies[0],
    max: latencies[latencies.length - 1],
    p95: latencies[Math.floor(latencies.length * 0.95)],
    p99: latencies[Math.floor(latencies.length * 0.99)],
  };
}

// Throughput test - concurrent requests
async function throughputTest(
  url: string,
  totalRequests: number,
  concurrent: number,
  onProgress?: (completed: number, total: number) => void
): Promise<{ requestsPerSecond: number; successRate: number; avgLatency: number; totalBytes: number }> {
  let completed = 0;
  let successful = 0;
  let totalLatency = 0;
  let totalBytes = 0;
  
  const startTime = performance.now();
  
  // Create batches of concurrent requests
  const batches = Math.ceil(totalRequests / concurrent);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(concurrent, totalRequests - batch * concurrent);
    const promises = Array(batchSize).fill(null).map(() => performRequest(url));
    
    const results = await Promise.all(promises);
    
    for (const result of results) {
      completed++;
      if (result.success) {
        successful++;
        totalLatency += result.latency;
        totalBytes += result.size;
      }
      onProgress?.(completed, totalRequests);
    }
  }
  
  const endTime = performance.now();
  const totalDuration = (endTime - startTime) / 1000; // seconds
  
  return {
    requestsPerSecond: completed / totalDuration,
    successRate: (successful / completed) * 100,
    avgLatency: successful > 0 ? totalLatency / successful : 0,
    totalBytes,
  };
}

// DNS resolution test
async function dnsTest(hostname: string): Promise<{ resolutionTime: number; success: boolean }> {
  const start = performance.now();
  
  try {
    // Use fetch to trigger DNS resolution
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    await fetch(`https://${hostname}`, {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const end = performance.now();
    
    return { resolutionTime: end - start, success: true };
  } catch {
    const end = performance.now();
    return { resolutionTime: end - start, success: false };
  }
}

// Connection test - measure TCP handshake time
async function connectionTest(url: string, attempts: number): Promise<{ avgTime: number; successRate: number }> {
  const times: number[] = [];
  let successful = 0;
  
  for (let i = 0; i < attempts; i++) {
    const start = performance.now();
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        successful++;
        times.push(performance.now() - start);
      }
    } catch {
      times.push(performance.now() - start);
    }
  }
  
  return {
    avgTime: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
    successRate: (successful / attempts) * 100,
  };
}

// Main network benchmark
export async function runNetworkBenchmark(
  options: Partial<NetworkBenchmarkOptions> = {},
  onProgress?: ProgressCallback
): Promise<BenchmarkResult> {
  const {
    target = 'https://httpbin.org/get',
    requests = 50,
    concurrent = 10,
    timeout = 10000,
  } = options;

  const results: NetworkTestResult[] = [];
  const totalTests = 5;
  let completedTests = 0;

  // Parse URL for display
  const url = new URL(target);

  console.log('\n');
  console.log(createBox('NETWORK BENCHMARK', [
    `${colors.muted('Target:')} ${colors.neonCyan(target)}`,
    `${colors.muted('Host:')} ${colors.neonGreen(url.hostname)}`,
    `${colors.muted('Requests:')} ${colors.neonPink(String(requests))}`,
    `${colors.muted('Concurrency:')} ${colors.neonOrange(String(concurrent))}`,
    `${colors.muted('Timeout:')} ${colors.neonCyan(String(timeout) + 'ms')}`,
    '',
    `${colors.dimmed('Running network performance tests...')}`,
  ], 60, 'neonCyan'));
  console.log('\n');

  const latencyHistory: number[] = [];

  // Test 1: DNS Resolution
  onProgress?.(0, 'Testing DNS resolution...', 'dns');
  console.log(`${statusIndicator('running')} ${colors.muted('DNS Resolution Test...')}`);
  
  const dnsResult = await dnsTest(url.hostname);
  results.push({
    name: 'DNS Resolution',
    score: dnsResult.success ? Math.min(100, (100 / dnsResult.resolutionTime) * 100) : 0,
    value: dnsResult.resolutionTime,
    unit: 'ms',
    duration: dnsResult.resolutionTime,
  });
  completedTests++;
  console.log(`${statusIndicator(dnsResult.success ? 'passed' : 'failed')} ${colors.bright('DNS Resolution')} ${progressBar(results[results.length - 1].score, 100, 25)} ${colors.neonCyan(dnsResult.resolutionTime.toFixed(2) + ' ms')}`);

  // Test 2: Connection Test
  onProgress?.((completedTests / totalTests) * 100, 'Testing connection...', 'connection');
  console.log(`${statusIndicator('running')} ${colors.muted('Connection Test...')}`);
  
  const connResult = await connectionTest(target, 10);
  results.push({
    name: 'Connection',
    score: Math.min(100, (500 / connResult.avgTime) * 100) * (connResult.successRate / 100),
    value: connResult.avgTime,
    unit: 'ms',
    duration: connResult.avgTime * 10,
  });
  completedTests++;
  console.log(`${statusIndicator('passed')} ${colors.bright('Connection')} ${progressBar(results[results.length - 1].score, 100, 25)} ${colors.neonGreen(connResult.avgTime.toFixed(2) + ' ms')} ${colors.dimmed('(' + connResult.successRate.toFixed(0) + '% success)')}`);

  // Test 3: Latency Test
  onProgress?.((completedTests / totalTests) * 100, 'Testing latency...', 'latency');
  console.log(`${statusIndicator('running')} ${colors.muted('Latency Test...')}`);
  
  const latResult = await latencyTest(target, 20, (completed, total) => {
    latencyHistory.push(completed);
    process.stdout.write(`\r${statusIndicator('running')} ${colors.muted('Latency Test...')} ${progressBar((completed / total) * 100, 100, 20, false)} ${colors.dimmed(completed + '/' + total)}`);
  });
  console.log(''); // New line after progress
  
  results.push({
    name: 'Latency',
    score: latResult.avg > 0 ? Math.min(100, (200 / latResult.avg) * 100) : 0,
    value: latResult.avg,
    unit: 'ms',
    duration: latResult.avg * 20,
  });
  completedTests++;
  console.log(`${statusIndicator('passed')} ${colors.bright('Latency')} ${progressBar(results[results.length - 1].score, 100, 25)} ${colors.neonPink('avg ' + latResult.avg.toFixed(2) + ' ms')} ${colors.dimmed('(min ' + latResult.min.toFixed(0) + ' / max ' + latResult.max.toFixed(0) + ')')}`);

  // Test 4: Throughput Test
  onProgress?.((completedTests / totalTests) * 100, 'Testing throughput...', 'throughput');
  console.log(`${statusIndicator('running')} ${colors.muted('Throughput Test...')}`);
  
  const tputResult = await throughputTest(target, requests, concurrent, (completed, total) => {
    process.stdout.write(`\r${statusIndicator('running')} ${colors.muted('Throughput Test...')} ${progressBar((completed / total) * 100, 100, 20, false)} ${colors.dimmed(completed + '/' + total)}`);
  });
  console.log(''); // New line after progress
  
  results.push({
    name: 'Throughput',
    score: Math.min(100, (tputResult.requestsPerSecond / 100) * 100) * (tputResult.successRate / 100),
    value: tputResult.requestsPerSecond,
    unit: 'req/s',
    duration: requests / tputResult.requestsPerSecond * 1000,
  });
  completedTests++;
  console.log(`${statusIndicator('passed')} ${colors.bright('Throughput')} ${progressBar(results[results.length - 1].score, 100, 25)} ${colors.neonOrange(tputResult.requestsPerSecond.toFixed(1) + ' req/s')} ${colors.dimmed('(' + tputResult.successRate.toFixed(0) + '% success)')}`);

  // Test 5: Bandwidth estimate
  onProgress?.((completedTests / totalTests) * 100, 'Estimating bandwidth...', 'bandwidth');
  console.log(`${statusIndicator('running')} ${colors.muted('Bandwidth Estimation...')}`);
  
  const bandwidthMbps = (tputResult.totalBytes * 8) / (requests / tputResult.requestsPerSecond) / 1000000;
  results.push({
    name: 'Bandwidth',
    score: Math.min(100, (bandwidthMbps / 100) * 100),
    value: bandwidthMbps,
    unit: 'Mbps',
    duration: 0,
  });
  completedTests++;
  console.log(`${statusIndicator('passed')} ${colors.bright('Bandwidth')} ${progressBar(results[results.length - 1].score, 100, 25)} ${colors.neonCyan(bandwidthMbps.toFixed(2) + ' Mbps')}`);

  onProgress?.(100, 'Network benchmark complete!', 'complete');

  // Calculate overall score
  const totalScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  // Display summary
  console.log('\n');
  
  // Statistics table
  console.log(createTable(
    ['Metric', 'Value', 'Score'],
    results.map(r => [r.name, `${r.value.toFixed(2)} ${r.unit}`, `${r.score.toFixed(1)}/100`]),
    [20, 20, 15]
  ));
  console.log('\n');

  console.log(createBox('NETWORK BENCHMARK RESULTS', [
    '',
    `${colors.muted('Overall Score:')} ${colors.neonPink(totalScore.toFixed(1))} ${colors.dimmed('/ 100')}`,
    '',
    progressBar(totalScore, 100, 50),
    '',
    `${colors.muted('Target:')} ${colors.neonCyan(target)}`,
    `${colors.muted('Total Requests:')} ${colors.neonGreen(String(requests))}`,
    `${colors.muted('Test Duration:')} ${colors.neonOrange(formatDuration(totalDuration))}`,
    '',
    `${colors.dimmed('─'.repeat(56))}`,
    '',
    `${colors.muted('Latency Stats:')}`,
    `  ${colors.dimmed('├─')} ${colors.muted('Average:')} ${colors.neonPink(latResult.avg.toFixed(2) + ' ms')}`,
    `  ${colors.dimmed('├─')} ${colors.muted('Min:')} ${colors.neonGreen(latResult.min.toFixed(2) + ' ms')}`,
    `  ${colors.dimmed('├─')} ${colors.muted('Max:')} ${colors.neonOrange(latResult.max.toFixed(2) + ' ms')}`,
    `  ${colors.dimmed('├─')} ${colors.muted('P95:')} ${colors.neonCyan(latResult.p95.toFixed(2) + ' ms')}`,
    `  ${colors.dimmed('└─')} ${colors.muted('P99:')} ${colors.neonPurple(latResult.p99.toFixed(2) + ' ms')}`,
    '',
  ], 60, 'neonCyan'));

  return {
    name: 'Network Benchmark',
    score: totalScore,
    unit: 'points',
    duration: totalDuration,
    details: {
      target,
      totalRequests: requests,
      concurrency: concurrent,
      dnsResolution: dnsResult.resolutionTime,
      connectionTime: connResult.avgTime,
      avgLatency: latResult.avg,
      minLatency: latResult.min,
      maxLatency: latResult.max,
      p95Latency: latResult.p95,
      p99Latency: latResult.p99,
      throughput: tputResult.requestsPerSecond,
      successRate: tputResult.successRate,
      bandwidth: bandwidthMbps,
      totalBytesTransferred: tputResult.totalBytes,
    },
    status: totalScore >= 70 ? 'passed' : totalScore >= 40 ? 'warning' : 'failed',
    timestamp: new Date(),
  };
}

// Simple connectivity test
export async function testConnectivity(url: string): Promise<{ success: boolean; latency: number; status: number }> {
  const result = await performRequest(url);
  return {
    success: result.success,
    latency: result.latency,
    status: result.status,
  };
}

