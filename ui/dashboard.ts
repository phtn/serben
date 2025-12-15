import os from 'os';
import { colors, createGradient, gradientPresets, formatBytes } from '../utils/colors.js';
import { styledLogo, tagline, versionBadge, separator, matrixLine, box, icons, spinners, decorators } from '../utils/ascii.js';
import { progressBar, createBox, liveStatsPanel, sparkline, statusIndicator, barChart, sectionDivider } from './components.js';
import type { BenchmarkResult, SystemInfo } from '../types/index.js';

const VERSION = '1.0.0';

// Get current system information
export function getSystemInfo(): SystemInfo {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  
  return {
    cpu: {
      manufacturer: cpus[0]?.model.split(' ')[0] || 'Unknown',
      brand: cpus[0]?.model || 'Unknown CPU',
      cores: cpus.length,
      physicalCores: cpus.length / 2,
      speed: cpus[0]?.speed || 0,
      speedMax: Math.max(...cpus.map(c => c.speed)),
    },
    memory: {
      total: totalMem,
      free: freeMem,
      used: totalMem - freeMem,
      active: totalMem - freeMem,
    },
    disk: {
      size: 0,
      used: 0,
      available: 0,
      type: 'Unknown',
    },
    network: {
      interface: 'eth0',
      ip4: '0.0.0.0',
      speed: 0,
    },
    os: {
      platform: os.platform(),
      distro: os.type(),
      release: os.release(),
      kernel: os.version(),
      arch: os.arch(),
    },
  };
}

// Display welcome screen
export function displayWelcome(): void {
  console.clear();
  
  // Matrix rain effect at the top
  for (let i = 0; i < 3; i++) {
    console.log(matrixLine(process.stdout.columns || 80));
  }
  
  console.log('\n');
  console.log(styledLogo());
  console.log('\n');
  console.log(tagline());
  console.log(colors.dimmed('─'.repeat(60)));
  console.log(`${colors.dimmed('Version')} ${versionBadge(VERSION)} ${colors.dimmed('│')} ${colors.muted('Powered by')} ${colors.neonCyan('Bun')}`);
  console.log('\n');
}

// Display system info panel
export function displaySystemInfo(): void {
  const sysInfo = getSystemInfo();
  
  console.log(sectionDivider('SYSTEM INFORMATION', 70));
  console.log('\n');
  
  // CPU Info
  const cpuPanel = createBox('CPU', [
    `${colors.muted('Model:')} ${colors.neonCyan(sysInfo.cpu.brand)}`,
    `${colors.muted('Cores:')} ${colors.neonGreen(String(sysInfo.cpu.cores))} ${colors.dimmed('logical')}`,
    `${colors.muted('Speed:')} ${colors.neonPink(String(sysInfo.cpu.speed))} ${colors.dimmed('MHz')}`,
  ], 35, 'neonCyan');
  
  // Memory Info
  const memPanel = createBox('MEMORY', [
    `${colors.muted('Total:')} ${colors.neonCyan(formatBytes(sysInfo.memory.total))}`,
    `${colors.muted('Used:')} ${colors.neonOrange(formatBytes(sysInfo.memory.used))}`,
    `${colors.muted('Free:')} ${colors.neonGreen(formatBytes(sysInfo.memory.free))}`,
  ], 35, 'neonBlue');
  
  // OS Info
  const osPanel = createBox('OPERATING SYSTEM', [
    `${colors.muted('Platform:')} ${colors.neonCyan(sysInfo.os.platform)}`,
    `${colors.muted('Type:')} ${colors.neonGreen(sysInfo.os.distro)}`,
    `${colors.muted('Arch:')} ${colors.neonPink(sysInfo.os.arch)}`,
  ], 35, 'neonPurple');
  
  // Print panels side by side (simplified - just stack them)
  console.log(cpuPanel);
  console.log('\n');
  console.log(memPanel);
  console.log('\n');
  console.log(osPanel);
  console.log('\n');
}

