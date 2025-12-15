import os from 'os';
import { colors, formatDuration } from '../utils/colors.js';
import { progressBar, createBox, metricDisplay, sparkline, statusIndicator } from '../ui/components.js';
import { showLoadingAnimation } from '../ui/animations.js';
import type { BenchmarkResult, ProgressCallback, CPUBenchmarkOptions } from '../types/index.js';

interface CPUTestResult {
  name: string;
  score: number;
  opsPerSecond: number;
  duration: number;
}

// Prime number calculation (single-threaded benchmark)
function calculatePrimes(limit: number): number {
  let count = 0;
  for (let i = 2; i <= limit; i++) {
    let isPrime = true;
    for (let j = 2; j <= Math.sqrt(i); j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) count++;
  }
  return count;
}

// Matrix multiplication benchmark
function matrixMultiply(size: number): number[][] {
  const a: number[][] = [];
  const b: number[][] = [];
  const c: number[][] = [];
  
  // Initialize matrices
  for (let i = 0; i < size; i++) {
    a[i] = [];
    b[i] = [];
    c[i] = [];
    for (let j = 0; j < size; j++) {
      a[i][j] = Math.random();
      b[i][j] = Math.random();
      c[i][j] = 0;
    }
  }
  
  // Multiply
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      for (let k = 0; k < size; k++) {
        c[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  
  return c;
}

// Fibonacci recursive (tests recursion overhead)
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Memory-intensive sorting benchmark
function sortBenchmark(size: number): number[] {
  const arr: number[] = [];
  for (let i = 0; i < size; i++) {
    arr.push(Math.random());
  }
  return arr.sort((a, b) => a - b);
}

// Hash computation simulation
function hashComputation(iterations: number): string {
  let hash = 0;
  for (let i = 0; i < iterations; i++) {
    hash = ((hash << 5) - hash + i) | 0;
    hash = Math.abs(hash);
  }
  return hash.toString(16);
}

// Float-point intensive calculation
function floatBenchmark(iterations: number): number {
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    result += Math.sin(i) * Math.cos(i) * Math.tan(i % 90);
    result = Math.sqrt(Math.abs(result) + 1);
  }
  return result;
}

// Run single CPU test
async function runCPUTest(
  name: string,
  testFn: () => void,
  iterations: number
): Promise<CPUTestResult> {
  const startTime = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    testFn();
  }
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  const opsPerSecond = (iterations / duration) * 1000;
  
  // Calculate score (normalized to baseline)
  const score = Math.min(100, (opsPerSecond / 1000) * 10);
  
  return {
    name,
    score,
    opsPerSecond,
    duration,
  };
}

// Get intensity multipliers
function getIntensityMultiplier(intensity: CPUBenchmarkOptions['intensity']): number {
  switch (intensity) {
    case 'low': return 0.5;
    case 'medium': return 1;
    case 'high': return 2;
    case 'extreme': return 4;
    default: return 1;
  }
}

