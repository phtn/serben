import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs'
import os from 'os'
import { join } from 'path'
import type { BenchmarkResult, ProgressCallback, StorageBenchmarkOptions } from '../types/index.js'
import {
  dashboardPanel,
  progressBar,
  renderPanelsGrid,
  simpleProgressBar,
  statusIndicator,
  stripAnsi
} from '../ui/components.js'
import { colors, formatBytes, formatDuration } from '../utils/colors.js'

interface StorageTestResult {
  name: string
  score: number
  throughputMBps: number
  iops: number
  duration: number
}

const TEMP_DIR = join(os.tmpdir(), 'nexus-bench')

// Ensure temp directory exists
function ensureTempDir(): void {
  if (!existsSync(TEMP_DIR)) {
    mkdirSync(TEMP_DIR, { recursive: true })
  }
}

// Clean up temp directory
function cleanupTempDir(): void {
  if (existsSync(TEMP_DIR)) {
    rmSync(TEMP_DIR, { recursive: true, force: true })
  }
}

// Generate random data buffer
function generateRandomData(size: number): Buffer {
  const buffer = Buffer.allocUnsafe(size)
  for (let i = 0; i < size; i += 4) {
    buffer.writeUInt32LE(Math.random() * 0xffffffff, i)
  }
  return buffer
}

// Sequential write test
function sequentialWriteTest(
  filePath: string,
  totalSize: number,
  blockSize: number
): { throughput: number; iops: number; duration: number } {
  const data = generateRandomData(blockSize)
  const blocks = Math.floor(totalSize / blockSize)

  const startTime = performance.now()

  // Write data in chunks
  const allData = Buffer.concat(Array(blocks).fill(data))
  writeFileSync(filePath, allData)

  const endTime = performance.now()

  const duration = endTime - startTime
  const throughput = totalSize / (1024 * 1024) / (duration / 1000) // MB/s
  const iops = (blocks / duration) * 1000 // IOPS

  return { throughput, iops, duration }
}

// Sequential read test
function sequentialReadTest(
  filePath: string,
  blockSize: number
): { throughput: number; iops: number; duration: number } {
  const stat = statSync(filePath)
  const totalSize = stat.size
  const blocks = Math.floor(totalSize / blockSize)

  const startTime = performance.now()
  const content = readFileSync(filePath)
  const endTime = performance.now()

  const duration = endTime - startTime
  const throughput = totalSize / (1024 * 1024) / (duration / 1000) // MB/s
  const iops = (blocks / duration) * 1000 // IOPS

  // Touch content to ensure read happened
  void content[0]

  return { throughput, iops, duration }
}

// Random write test
function randomWriteTest(
  basePath: string,
  fileCount: number,
  fileSize: number
): { throughput: number; iops: number; duration: number } {
  const data = generateRandomData(fileSize)

  const startTime = performance.now()

  for (let i = 0; i < fileCount; i++) {
    const filePath = join(basePath, `random_${i}.bin`)
    writeFileSync(filePath, data)
  }

  const endTime = performance.now()

  const duration = endTime - startTime
  const totalSize = fileCount * fileSize
  const throughput = totalSize / (1024 * 1024) / (duration / 1000) // MB/s
  const iops = (fileCount / duration) * 1000 // IOPS

  return { throughput, iops, duration }
}

// Random read test
function randomReadTest(basePath: string, fileCount: number): { throughput: number; iops: number; duration: number } {
  let totalSize = 0

  const startTime = performance.now()

  for (let i = 0; i < fileCount; i++) {
    const filePath = join(basePath, `random_${i}.bin`)
    if (existsSync(filePath)) {
      const content = readFileSync(filePath)
      totalSize += content.length
      void content[0] // Touch content
    }
  }

  const endTime = performance.now()

  const duration = endTime - startTime
  const throughput = totalSize / (1024 * 1024) / (duration / 1000) // MB/s
  const iops = (fileCount / duration) * 1000 // IOPS

  return { throughput, iops, duration }
}