// Display benchmark summary
export function displayBenchmarkSummary(results: BenchmarkResult[]): void {
  console.log('\n');
  console.log(sectionDivider('BENCHMARK SUMMARY', 70));
  console.log('\n');
  
  // Calculate overall score
  const overallScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  // Score grade
  let grade: string;
  let gradeColor: typeof colors.neonGreen;
  if (overallScore >= 90) {
    grade = 'S+';
    gradeColor = colors.neonCyan;
  } else if (overallScore >= 80) {
    grade = 'A';
    gradeColor = colors.neonGreen;
  } else if (overallScore >= 70) {
    grade = 'B';
    gradeColor = colors.neonBlue;
  } else if (overallScore >= 60) {
    grade = 'C';
    gradeColor = colors.neonYellow;
  } else if (overallScore >= 50) {
    grade = 'D';
    gradeColor = colors.neonOrange;
  } else {
    grade = 'F';
    gradeColor = colors.error;
  }
  
  // Big score display
  const scoreArt = `
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   ${createGradient('OVERALL BENCHMARK SCORE', gradientPresets.cyber)}                              ║
    ║                                                               ║
    ║        ${gradeColor('█████╗  ')}    ${colors.bright(overallScore.toFixed(1).padStart(5))}${colors.dimmed('/100')}                             ║
    ║        ${gradeColor(grade.padEnd(6))}                                                ║
    ║                                                               ║
    ║   ${progressBar(overallScore, 100, 50)}             ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
  `;
  
  console.log(scoreArt);
  console.log('\n');
  
  // Individual results
  console.log(barChart(
    results.map(r => ({ label: r.name, value: r.score })),
    40
  ));
  console.log('\n');
  
  // Detailed breakdown
  console.log(colors.dimmed('─'.repeat(70)));
  console.log('\n');
  
  for (const result of results) {
    const statusIcon = statusIndicator(result.status);
    const scoreDisplay = progressBar(result.score, 100, 30);
    
    console.log(`${statusIcon} ${colors.bright(result.name.padEnd(25))} ${scoreDisplay}`);
    
    // Show key details
    const detailEntries = Object.entries(result.details).slice(0, 3);
    for (const [key, value] of detailEntries) {
      const formatted = typeof value === 'number' ? value.toFixed(2) : String(value);
      console.log(`  ${colors.dimmed('└─')} ${colors.muted(key)}: ${colors.neonCyan(formatted)}`);
    }
    console.log('');
  }
  
  // Footer
  console.log(colors.dimmed('─'.repeat(70)));
  console.log(`\n${colors.muted('Total benchmark time:')} ${colors.neonPink((totalDuration / 1000).toFixed(2) + 's')}`);
  console.log(`${colors.muted('Completed at:')} ${colors.neonCyan(new Date().toISOString())}`);
}

// Display live dashboard (updates in place)
export class LiveDashboard {
  private frame: number = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private cpuHistory: number[] = [];
  private memHistory: number[] = [];
  private running: boolean = false;
  
  start(): void {
    this.running = true;
    this.render();
    
    this.intervalId = setInterval(() => {
      this.frame++;
      this.updateMetrics();
      this.render();
    }, 500);
  }
  
