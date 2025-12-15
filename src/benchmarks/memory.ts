import os from 'os'
import type { BenchmarkResult, MemoryBenchmarkOptions, ProgressCallback } from '../types/index.js'
import {
  createBox,
  dashboardPanel,
  progressBar,
  renderPanelsGrid,
  simpleProgressBar,
  sparkline,
  statusIndicator,
  stripAnsi
} from '../ui/components.js'
import { colors, formatBytes, formatDuration } from '../utils/colors.js'

interface MemoryTestResult {
  name: string
  score: number
  throughput: number
  latency: number
  duration: number
}

// Sequential memory access pattern
function sequentialAccess(buffer: number[], iterations: number): number {
  let sum = 0
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i]
      buffer[i] = sum % 256
    }
  }
  return sum
}

// Random memory access pattern
function randomAccess(buffer: number[], iterations: number): number {
  let sum = 0
  const len = buffer.length
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < len; i++) {
      const idx = Math.floor(Math.random() * len)
      sum += buffer[idx]
      buffer[idx] = sum % 256
    }
  }
  return sum
}

// Memory copy benchmark
function memoryCopy(size: number): void {
  const source = new Array(size).fill(0).map(() => Math.random())
  const dest = [...source]
  // Touch the destination to ensure copy happened
  dest[0] = dest[dest.length - 1]
}

// Memory allocation/deallocation stress
function allocationStress(iterations: number, sizes: number[]): void {
  const arrays: number[][] = []

  for (let i = 0; i < iterations; i++) {
    const size = sizes[i % sizes.length]
    arrays.push(new Array(size).fill(Math.random()))

    // Periodically clear to trigger GC
    if (arrays.length > 100) {
      arrays.splice(0, 50)
    }
  }
}

// Bandwidth test
function bandwidthTest(sizeMB: number): { read: number; write: number } {
  const size = (sizeMB * 1024 * 1024) / 8 // Convert to number of doubles
  const buffer = new Float64Array(size)

  // Write test
  const writeStart = performance.now()
  for (let i = 0; i < size; i++) {
    buffer[i] = i * 1.5
  }
  const writeEnd = performance.now()
  const writeDuration = writeEnd - writeStart
  const writeBandwidth = (sizeMB * 1000) / writeDuration // MB/s

  // Read test
  let sum = 0
  const readStart = performance.now()
  for (let i = 0; i < size; i++) {
    sum += buffer[i]
  }
  const readEnd = performance.now()
  const readDuration = readEnd - readStart
  const readBandwidth = (sizeMB * 1000) / readDuration // MB/s

  return { read: readBandwidth, write: writeBandwidth }
}

// Latency test
function latencyTest(iterations: number): { avg: number; min: number; max: number } {
  const buffer = new Array(1024).fill(0)
  const latencies: number[] = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    buffer[Math.floor(Math.random() * buffer.length)] = i
    const end = performance.now()
    latencies.push((end - start) * 1000000) // Convert to nanoseconds
  }

  return {
    avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    min: Math.min(...latencies),
    max: Math.max(...latencies)
  }
}

// Run single memory test
async function runMemoryTest(
  name: string,
  testFn: () => { throughput?: number; latency?: number }
): Promise<MemoryTestResult> {
  const startTime = performance.now()

  const result = testFn()

  const endTime = performance.now()
  const duration = endTime - startTime

  // Calculate score based on throughput and latency
  const throughputScore = result.throughput ? Math.min(100, (result.throughput / 10000) * 100) : 50
  const latencyScore = result.latency ? Math.min(100, (1000 / result.latency) * 100) : 50
  const score = (throughputScore + latencyScore) / 2

  return {
    name,
    score,
    throughput: result.throughput || 0,
    latency: result.latency || 0,
    duration
  }
}