// Mixed I/O test
function mixedIOTest(
  basePath: string,
  iterations: number,
  fileSize: number
): { throughput: number; iops: number; duration: number } {
  const data = generateRandomData(fileSize)
  let totalOps = 0
  let totalBytes = 0

  const startTime = performance.now()

  for (let i = 0; i < iterations; i++) {
    const filePath = join(basePath, `mixed_${i % 10}.bin`)

    // Alternate between read and write
    if (i % 2 === 0) {
      writeFileSync(filePath, data)
      totalBytes += fileSize
    } else if (existsSync(filePath)) {
      const content = readFileSync(filePath)
      totalBytes += content.length
      void content[0]
    }
    totalOps++
  }

  const endTime = performance.now()

  const duration = endTime - startTime
  const throughput = totalBytes / (1024 * 1024) / (duration / 1000) // MB/s
  const iops = (totalOps / duration) * 1000 // IOPS

  return { throughput, iops, duration }
}

// Latency test
function latencyTest(basePath: string, iterations: number): { avg: number; min: number; max: number } {
  const latencies: number[] = []
  const filePath = join(basePath, 'latency_test.bin')
  const smallData = Buffer.from('x')

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    writeFileSync(filePath, smallData)
    const end = performance.now()
    latencies.push((end - start) * 1000) // microseconds
  }

  return {
    avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    min: Math.min(...latencies),
    max: Math.max(...latencies)
  }
}

