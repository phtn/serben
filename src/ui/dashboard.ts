import os from 'os'
import type { BenchmarkResult, SystemInfo } from '../types/index.js'
import { decorators, matrixLine, spinners, styledLogo, tagline, versionBadge } from '../utils/ascii.js'
import { colors, createGradient, formatBytes, gradientPresets } from '../utils/colors.js'
import {
  barChart,
  dashboardPanel,
  liveStatsPanel,
  progressBar,
  renderPanelsGrid,
  sectionDivider,
  simpleProgressBar,
  sparkline,
  statusIndicator,
  stripAnsi
} from './components.js'

const VERSION = '1.0.0'

// Get current system information
export function getSystemInfo(): SystemInfo {
  const cpus = os.cpus()
  const totalMem = os.totalmem()
  const freeMem = os.freemem()

  return {
    cpu: {
      manufacturer: cpus[0]?.model.split(' ')[0] || 'Unknown',
      brand: cpus[0]?.model || 'Unknown CPU',
      cores: cpus.length,
      physicalCores: cpus.length / 2,
      speed: cpus[0]?.speed || 0,
      speedMax: Math.max(...cpus.map((c) => c.speed))
    },
    memory: {
      total: totalMem,
      free: freeMem,
      used: totalMem - freeMem,
      active: totalMem - freeMem
    },
    disk: {
      size: 0,
      used: 0,
      available: 0,
      type: 'Unknown'
    },
    network: {
      interface: 'eth0',
      ip4: '0.0.0.0',
      speed: 0
    },
    os: {
      platform: os.platform(),
      distro: os.type(),
      release: os.release(),
      kernel: os.version(),
      arch: os.arch()
    }
  }
}

// Display welcome screen
export function displayWelcome(): void {
  console.clear()

  // Matrix rain effect at the top
  for (let i = 0; i < 3; i++) {
    console.log(matrixLine(process.stdout.columns || 80))
  }

  console.log('\n')
  console.log(styledLogo())
  console.log('\n')
  console.log(tagline())
  console.log(colors.dimmed('─'.repeat(60)))
  console.log(
    `${colors.dimmed('Version')} ${versionBadge(VERSION)} ${colors.dimmed('│')} ${colors.muted('Powered by')} ${colors.neonCyan('Bun')}`
  )
  console.log('\n')
}

// Display system info panel - DASHBOARD STYLE
export function displaySystemInfo(): void {
  const sysInfo = getSystemInfo()
  const termWidth = process.stdout.columns || 80
  const panelWidth = Math.min(35, Math.floor((termWidth - 6) / 2))

  console.log(sectionDivider('SYSTEM INFORMATION', 70))
  console.log('\n')

  // CPU Panel
  const cpuPanel = dashboardPanel(
    'CPU',
    [
      { label: 'Model', value: sysInfo.cpu.brand.slice(0, 20), color: 'neonCyan' },
      { label: 'Cores', value: String(sysInfo.cpu.cores), color: 'neonGreen' },
      { label: 'Speed', value: `${sysInfo.cpu.speed} MHz`, color: 'neonPink' }
    ],
    panelWidth,
    'neonCyan'
  )

  // Memory Panel
  const memUsagePercent = (sysInfo.memory.used / sysInfo.memory.total) * 100
  const memPanel = dashboardPanel(
    'MEMORY',
    [
      { label: 'Total', value: formatBytes(sysInfo.memory.total), color: 'neonCyan' },
      {
        label: 'Used',
        value: `${formatBytes(sysInfo.memory.used)} (${memUsagePercent.toFixed(0)}%)`,
        color: 'neonOrange'
      },
      { label: 'Free', value: formatBytes(sysInfo.memory.free), color: 'neonGreen' }
    ],
    panelWidth,
    'neonBlue'
  )

  // Render side by side
  console.log(renderPanelsGrid([cpuPanel, memPanel], 3))
  console.log('\n')

  // OS Panel (full width)
  const osPanel = dashboardPanel(
    'SYSTEM',
    [
      { label: 'Platform', value: sysInfo.os.platform, color: 'neonCyan' },
      { label: 'Type', value: sysInfo.os.distro, color: 'neonGreen' },
      { label: 'Arch', value: sysInfo.os.arch, color: 'neonPink' },
      {
        label: 'Uptime',
        value: `${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m`,
        color: 'neonOrange'
      }
    ],
    panelWidth * 2 + 3,
    'neonPurple'
  )

  console.log(osPanel.join('\n'))
  console.log('\n')
}