// Main memory benchmark
export async function runMemoryBenchmark(
  options: Partial<MemoryBenchmarkOptions> = {},
  onProgress?: ProgressCallback
): Promise<BenchmarkResult> {
  const {
    blockSize = 1024 * 1024, // 1MB
    iterations = 100,
    pattern = 'sequential'
  } = options

  const totalMem = os.totalmem()
  const freeMem = os.freemem()
  const usedMem = totalMem - freeMem

  const results: MemoryTestResult[] = []
  const totalTests = 6
  let completedTests = 0
  const termWidth = process.stdout.columns || 80
  const panelWidth = Math.min(38, Math.floor((termWidth - 4) / 2))

  console.log('\n')

  // Display memory info as dashboard panels
  const memPanel = dashboardPanel(
    'MEMORY INFO',
    [
      { label: 'Total RAM', value: formatBytes(totalMem), color: 'neonCyan' },
      {
        label: 'Used',
        value: `${formatBytes(usedMem)} (${((usedMem / totalMem) * 100).toFixed(0)}%)`,
        color: 'neonOrange'
      },
      { label: 'Free', value: formatBytes(freeMem), color: 'neonGreen' }
    ],
    panelWidth,
    'neonBlue'
  )

  const configPanel = dashboardPanel(
    'CONFIG',
    [
      { label: 'Block Size', value: formatBytes(blockSize), color: 'neonPink' },
      { label: 'Iterations', value: String(iterations), color: 'neonCyan' },
      { label: 'Pattern', value: pattern, color: 'neonGreen' }
    ],
    panelWidth,
    'neonPink'
  )

  console.log(renderPanelsGrid([memPanel, configPanel], 2))
  console.log('\n')

  // Memory usage bar
  console.log(colors.muted(' Usage: ') + progressBar(usedMem, totalMem, 50, true, '#FF6B35', '#00FF88'))
  console.log('\n')
  console.log(colors.dimmed(' Running memory performance tests...\n'))

  // Test 1: Sequential access
  onProgress?.(0, 'Testing sequential access...', 'sequential')
  console.log(`${statusIndicator('running')} ${colors.muted('Sequential Access Pattern...')}`)

  const seqResult = await runMemoryTest('Sequential Access', () => {
    const buffer = new Array(10000).fill(0)
    const start = performance.now()
    sequentialAccess(buffer, 100)
    const duration = performance.now() - start
    return { throughput: (10000 * 100) / duration }
  })
  results.push(seqResult)
  completedTests++
  console.log(
    `${statusIndicator('passed')} ${colors.bright('Sequential Access')} ${progressBar(seqResult.score, 100, 30)}`
  )

  // Test 2: Random access
  onProgress?.((completedTests / totalTests) * 100, 'Testing random access...', 'random')
  console.log(`${statusIndicator('running')} ${colors.muted('Random Access Pattern...')}`)

  const randResult = await runMemoryTest('Random Access', () => {
    const buffer = new Array(10000).fill(0)
    const start = performance.now()
    randomAccess(buffer, 50)
    const duration = performance.now() - start
    return { throughput: (10000 * 50) / duration }
  })
  results.push(randResult)
  completedTests++
  console.log(
    `${statusIndicator('passed')} ${colors.bright('Random Access')} ${progressBar(randResult.score, 100, 30)}`
  )

  // Test 3: Memory copy
  onProgress?.((completedTests / totalTests) * 100, 'Testing memory copy...', 'copy')
  console.log(`${statusIndicator('running')} ${colors.muted('Memory Copy Operations...')}`)

  const copyResult = await runMemoryTest('Memory Copy', () => {
    const start = performance.now()
    for (let i = 0; i < 50; i++) {
      memoryCopy(50000)
    }
    const duration = performance.now() - start
    return { throughput: (50000 * 50 * 8) / duration } // bytes per ms
  })
  results.push(copyResult)
  completedTests++
  console.log(`${statusIndicator('passed')} ${colors.bright('Memory Copy')} ${progressBar(copyResult.score, 100, 30)}`)

  // Test 4: Allocation stress
  onProgress?.((completedTests / totalTests) * 100, 'Testing allocation...', 'alloc')
  console.log(`${statusIndicator('running')} ${colors.muted('Allocation Stress Test...')}`)

  const allocResult = await runMemoryTest('Allocation Stress', () => {
    const sizes = [100, 1000, 10000, 100000]
    const start = performance.now()
    allocationStress(500, sizes)
    const duration = performance.now() - start
    return { throughput: (500 / duration) * 1000 } // allocations per second
  })
  results.push(allocResult)
  completedTests++
  console.log(
    `${statusIndicator('passed')} ${colors.bright('Allocation Stress')} ${progressBar(allocResult.score, 100, 30)}`
  )

  // Test 5: Bandwidth test
  onProgress?.((completedTests / totalTests) * 100, 'Testing bandwidth...', 'bandwidth')
  console.log(`${statusIndicator('running')} ${colors.muted('Memory Bandwidth Test...')}`)

  const bwResult = await runMemoryTest('Memory Bandwidth', () => {
    const { read, write } = bandwidthTest(10) // 10MB test
    return { throughput: (read + write) / 2 }
  })
  results.push(bwResult)
  completedTests++
  console.log(
    `${statusIndicator('passed')} ${colors.bright('Memory Bandwidth')} ${progressBar(bwResult.score, 100, 30)}`
  )

  // Test 6: Latency test
  onProgress?.((completedTests / totalTests) * 100, 'Testing latency...', 'latency')
  console.log(`${statusIndicator('running')} ${colors.muted('Memory Latency Test...')}`)

  const latResult = await runMemoryTest('Memory Latency', () => {
    const { avg } = latencyTest(10000)
    return { latency: avg }
  })
  results.push(latResult)
  completedTests++
  console.log(
    `${statusIndicator('passed')} ${colors.bright('Memory Latency')} ${progressBar(latResult.score, 100, 30)}`
  )

  onProgress?.(100, 'Memory benchmark complete!', 'complete')

  // Calculate overall score
  const totalScore = results.reduce((sum, r) => sum + r.score, 0) / results.length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
  const avgThroughput = results.reduce((sum, r) => sum + r.throughput, 0) / results.length

  // Display summary as dashboard
  console.log('\n')

  const width = 70
  console.log(colors.neonBlue('╔' + '═'.repeat(width) + '╗'))

  const titleText = ' MEMORY BENCHMARK RESULTS '
  const titlePad = Math.floor((width - titleText.length) / 2)
  console.log(
    colors.neonBlue('║') +
      ' '.repeat(titlePad) +
      colors.bright(titleText) +
      ' '.repeat(width - titlePad - titleText.length) +
      colors.neonBlue('║')
  )

  console.log(colors.neonBlue('╠' + '─'.repeat(width) + '╣'))

  // Score row
  const scoreText = `Overall Score: ${colors.neonPink(totalScore.toFixed(1))}/100`
  const scoreLen = stripAnsi(scoreText).length
  console.log(colors.neonBlue('║') + ' ' + scoreText + ' '.repeat(width - scoreLen - 1) + colors.neonBlue('║'))

  // Progress bar
  const barText = ' ' + progressBar(totalScore, 100, 50)
  console.log(
    colors.neonBlue('║') + barText + ' '.repeat(Math.max(0, width - stripAnsi(barText).length)) + colors.neonBlue('║')
  )

  console.log(colors.neonBlue('╠' + '─'.repeat(width) + '╣'))

  // Stats row
  const statsText = ` Duration: ${colors.neonCyan(formatDuration(totalDuration))}    Avg Throughput: ${colors.neonGreen(avgThroughput.toFixed(0))} ops/ms`
  console.log(
    colors.neonBlue('║') +
      statsText +
      ' '.repeat(Math.max(0, width - stripAnsi(statsText).length)) +
      colors.neonBlue('║')
  )

  console.log(colors.neonBlue('╠' + '─'.repeat(width) + '╣'))

  // Header
  const headerText = ` ${'Test'.padEnd(25)} ${'Score'.padStart(8)} ${'Bar'.padStart(22)}`
  console.log(
    colors.neonBlue('║') +
      colors.muted(headerText) +
      ' '.repeat(Math.max(0, width - headerText.length)) +
      colors.neonBlue('║')
  )

  // Results
  for (const r of results) {
    const bar = simpleProgressBar(r.score, 100, 15)
    const rowText = ` ${colors.muted(r.name.padEnd(25))} ${colors.neonCyan(r.score.toFixed(1).padStart(8))} ${bar}`
    console.log(
      colors.neonBlue('║') + rowText + ' '.repeat(Math.max(0, width - stripAnsi(rowText).length)) + colors.neonBlue('║')
    )
  }

  console.log(colors.neonBlue('╚' + '═'.repeat(width) + '╝'))

  return {
    name: 'Memory Benchmark',
    score: totalScore,
    unit: 'points',
    duration: totalDuration,
    details: {
      totalMemory: formatBytes(totalMem),
      usedMemory: formatBytes(usedMem),
      freeMemory: formatBytes(freeMem),
      sequentialScore: seqResult.score,
      randomScore: randResult.score,
      copyScore: copyResult.score,
      allocationScore: allocResult.score,
      bandwidthScore: bwResult.score,
      latencyScore: latResult.score,
      averageThroughput: avgThroughput
    },
    status: totalScore >= 70 ? 'passed' : totalScore >= 40 ? 'warning' : 'failed',
    timestamp: new Date()
  }
}