// Main storage benchmark
export async function runStorageBenchmark(
  options: Partial<StorageBenchmarkOptions> = {},
  onProgress?: ProgressCallback
): Promise<BenchmarkResult> {
  const {
    fileSize = 100 * 1024 * 1024, // 100MB
    blockSize = 4 * 1024, // 4KB
    iterations = 100
  } = options

  ensureTempDir()

  const results: StorageTestResult[] = []
  const totalTests = 6
  let completedTests = 0
  const termWidth = process.stdout.columns || 80
  const panelWidth = Math.min(38, Math.floor((termWidth - 4) / 2))

  console.log('\n')

  // Display storage info as dashboard panels
  const locationPanel = dashboardPanel(
    'STORAGE TEST',
    [
      { label: 'Location', value: TEMP_DIR.slice(-25), color: 'neonCyan' },
      { label: 'File Size', value: formatBytes(fileSize), color: 'neonGreen' }
    ],
    panelWidth,
    'neonGreen'
  )

  const configPanel = dashboardPanel(
    'CONFIG',
    [
      { label: 'Block Size', value: formatBytes(blockSize), color: 'neonPink' },
      { label: 'Iterations', value: String(iterations), color: 'neonOrange' }
    ],
    panelWidth,
    'neonPink'
  )

  console.log(renderPanelsGrid([locationPanel, configPanel], 2))
  console.log('\n')
  console.log(colors.dimmed(' Running storage I/O performance tests...\n'))

  try {
    // Test 1: Sequential Write
    onProgress?.(0, 'Testing sequential write...', 'seq_write')
    console.log(`${statusIndicator('running')} ${colors.muted('Sequential Write Test...')}`)

    const seqWriteFile = join(TEMP_DIR, 'seq_write.bin')
    const seqWriteResult = sequentialWriteTest(seqWriteFile, fileSize, blockSize)
    results.push({
      name: 'Sequential Write',
      score: Math.min(100, (seqWriteResult.throughput / 500) * 100),
      throughputMBps: seqWriteResult.throughput,
      iops: seqWriteResult.iops,
      duration: seqWriteResult.duration
    })
    completedTests++
    console.log(
      `${statusIndicator('passed')} ${colors.bright('Sequential Write')} ${progressBar(results[results.length - 1].score, 100, 30)} ${colors.neonCyan(seqWriteResult.throughput.toFixed(1) + ' MB/s')}`
    )

    // Test 2: Sequential Read
    onProgress?.((completedTests / totalTests) * 100, 'Testing sequential read...', 'seq_read')
    console.log(`${statusIndicator('running')} ${colors.muted('Sequential Read Test...')}`)

    const seqReadResult = sequentialReadTest(seqWriteFile, blockSize)
    results.push({
      name: 'Sequential Read',
      score: Math.min(100, (seqReadResult.throughput / 1000) * 100),
      throughputMBps: seqReadResult.throughput,
      iops: seqReadResult.iops,
      duration: seqReadResult.duration
    })
    completedTests++
    console.log(
      `${statusIndicator('passed')} ${colors.bright('Sequential Read')} ${progressBar(results[results.length - 1].score, 100, 30)} ${colors.neonCyan(seqReadResult.throughput.toFixed(1) + ' MB/s')}`
    )

    // Test 3: Random Write
    onProgress?.((completedTests / totalTests) * 100, 'Testing random write...', 'rand_write')
    console.log(`${statusIndicator('running')} ${colors.muted('Random Write Test...')}`)

    const randWriteResult = randomWriteTest(TEMP_DIR, 100, 64 * 1024) // 100 files of 64KB
    results.push({
      name: 'Random Write',
      score: Math.min(100, (randWriteResult.iops / 1000) * 100),
      throughputMBps: randWriteResult.throughput,
      iops: randWriteResult.iops,
      duration: randWriteResult.duration
    })
    completedTests++
    console.log(
      `${statusIndicator('passed')} ${colors.bright('Random Write')} ${progressBar(results[results.length - 1].score, 100, 30)} ${colors.neonGreen(randWriteResult.iops.toFixed(0) + ' IOPS')}`
    )

    // Test 4: Random Read
    onProgress?.((completedTests / totalTests) * 100, 'Testing random read...', 'rand_read')
    console.log(`${statusIndicator('running')} ${colors.muted('Random Read Test...')}`)

    const randReadResult = randomReadTest(TEMP_DIR, 100)
    results.push({
      name: 'Random Read',
      score: Math.min(100, (randReadResult.iops / 2000) * 100),
      throughputMBps: randReadResult.throughput,
      iops: randReadResult.iops,
      duration: randReadResult.duration
    })
    completedTests++
    console.log(
      `${statusIndicator('passed')} ${colors.bright('Random Read')} ${progressBar(results[results.length - 1].score, 100, 30)} ${colors.neonGreen(randReadResult.iops.toFixed(0) + ' IOPS')}`
    )

    // Test 5: Mixed I/O
    onProgress?.((completedTests / totalTests) * 100, 'Testing mixed I/O...', 'mixed')
    console.log(`${statusIndicator('running')} ${colors.muted('Mixed I/O Test...')}`)

    const mixedResult = mixedIOTest(TEMP_DIR, iterations, 64 * 1024)
    results.push({
      name: 'Mixed I/O',
      score: Math.min(100, (mixedResult.iops / 500) * 100),
      throughputMBps: mixedResult.throughput,
      iops: mixedResult.iops,
      duration: mixedResult.duration
    })
    completedTests++
    console.log(
      `${statusIndicator('passed')} ${colors.bright('Mixed I/O')} ${progressBar(results[results.length - 1].score, 100, 30)} ${colors.neonOrange(mixedResult.iops.toFixed(0) + ' IOPS')}`
    )

    // Test 6: Latency
    onProgress?.((completedTests / totalTests) * 100, 'Testing latency...', 'latency')
    console.log(`${statusIndicator('running')} ${colors.muted('Latency Test...')}`)

    const latResult = latencyTest(TEMP_DIR, 100)
    results.push({
      name: 'Write Latency',
      score: Math.min(100, (1000 / latResult.avg) * 10),
      throughputMBps: 0,
      iops: 0,
      duration: latResult.avg * 100
    })
    completedTests++
    console.log(
      `${statusIndicator('passed')} ${colors.bright('Write Latency')} ${progressBar(results[results.length - 1].score, 100, 30)} ${colors.neonPink(latResult.avg.toFixed(2) + ' µs')}`
    )
  } finally {
    // Cleanup
    cleanupTempDir()
  }

  onProgress?.(100, 'Storage benchmark complete!', 'complete')

  // Calculate overall score
  const totalScore = results.reduce((sum, r) => sum + r.score, 0) / results.length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
  const avgThroughput =
    results.filter((r) => r.throughputMBps > 0).reduce((sum, r) => sum + r.throughputMBps, 0) /
    results.filter((r) => r.throughputMBps > 0).length
  const avgIOPS =
    results.filter((r) => r.iops > 0).reduce((sum, r) => sum + r.iops, 0) / results.filter((r) => r.iops > 0).length

  // Display summary as dashboard
  console.log('\n')

  const width = 70
  console.log(colors.neonGreen('╔' + '═'.repeat(width) + '╗'))

  const titleText = ' STORAGE BENCHMARK RESULTS '
  const titlePad = Math.floor((width - titleText.length) / 2)
  console.log(
    colors.neonGreen('║') +
      ' '.repeat(titlePad) +
      colors.bright(titleText) +
      ' '.repeat(width - titlePad - titleText.length) +
      colors.neonGreen('║')
  )

  console.log(colors.neonGreen('╠' + '─'.repeat(width) + '╣'))

  // Score row
  const scoreText = `Overall Score: ${colors.neonPink(totalScore.toFixed(1))}/100`
  const scoreLen = stripAnsi(scoreText).length
  console.log(colors.neonGreen('║') + ' ' + scoreText + ' '.repeat(width - scoreLen - 1) + colors.neonGreen('║'))

  // Progress bar
  const barText = ' ' + progressBar(totalScore, 100, 50)
  console.log(
    colors.neonGreen('║') + barText + ' '.repeat(Math.max(0, width - stripAnsi(barText).length)) + colors.neonGreen('║')
  )

  console.log(colors.neonGreen('╠' + '─'.repeat(width) + '╣'))

  // Stats row
  const statsText = ` Duration: ${colors.neonCyan(formatDuration(totalDuration))}  Throughput: ${colors.neonGreen(avgThroughput.toFixed(1))} MB/s  IOPS: ${colors.neonOrange(avgIOPS.toFixed(0))}`
  console.log(
    colors.neonGreen('║') +
      statsText +
      ' '.repeat(Math.max(0, width - stripAnsi(statsText).length)) +
      colors.neonGreen('║')
  )

  console.log(colors.neonGreen('╠' + '─'.repeat(width) + '╣'))

  // Header
  const headerText = ` ${'Test'.padEnd(18)} ${'Score'.padStart(8)} ${'Bar'.padStart(18)} ${'Metric'.padStart(15)}`
  console.log(
    colors.neonGreen('║') +
      colors.muted(headerText) +
      ' '.repeat(Math.max(0, width - headerText.length)) +
      colors.neonGreen('║')
  )

  // Results
  for (const r of results) {
    const bar = simpleProgressBar(r.score, 100, 12)
    const metric = r.throughputMBps > 0 ? `${r.throughputMBps.toFixed(0)} MB/s` : `${r.iops.toFixed(0)} IOPS`
    const rowText = ` ${colors.muted(r.name.padEnd(18))} ${colors.neonCyan(r.score.toFixed(1).padStart(8))} ${bar} ${colors.neonGreen(metric.padStart(12))}`
    console.log(
      colors.neonGreen('║') +
        rowText +
        ' '.repeat(Math.max(0, width - stripAnsi(rowText).length)) +
        colors.neonGreen('║')
    )
  }

  console.log(colors.neonGreen('╚' + '═'.repeat(width) + '╝'))

  return {
    name: 'Storage Benchmark',
    score: totalScore,
    unit: 'points',
    duration: totalDuration,
    details: {
      testLocation: TEMP_DIR,
      fileSize: formatBytes(fileSize),
      blockSize: formatBytes(blockSize),
      seqWriteScore: results[0].score,
      seqWriteThroughput: results[0].throughputMBps,
      seqReadScore: results[1].score,
      seqReadThroughput: results[1].throughputMBps,
      randWriteScore: results[2].score,
      randWriteIOPS: results[2].iops,
      randReadScore: results[3].score,
      randReadIOPS: results[3].iops,
      mixedIOScore: results[4].score,
      latencyScore: results[5].score,
      averageThroughput: avgThroughput,
      averageIOPS: avgIOPS
    },
    status: totalScore >= 70 ? 'passed' : totalScore >= 40 ? 'warning' : 'failed',
    timestamp: new Date()
  }
}