// Display benchmark summary - DASHBOARD STYLE
export function displayBenchmarkSummary(results: BenchmarkResult[]): void {
  console.log('\n')
  console.log(sectionDivider('BENCHMARK SUMMARY', 70))
  console.log('\n')

  // Calculate overall score
  const overallScore = results.reduce((sum, r) => sum + r.score, 0) / results.length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

  // Score grade
  let grade: string
  let gradeColor: keyof typeof colors
  if (overallScore >= 90) {
    grade = 'S+'
    gradeColor = 'neonCyan'
  } else if (overallScore >= 80) {
    grade = 'A'
    gradeColor = 'neonGreen'
  } else if (overallScore >= 70) {
    grade = 'B'
    gradeColor = 'neonBlue'
  } else if (overallScore >= 60) {
    grade = 'C'
    gradeColor = 'neonYellow'
  } else if (overallScore >= 50) {
    grade = 'D'
    gradeColor = 'neonOrange'
  } else {
    grade = 'F'
    gradeColor = 'error'
  }

  // Score Display Panel
  const width = 70
  console.log(colors.neonPink('╔' + '═'.repeat(width) + '╗'))

  // Title
  const titleText = ' OVERALL BENCHMARK SCORE '
  const titlePad = Math.floor((width - titleText.length) / 2)
  console.log(
    colors.neonPink('║') +
      ' '.repeat(titlePad) +
      createGradient(titleText, gradientPresets.cyber) +
      ' '.repeat(width - titlePad - titleText.length) +
      colors.neonPink('║')
  )

  console.log(colors.neonPink('╠' + '─'.repeat(width) + '╣'))

  // Score and Grade row
  const gradeColorFn = colors[gradeColor]
  const scoreText = `Grade: ${gradeColorFn(grade.padEnd(4))}  Score: ${colors.neonPink(overallScore.toFixed(1))}/100`
  const scoreTextLen = stripAnsi(scoreText).length
  const scorePad = Math.floor((width - scoreTextLen) / 2)
  console.log(
    colors.neonPink('║') +
      ' '.repeat(scorePad) +
      scoreText +
      ' '.repeat(width - scorePad - scoreTextLen) +
      colors.neonPink('║')
  )

  // Progress bar row
  const barText = progressBar(overallScore, 100, 50)
  const barLen = stripAnsi(barText).length
  const barPad = Math.floor((width - barLen) / 2)
  console.log(
    colors.neonPink('║') +
      ' '.repeat(barPad) +
      barText +
      ' '.repeat(Math.max(0, width - barPad - barLen)) +
      colors.neonPink('║')
  )

  console.log(colors.neonPink('╠' + '═'.repeat(width) + '╣'))

  // Results header
  const headerText = ` ${'Test'.padEnd(22)} ${'Score'.padStart(8)} ${'Bar'.padStart(25)} ${'Status'.padStart(8)}`
  console.log(
    colors.neonPink('║') +
      colors.muted(headerText) +
      ' '.repeat(Math.max(0, width - headerText.length)) +
      colors.neonPink('║')
  )
  console.log(colors.neonPink('║') + colors.dimmed(' ' + '─'.repeat(width - 1)) + colors.neonPink('║'))

  // Individual results
  for (const result of results) {
    const status = statusIndicator(result.status)
    const testName = result.name.slice(0, 22).padEnd(22)
    const score = result.score.toFixed(1).padStart(8)
    const bar = simpleProgressBar(result.score, 100, 20)

    const rowContent = ` ${colors.bright(testName)} ${colors.neonCyan(score)}  ${bar}  ${status}`
    const rowLen = stripAnsi(rowContent).length
    console.log(colors.neonPink('║') + rowContent + ' '.repeat(Math.max(0, width - rowLen)) + colors.neonPink('║'))
  }

  console.log(colors.neonPink('╠' + '─'.repeat(width) + '╣'))

  // Summary stats row
  const statsText = ` Duration: ${colors.neonCyan(formatDuration(totalDuration))}  Tests: ${colors.neonGreen(String(results.length))}  Passed: ${colors.success(String(results.filter((r) => r.status === 'passed').length))}`
  const statsLen = stripAnsi(statsText).length
  console.log(colors.neonPink('║') + statsText + ' '.repeat(Math.max(0, width - statsLen)) + colors.neonPink('║'))

  console.log(colors.neonPink('╚' + '═'.repeat(width) + '╝'))
  console.log('\n')

  // Bar chart of results
  console.log(colors.muted(' Performance Distribution:'))
  console.log(
    barChart(
      results.map((r) => ({ label: r.name.slice(0, 15), value: r.score })),
      35
    )
  )
}

// Format duration helper
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  return `${(ms / 60000).toFixed(2)}m`
}

// Display live dashboard (updates in place)
export class LiveDashboard {
  private frame: number = 0
  private intervalId: ReturnType<typeof setInterval> | null = null
  private cpuHistory: number[] = []
  private memHistory: number[] = []
  private running: boolean = false

  start(): void {
    this.running = true
    this.render()

    this.intervalId = setInterval(() => {
      this.frame++
      this.updateMetrics()
      this.render()
    }, 500)
  }