// Main CPU benchmark
export async function runCPUBenchmark(
  options: Partial<CPUBenchmarkOptions> = {},
  onProgress?: ProgressCallback
): Promise<BenchmarkResult> {
  const {
    duration = 10000,
    threads = os.cpus().length,
    intensity = 'medium',
  } = options;

  const multiplier = getIntensityMultiplier(intensity);
  const results: CPUTestResult[] = [];
  const cpuInfo = os.cpus()[0];
  const totalTests = 6;
  let completedTests = 0;

  console.log('\n');
  console.log(createBox('CPU BENCHMARK', [
    `${colors.muted('Processor:')} ${colors.neonCyan(cpuInfo.model)}`,
    `${colors.muted('Cores:')} ${colors.neonGreen(String(threads))} ${colors.dimmed('logical')}`,
    `${colors.muted('Base Speed:')} ${colors.neonPink(String(cpuInfo.speed))} ${colors.dimmed('MHz')}`,
    `${colors.muted('Intensity:')} ${colors.neonOrange(intensity.toUpperCase())}`,
    '',
    `${colors.dimmed('Running comprehensive CPU stress tests...')}`,
  ], 60, 'neonCyan'));
  console.log('\n');

  // Test 1: Prime calculation
  onProgress?.(0, 'Running prime number test...', 'prime');
  console.log(`${statusIndicator('running')} ${colors.muted('Prime Number Calculation...')}`);
  
  const primeResult = await runCPUTest(
    'Prime Calculation',
    () => calculatePrimes(Math.floor(10000 * multiplier)),
    5
  );
  results.push(primeResult);
  completedTests++;
  console.log(`${statusIndicator('passed')} ${colors.bright('Prime Calculation')} ${progressBar(primeResult.score, 100, 30)}`);

  // Test 2: Matrix multiplication
  onProgress?.((completedTests / totalTests) * 100, 'Running matrix multiplication...', 'matrix');
  console.log(`${statusIndicator('running')} ${colors.muted('Matrix Multiplication...')}`);
  
  const matrixResult = await runCPUTest(
    'Matrix Multiplication',
    () => matrixMultiply(Math.floor(100 * multiplier)),
    3
  );
  results.push(matrixResult);
  completedTests++;
  console.log(`${statusIndicator('passed')} ${colors.bright('Matrix Multiplication')} ${progressBar(matrixResult.score, 100, 30)}`);

  // Test 3: Fibonacci
  onProgress?.((completedTests / totalTests) * 100, 'Running fibonacci test...', 'fibonacci');
  console.log(`${statusIndicator('running')} ${colors.muted('Fibonacci Recursion...')}`);
  
  const fibResult = await runCPUTest(
    'Fibonacci',
    () => fibonacci(Math.floor(30 * Math.sqrt(multiplier))),
    5
  );
  results.push(fibResult);
  completedTests++;
  console.log(`${statusIndicator('passed')} ${colors.bright('Fibonacci Recursion')} ${progressBar(fibResult.score, 100, 30)}`);

  // Test 4: Sort benchmark
  onProgress?.((completedTests / totalTests) * 100, 'Running sort benchmark...', 'sort');
  console.log(`${statusIndicator('running')} ${colors.muted('Array Sorting...')}`);
  
  const sortResult = await runCPUTest(
    'Array Sorting',
    () => sortBenchmark(Math.floor(50000 * multiplier)),
    10
  );
  results.push(sortResult);
  completedTests++;
  console.log(`${statusIndicator('passed')} ${colors.bright('Array Sorting')} ${progressBar(sortResult.score, 100, 30)}`);

  // Test 5: Hash computation
  onProgress?.((completedTests / totalTests) * 100, 'Running hash computation...', 'hash');
  console.log(`${statusIndicator('running')} ${colors.muted('Hash Computation...')}`);
  
  const hashResult = await runCPUTest(
    'Hash Computation',
    () => hashComputation(Math.floor(100000 * multiplier)),
    20
  );
  results.push(hashResult);
  completedTests++;
  console.log(`${statusIndicator('passed')} ${colors.bright('Hash Computation')} ${progressBar(hashResult.score, 100, 30)}`);

  // Test 6: Float-point operations
  onProgress?.((completedTests / totalTests) * 100, 'Running float-point test...', 'float');
  console.log(`${statusIndicator('running')} ${colors.muted('Float-Point Operations...')}`);
  
  const floatResult = await runCPUTest(
    'Float-Point',
    () => floatBenchmark(Math.floor(50000 * multiplier)),
    10
  );
  results.push(floatResult);
  completedTests++;
  console.log(`${statusIndicator('passed')} ${colors.bright('Float-Point Operations')} ${progressBar(floatResult.score, 100, 30)}`);

  onProgress?.(100, 'CPU benchmark complete!', 'complete');

  // Calculate overall score
  const totalScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const totalOps = results.reduce((sum, r) => sum + r.opsPerSecond, 0);

  // Display summary
  console.log('\n');
  console.log(createBox('CPU BENCHMARK RESULTS', [
    '',
    `${colors.muted('Overall Score:')} ${colors.neonPink(totalScore.toFixed(1))} ${colors.dimmed('/ 100')}`,
    '',
    progressBar(totalScore, 100, 50),
    '',
    `${colors.muted('Total Duration:')} ${colors.neonCyan(formatDuration(totalDuration))}`,
    `${colors.muted('Operations/sec:')} ${colors.neonGreen(totalOps.toFixed(0))}`,
    '',
    `${colors.dimmed('─'.repeat(56))}`,
    '',
    ...results.map(r => 
      `  ${colors.muted(r.name.padEnd(25))} ${colors.neonCyan(r.score.toFixed(1).padStart(6))} ${colors.dimmed('pts')}`
    ),
    '',
  ], 60, 'neonPink'));

  return {
    name: 'CPU Benchmark',
    score: totalScore,
    unit: 'points',
    duration: totalDuration,
    details: {
      processor: cpuInfo.model,
      cores: threads,
      speed: cpuInfo.speed,
      intensity,
      primeScore: primeResult.score,
      matrixScore: matrixResult.score,
      fibonacciScore: fibResult.score,
      sortScore: sortResult.score,
      hashScore: hashResult.score,
      floatScore: floatResult.score,
      totalOperations: totalOps,
    },
    status: totalScore >= 70 ? 'passed' : totalScore >= 40 ? 'warning' : 'failed',
    timestamp: new Date(),
  };
}