  stop(): void {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  private updateMetrics(): void {
    // Get current CPU load
    const cpuLoad = os.loadavg()[0] / os.cpus().length * 100;
    this.cpuHistory.push(Math.min(100, cpuLoad));
    if (this.cpuHistory.length > 30) this.cpuHistory.shift();
    
    // Get current memory usage
    const memUsage = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;
    this.memHistory.push(memUsage);
    if (this.memHistory.length > 30) this.memHistory.shift();
  }
  
  private render(): void {
    console.clear();
    
    // Header with animation
    const spinner = spinners.cyber[this.frame % spinners.cyber.length];
    console.log(`${colors.neonCyan(spinner)} ${createGradient(' NEXUS BENCH - LIVE MONITOR ', gradientPresets.plasma)} ${colors.neonCyan(spinner)}`);
    console.log(colors.dimmed(decorators.circuit));
    console.log('\n');
    
    // Current stats
    const cpuLoad = this.cpuHistory[this.cpuHistory.length - 1] || 0;
    const memUsage = this.memHistory[this.memHistory.length - 1] || 0;
    
    // CPU section
    console.log(`${colors.neonCyan(icons.cpu)} ${colors.bright('CPU LOAD')}`);
    console.log(`   ${progressBar(cpuLoad, 100, 50)}`);
    console.log(`   ${colors.muted('History:')} ${sparkline(this.cpuHistory, 30)}`);
    console.log('\n');
    
    // Memory section
    console.log(`${colors.neonBlue(icons.memory)} ${colors.bright('MEMORY USAGE')}`);
    console.log(`   ${progressBar(memUsage, 100, 50, true, '#00F0FF', '#FF6B35')}`);
    console.log(`   ${colors.muted('History:')} ${sparkline(this.memHistory, 30)}`);
    console.log('\n');
    
    // System info
    const sysInfo = getSystemInfo();
    console.log(liveStatsPanel({
      'CPU Cores': sysInfo.cpu.cores,
      'CPU Speed': `${sysInfo.cpu.speed} MHz`,
      'Total Memory': formatBytes(sysInfo.memory.total),
      'Free Memory': formatBytes(sysInfo.memory.free),
      'Platform': sysInfo.os.platform,
      'Uptime': `${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m`,
    }));
    
    console.log('\n');
    console.log(colors.dimmed(`Press Ctrl+C to exit | Frame: ${this.frame}`));
  }
}

// Display help screen
export function displayHelp(): void {
  console.log('\n');
  console.log(createGradient(' NEXUS BENCH - COMMAND REFERENCE ', gradientPresets.cyber));
  console.log(colors.dimmed('─'.repeat(60)));
  console.log('\n');
  
  const commands = [
    { cmd: 'nexus', desc: 'Run full benchmark suite' },
    { cmd: 'nexus cpu', desc: 'CPU benchmark only' },
    { cmd: 'nexus memory', desc: 'Memory benchmark only' },
    { cmd: 'nexus storage', desc: 'Storage I/O benchmark only' },
    { cmd: 'nexus network <url>', desc: 'Network benchmark (optional target URL)' },
    { cmd: 'nexus stress cpu', desc: 'CPU stress test (30 seconds)' },
    { cmd: 'nexus stress memory', desc: 'Memory stress test' },
    { cmd: 'nexus monitor', desc: 'Live system monitor' },
    { cmd: 'nexus info', desc: 'Display system information' },
    { cmd: 'nexus --help', desc: 'Show this help message' },
    { cmd: 'nexus --version', desc: 'Show version' },
  ];
  
  for (const { cmd, desc } of commands) {
    console.log(`  ${colors.neonCyan(cmd.padEnd(30))} ${colors.muted(desc)}`);
  }
  
  console.log('\n');
  console.log(colors.dimmed('─'.repeat(60)));
  console.log(`${colors.muted('Examples:')}`);
  console.log(`  ${colors.dimmed('$')} ${colors.neonGreen('nexus')} ${colors.muted('# Run all benchmarks')}`);
  console.log(`  ${colors.dimmed('$')} ${colors.neonGreen('nexus network https://api.example.com')} ${colors.muted('# Test specific endpoint')}`);
  console.log(`  ${colors.dimmed('$')} ${colors.neonGreen('nexus stress cpu --duration 60')} ${colors.muted('# 60-second CPU stress')}`);
  console.log('\n');
}

// Export results as JSON
export function exportResults(results: BenchmarkResult[], path: string): void {
  const report = {
    tool: 'NEXUS BENCH',
    version: VERSION,
    timestamp: new Date().toISOString(),
    system: getSystemInfo(),
    results,
    summary: {
      overallScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
      testsRun: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      warnings: results.filter(r => r.status === 'warning').length,
      failed: results.filter(r => r.status === 'failed').length,
    },
  };
  
  Bun.write(path, JSON.stringify(report, null, 2));
  console.log(`${statusIndicator('passed')} ${colors.muted('Results exported to:')} ${colors.neonCyan(path)}`);
}