// Memory stress test
export async function runMemoryStressTest(
  targetPercentage: number = 70,
  durationSeconds: number = 30,
  onProgress?: ProgressCallback
): Promise<void> {
  const totalMem = os.totalmem()
  const targetBytes = Math.floor((totalMem * targetPercentage) / 100)

  console.log('\n')
  console.log(
    createBox(
      'MEMORY STRESS TEST',
      [
        `${colors.muted('Target Usage:')} ${colors.neonOrange(targetPercentage + '%')} ${colors.dimmed('(' + formatBytes(targetBytes) + ')')}`,
        `${colors.muted('Duration:')} ${colors.neonGreen(String(durationSeconds))} ${colors.dimmed('seconds')}`,
        '',
        `${colors.warning('⚠')} ${colors.dimmed('Allocating large memory blocks...')}`,
        `${colors.dimmed('   System may become unresponsive temporarily.')}`
      ],
      60,
      'neonOrange'
    )
  )
  console.log('\n')

  const startTime = Date.now()
  const endTime = startTime + durationSeconds * 1000
  const memoryBlocks: ArrayBuffer[] = []
  const blockSize = 100 * 1024 * 1024 // 100MB blocks
  const usageHistory: number[] = []

  try {
    // Allocate memory
    while (Date.now() < endTime) {
      const currentUsage = ((totalMem - os.freemem()) / totalMem) * 100
      usageHistory.push(currentUsage)
      if (usageHistory.length > 60) usageHistory.shift()

      if (currentUsage < targetPercentage && memoryBlocks.length < 50) {
        // Allocate more memory
        try {
          memoryBlocks.push(new ArrayBuffer(blockSize))
        } catch {
          // Allocation failed, we've hit the limit
          break
        }
      }

      const elapsed = Date.now() - startTime
      const progress = (elapsed / (durationSeconds * 1000)) * 100

      onProgress?.(progress, `Stress testing memory... ${memoryBlocks.length} blocks allocated`, 'stress')

      process.stdout.write(
        `\r${statusIndicator('running')} ${colors.muted('Progress:')} ${progressBar(progress, 100, 25)} ` +
          `${colors.dimmed('|')} ${colors.muted('Usage:')} ${colors.neonOrange(currentUsage.toFixed(1) + '%')} ` +
          `${colors.dimmed('|')} ${sparkline(usageHistory, 15)}`
      )

      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  } finally {
    // Release memory
    memoryBlocks.length = 0
    global.gc?.()
  }

  console.log('\n\n')
  console.log(`${statusIndicator('passed')} ${colors.success('Memory stress test completed!')}`)
  console.log(`${colors.muted('   Peak blocks allocated:')} ${colors.neonCyan(String(memoryBlocks.length))}`)
  console.log(
    `${colors.muted('   Average usage:')} ${colors.neonGreen((usageHistory.reduce((a, b) => a + b, 0) / usageHistory.length).toFixed(1) + '%')}`
  )
}
