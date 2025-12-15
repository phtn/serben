#!/usr/bin/env bun

import { Command } from 'commander';
import { colors, createGradient, gradientPresets } from './utils/colors.js';
import { styledLogo, tagline, versionBadge, icons, spinners, separator } from './utils/ascii.js';
import { progressBar, statusIndicator, sectionDivider, createBanner } from './ui/components.js';
import { showLoadingAnimation, bootSequence, TextAnimator } from './ui/animations.js';
import { displayWelcome, displaySystemInfo, displayBenchmarkSummary, displayHelp, LiveDashboard, exportResults } from './ui/dashboard.js';
import { runCPUBenchmark, runCPUStressTest } from './benchmarks/cpu.js';
import { runMemoryBenchmark, runMemoryStressTest } from './benchmarks/memory.js';
import { runStorageBenchmark } from './benchmarks/storage.js';
import { runNetworkBenchmark, testConnectivity } from './benchmarks/network.js';
import type { BenchmarkResult } from './types/index.js';

const VERSION = '1.0.0';

// Initialize the CLI
const program = new Command();

program
  .name('nexus')
  .description(colors.neonPink('⚡ NEXUS BENCH - Next-Gen Server Benchmarking CLI ⚡'))
  .version(VERSION, '-v, --version', 'Display version')
  .option('-o, --output <path>', 'Export results to JSON file')
  .option('-q, --quiet', 'Suppress animations and verbose output')
  .option('--no-color', 'Disable colored output');

// Default command - run all benchmarks
program
  .command('bench', { isDefault: true })
  .description('Run complete benchmark suite')
  .option('--cpu-only', 'Skip other benchmarks, run CPU only')
  .option('--skip-network', 'Skip network benchmark')
  .option('-i, --intensity <level>', 'CPU test intensity: low, medium, high, extreme', 'medium')
  .action(async (options) => {
    await runFullBenchmark(options);
  });

// CPU benchmark command
program
  .command('cpu')
  .description('Run CPU benchmark')
  .option('-i, --intensity <level>', 'Test intensity: low, medium, high, extreme', 'medium')
  .option('-d, --duration <ms>', 'Test duration in milliseconds', '10000')
  .action(async (options) => {
    displayWelcome();
    await showLoadingAnimation('Initializing CPU benchmark...', 500);
    
    const result = await runCPUBenchmark({
      intensity: options.intensity as 'low' | 'medium' | 'high' | 'extreme',
      duration: parseInt(options.duration),
    });
    
    console.log('\n');
    console.log(createBanner('CPU BENCHMARK COMPLETE'));
    
    if (program.opts().output) {
      exportResults([result], program.opts().output);
    }
  });

// Memory benchmark command
program
  .command('memory')
  .alias('mem')
  .description('Run memory benchmark')
  .option('-b, --block-size <bytes>', 'Block size for tests', String(1024 * 1024))
  .option('-n, --iterations <count>', 'Number of iterations', '100')
  .action(async (options) => {
    displayWelcome();
    await showLoadingAnimation('Initializing memory benchmark...', 500);
    
    const result = await runMemoryBenchmark({
      blockSize: parseInt(options.blockSize),
      iterations: parseInt(options.iterations),
    });
    
    console.log('\n');
    console.log(createBanner('MEMORY BENCHMARK COMPLETE'));
    
    if (program.opts().output) {
      exportResults([result], program.opts().output);
    }
  });

// Storage benchmark command
program
  .command('storage')
  .alias('disk')
  .description('Run storage I/O benchmark')
  .option('-s, --size <bytes>', 'Test file size', String(100 * 1024 * 1024))
  .option('-b, --block-size <bytes>', 'Block size', String(4 * 1024))
  .action(async (options) => {
    displayWelcome();
    await showLoadingAnimation('Initializing storage benchmark...', 500);
    
    const result = await runStorageBenchmark({
      fileSize: parseInt(options.size),
      blockSize: parseInt(options.blockSize),
    });
    
    console.log('\n');
    console.log(createBanner('STORAGE BENCHMARK COMPLETE'));
    
    if (program.opts().output) {
      exportResults([result], program.opts().output);
    }
  });

// Network benchmark command
program
  .command('network [url]')
  .alias('net')
  .description('Run network benchmark')
  .option('-r, --requests <count>', 'Number of requests', '50')
  .option('-c, --concurrent <count>', 'Concurrent connections', '10')
  .option('-t, --timeout <ms>', 'Request timeout', '10000')
  .action(async (url, options) => {
    displayWelcome();
    
    const target = url || 'https://httpbin.org/get';
    
    // Test connectivity first
    console.log(`${statusIndicator('running')} ${colors.muted('Testing connectivity to')} ${colors.neonCyan(target)}${colors.muted('...')}`);
    const connectivity = await testConnectivity(target);
    
    if (!connectivity.success) {
      console.log(`${statusIndicator('failed')} ${colors.error('Failed to connect to target!')}`);
      console.log(`${colors.muted('   Status:')} ${colors.error(String(connectivity.status))}`);
      process.exit(1);
    }
    
    console.log(`${statusIndicator('passed')} ${colors.success('Connection successful!')} ${colors.dimmed('(' + connectivity.latency.toFixed(0) + 'ms)')}`);
    console.log('\n');
    
    const result = await runNetworkBenchmark({
      target,
      requests: parseInt(options.requests),
      concurrent: parseInt(options.concurrent),
      timeout: parseInt(options.timeout),
    });
    
    console.log('\n');
    console.log(createBanner('NETWORK BENCHMARK COMPLETE'));
    
    if (program.opts().output) {
      exportResults([result], program.opts().output);
    }
  });