// CPU stress test (sustained load)
export async function runCPUStressTest(
  durationSeconds: number = 30,
  onProgress?: ProgressCallback
): Promise<void> {
  const startTime = Date.now();
  const endTime = startTime + durationSeconds * 1000;
  const cpuInfo = os.cpus()[0];
  
  console.log('\n');
  console.log(createBox('CPU STRESS TEST', [
    `${colors.muted('Processor:')} ${colors.neonCyan(cpuInfo.model)}`,
    `${colors.muted('Duration:')} ${colors.neonGreen(String(durationSeconds))} ${colors.dimmed('seconds')}`,
    `${colors.muted('Cores:')} ${colors.neonPink(String(os.cpus().length))}`,
    '',
    `${colors.warning('⚠')} ${colors.dimmed('Running sustained CPU stress test...')}`,
    `${colors.dimmed('   CPU usage will be maximized. Monitor temperatures.')}`,
  ], 60, 'cyberRed'));
  console.log('\n');

  let iterations = 0;
  const loadHistory: number[] = [];

  while (Date.now() < endTime) {
    const elapsed = Date.now() - startTime;
    const progress = (elapsed / (durationSeconds * 1000)) * 100;
    
    // Run CPU-intensive work
    calculatePrimes(5000);
    matrixMultiply(50);
    floatBenchmark(10000);
    iterations++;
    
    // Calculate and store load
    const cpuLoad = os.loadavg()[0] / os.cpus().length * 100;
    loadHistory.push(cpuLoad);
    if (loadHistory.length > 60) loadHistory.shift();
    
    // Update progress every 100 iterations
    if (iterations % 100 === 0) {
      onProgress?.(progress, `Stress testing... ${iterations} iterations`, 'stress');
      
      process.stdout.write(
        `\r${statusIndicator('running')} ${colors.muted('Progress:')} ${progressBar(progress, 100, 30)} ` +
        `${colors.dimmed('|')} ${colors.muted('Iterations:')} ${colors.neonCyan(String(iterations))} ` +
        `${colors.dimmed('|')} ${colors.muted('Load:')} ${sparkline(loadHistory, 15)}`
      );
    }
  }

  console.log('\n\n');
  console.log(`${statusIndicator('passed')} ${colors.success('CPU stress test completed!')}`);
  console.log(`${colors.muted('   Total iterations:')} ${colors.neonCyan(String(iterations))}`);
  console.log(`${colors.muted('   Average load:')} ${colors.neonGreen((loadHistory.reduce((a, b) => a + b, 0) / loadHistory.length).toFixed(1) + '%')}`);
}