  stop(): void {
    this.running = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private updateMetrics(): void {
    // Get current CPU load
    const cpuLoad = (os.loadavg()[0] / os.cpus().length) * 100
    this.cpuHistory.push(Math.min(100, cpuLoad))
    if (this.cpuHistory.length > 30) this.cpuHistory.shift()

    // Get current memory usage
    const memUsage = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
    this.memHistory.push(memUsage)
    if (this.memHistory.length > 30) this.memHistory.shift()
  }

  private render(): void {
    console.clear()
    const termWidth = process.stdout.columns || 80
    const panelWidth = Math.min(40, Math.floor((termWidth - 4) / 2))

    // Header with animation
    const spinner = spinners.cyber[this.frame % spinners.cyber.length]
    console.log(
      `${colors.neonCyan(spinner)} ${createGradient(' NEXUS BENCH - LIVE MONITOR ', gradientPresets.plasma)} ${colors.neonCyan(spinner)}`
    )
    console.log(colors.dimmed(decorators.circuit.repeat(Math.floor(termWidth / decorators.circuit.length))))
    console.log('\n')

    // Current stats
    const cpuLoad = this.cpuHistory[this.cpuHistory.length - 1] || 0
    const memUsage = this.memHistory[this.memHistory.length - 1] || 0

    // Create CPU panel
    const cpuPanel = dashboardPanel(
      '⚡ CPU LOAD',
      [
        {
          label: 'Current',
          value: `${cpuLoad.toFixed(1)}%`,
          color: cpuLoad > 80 ? 'error' : cpuLoad > 50 ? 'neonOrange' : 'neonGreen'
        },
        { label: 'Cores', value: String(os.cpus().length), color: 'neonCyan' },
        {
          label: 'Load Avg',
          value: os
            .loadavg()
            .map((l) => l.toFixed(2))
            .join(' '),
          color: 'neonPink'
        }
      ],
      panelWidth,
      'neonCyan'
    )

    // Create Memory panel
    const memPanel = dashboardPanel(
      'MEMORY',
      [
        {
          label: 'Usage',
          value: `${memUsage.toFixed(1)}%`,
          color: memUsage > 80 ? 'error' : memUsage > 60 ? 'neonOrange' : 'neonGreen'
        },
        { label: 'Total', value: formatBytes(os.totalmem()), color: 'neonCyan' },
        { label: 'Free', value: formatBytes(os.freemem()), color: 'neonGreen' }
      ],
      panelWidth,
      'neonBlue'
    )

    // Render side by side
    console.log(renderPanelsGrid([cpuPanel, memPanel], 2))
    console.log('\n')

    // Progress bars section
    console.log(colors.muted(' CPU ') + progressBar(cpuLoad, 100, 50))
    console.log(colors.muted('     History: ') + sparkline(this.cpuHistory, 30))
    console.log('')
    console.log(colors.muted(' MEM ') + progressBar(memUsage, 100, 50, true, '#00F0FF', '#FF6B35'))
    console.log(colors.muted('     History: ') + sparkline(this.memHistory, 30))
    console.log('\n')

    // System info panel
    const sysInfo = getSystemInfo()
    console.log(
      liveStatsPanel({
        'CPU Cores': sysInfo.cpu.cores,
        'CPU Speed': `${sysInfo.cpu.speed} MHz`,
        'Total Memory': formatBytes(sysInfo.memory.total),
        'Free Memory': formatBytes(sysInfo.memory.free),
        Platform: sysInfo.os.platform,
        Uptime: `${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m`
      })
    )

    console.log('\n')
    console.log(colors.dimmed(`Press Ctrl+C to exit │ Frame: ${this.frame}`))
  }
}

// Display help screen
export function displayHelp(): void {
  console.log('\n')
  console.log(createGradient(' NEXUS BENCH - COMMAND REFERENCE ', gradientPresets.cyber))
  console.log(colors.dimmed('─'.repeat(60)))
  console.log('\n')

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
    { cmd: 'nexus --version', desc: 'Show version' }
  ]

  for (const { cmd, desc } of commands) {
    console.log(`  ${colors.neonCyan(cmd.padEnd(30))} ${colors.muted(desc)}`)
  }

  console.log('\n')
  console.log(colors.dimmed('─'.repeat(60)))
  console.log(`${colors.muted('Examples:')}`)
  console.log(`  ${colors.dimmed('$')} ${colors.neonGreen('nexus')} ${colors.muted('# Run all benchmarks')}`)
  console.log(
    `  ${colors.dimmed('$')} ${colors.neonGreen('nexus network https://api.example.com')} ${colors.muted('# Test specific endpoint')}`
  )
  console.log(
    `  ${colors.dimmed('$')} ${colors.neonGreen('nexus stress cpu --duration 60')} ${colors.muted('# 60-second CPU stress')}`
  )
  console.log('\n')
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
      passed: results.filter((r) => r.status === 'passed').length,
      warnings: results.filter((r) => r.status === 'warning').length,
      failed: results.filter((r) => r.status === 'failed').length
    }
  }

  Bun.write(path, JSON.stringify(report, null, 2))
  console.log(`${statusIndicator('passed')} ${colors.muted('Results exported to:')} ${colors.neonCyan(path)}`)
}