// Stress test command
program
  .command('stress <type>')
  .description('Run stress tests (cpu, memory)')
  .option('-d, --duration <seconds>', 'Test duration in seconds', '30')
  .option('-t, --target <percent>', 'Target utilization (memory only)', '70')
  .action(async (type, options) => {
    displayWelcome();
    
    console.log(createBanner(`${type.toUpperCase()} STRESS TEST`));
    console.log('\n');
    
    switch (type.toLowerCase()) {
      case 'cpu':
        await runCPUStressTest(parseInt(options.duration));
        break;
      case 'memory':
      case 'mem':
        await runMemoryStressTest(parseInt(options.target), parseInt(options.duration));
        break;
      default:
        console.log(`${statusIndicator('failed')} ${colors.error('Unknown stress test type:')} ${colors.bright(type)}`);
        console.log(`${colors.muted('Available types: cpu, memory')}`);
        process.exit(1);
    }
  });

// System info command
program
  .command('info')
  .description('Display system information')
  .action(() => {
    displayWelcome();
    displaySystemInfo();
  });

// Live monitor command
program
  .command('monitor')
  .alias('watch')
  .description('Live system monitoring dashboard')
  .action(() => {
    const dashboard = new LiveDashboard();
    
    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      dashboard.stop();
      console.clear();
      console.log(`\n${statusIndicator('passed')} ${colors.success('Monitor stopped.')}\n`);
      process.exit(0);
    });
    
    dashboard.start();
  });

// Run full benchmark suite
async function runFullBenchmark(options: { cpuOnly?: boolean; skipNetwork?: boolean; intensity?: string }): Promise<void> {
  const quiet = program.opts().quiet;
  
  if (!quiet) {
    displayWelcome();
    await bootSequence();
    displaySystemInfo();
  }
  
  console.log('\n');
  console.log(sectionDivider('STARTING BENCHMARK SUITE', 70));
  console.log('\n');
  
  const results: BenchmarkResult[] = [];
  
  // CPU Benchmark
  console.log(`${icons.lightning} ${createGradient('CPU BENCHMARK', gradientPresets.fire)}`);
  const cpuResult = await runCPUBenchmark({
    intensity: (options.intensity as 'low' | 'medium' | 'high' | 'extreme') || 'medium',
  });
  results.push(cpuResult);
  
  if (!options.cpuOnly) {
    // Memory Benchmark
    console.log('\n');
    console.log(`${icons.lightning} ${createGradient('MEMORY BENCHMARK', gradientPresets.ice)}`);
    const memResult = await runMemoryBenchmark();
    results.push(memResult);
    
    // Storage Benchmark
    console.log('\n');
    console.log(`${icons.lightning} ${createGradient('STORAGE BENCHMARK', gradientPresets.neon)}`);
    const storageResult = await runStorageBenchmark();
    results.push(storageResult);
    
    // Network Benchmark (optional)
    if (!options.skipNetwork) {
      console.log('\n');
      console.log(`${icons.lightning} ${createGradient('NETWORK BENCHMARK', gradientPresets.plasma)}`);
      
      // Quick connectivity check
      const connectivity = await testConnectivity('https://httpbin.org/get');
      if (connectivity.success) {
        const netResult = await runNetworkBenchmark();
        results.push(netResult);
      } else {
        console.log(`${statusIndicator('warning')} ${colors.warning('Network test skipped - no connectivity')}`);
      }
    }
  }
  
  // Display summary
  displayBenchmarkSummary(results);
  
  // Export if requested
  const outputPath = program.opts().output;
  if (outputPath) {
    exportResults(results, outputPath);
  }
  
  // Final message
  console.log('\n');
  console.log(createGradient('═'.repeat(70), gradientPresets.aurora));
  console.log(`\n${colors.success(icons.success)} ${colors.bright('All benchmarks completed successfully!')}\n`);
  
  // Exit with appropriate code
  const failedTests = results.filter(r => r.status === 'failed').length;
  process.exit(failedTests > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(`\n${statusIndicator('failed')} ${colors.error('Fatal error:')} ${error.message}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(`\n${statusIndicator('failed')} ${colors.error('Unhandled rejection:')} ${reason}\n`);
  process.exit(1);
});

// Parse arguments and run
program.parse();

