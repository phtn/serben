import type { BenchmarkResult } from '../types/index.js'
import { boxRound, icons, progress, spinners } from '../utils/ascii.js'
import { colors, createGradient, formatDuration, gradientPresets } from '../utils/colors.js'

const terminalWidth = process.stdout.columns || 80

// Strip ANSI codes for length calculation
export function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '')
}

// Create a styled box with content - FIXED alignment
export function createBox(
  title: string,
  content: string[],
  width: number = 60,
  color: keyof typeof colors = 'neonPink'
): string {
  const colorFn = colors[color]
  const innerWidth = width - 2 // Account for left and right borders only

  const lines: string[] = []

  // Top border with title
  const titleText = ` ${title} `
  const titleLen = stripAnsi(titleText).length
  const remainingWidth = width - titleLen
  const leftBorder = Math.floor(remainingWidth / 2)
  const rightBorder = remainingWidth - leftBorder

  lines.push(
    colorFn(boxRound.topLeft) +
      colorFn(boxRound.horizontal.repeat(leftBorder)) +
      colors.bright(titleText) +
      colorFn(boxRound.horizontal.repeat(rightBorder)) +
      colorFn(boxRound.topRight)
  )

  // Content lines
  for (const line of content) {
    const stripped = stripAnsi(line)
    const padding = innerWidth - stripped.length
    const rightPad = Math.max(0, padding)
    lines.push(colorFn(boxRound.vertical) + line + ' '.repeat(rightPad) + colorFn(boxRound.vertical))
  }

  // Bottom border
  lines.push(colorFn(boxRound.bottomLeft) + colorFn(boxRound.horizontal.repeat(width)) + colorFn(boxRound.bottomRight))

  return lines.join('\n')
}

// Create a dashboard panel with proper alignment
export function dashboardPanel(
  title: string,
  rows: { label: string; value: string; color?: keyof typeof colors }[],
  width: number = 40,
  borderColor: keyof typeof colors = 'neonCyan'
): string[] {
  const colorFn = colors[borderColor]
  const lines: string[] = []

  // Top border with title
  // Structure: ╭ + ─── + title + ─── + ╮
  const titleText = ` ${title} `
  const titleLen = stripAnsi(titleText).length
  const borderWidth = width // Total horizontal lines between corners
  const remainingWidth = borderWidth - titleLen
  const leftBorder = Math.floor(remainingWidth / 2)
  const rightBorder = remainingWidth - leftBorder

  lines.push(
    colorFn('╭') +
      colorFn('─'.repeat(Math.max(0, leftBorder))) +
      colors.bright(titleText) +
      colorFn('─'.repeat(Math.max(0, rightBorder))) +
      colorFn('╮')
  )

  // Content rows
  // Structure: │ + space + label + spaces + value + space + │
  // Available content width = width (matches top/bottom border)
  const contentWidth = width // Space between the two │ characters

  for (const row of rows) {
    const valueColor = row.color ? colors[row.color] : colors.neonCyan
    const labelPart = colors.muted(row.label)
    const valuePart = valueColor(row.value)

    const labelLen = stripAnsi(row.label).length
    const valueLen = stripAnsi(row.value).length

    // We want: " label     value " to fill contentWidth
    // So: 1 (leading space) + labelLen + gap + valueLen + 1 (trailing space) = contentWidth
    const gap = contentWidth - labelLen - valueLen - 2 // -2 for leading and trailing spaces

    const content = ' ' + labelPart + ' '.repeat(Math.max(1, gap)) + valuePart + ' '

    lines.push(colorFn('│') + content + colorFn('│'))
  }

  // Bottom border - must match top border width
  lines.push(colorFn('╰') + colorFn('─'.repeat(width)) + colorFn('╯'))

  return lines
}

// Render panels side by side (dashboard grid)
export function renderPanelsGrid(panels: string[][], gap: number = 2): string {
  const maxHeight = Math.max(...panels.map((p) => p.length))
  const lines: string[] = []

  // Normalize all panels to same height
  const normalizedPanels = panels.map((panel) => {
    const width = panel.length > 0 ? stripAnsi(panel[0]).length : 0
    const padded = [...panel]
    while (padded.length < maxHeight) {
      padded.push(' '.repeat(width))
    }
    return padded
  })

  // Render each line
  for (let i = 0; i < maxHeight; i++) {
    const lineParts = normalizedPanels.map((panel) => panel[i] || '')
    lines.push(lineParts.join(' '.repeat(gap)))
  }

  return lines.join('\n')
}

// Create progress bar
export function progressBar(
  value: number,
  max: number,
  width: number = 40,
  showPercentage: boolean = true,
  colorStart: string = '#FF2D95',
  colorEnd: string = '#00F0FF'
): string {
  const percentage = Math.min(1, Math.max(0, value / max))
  const filled = Math.round(percentage * width)
  const empty = width - filled

  let bar = ''
  for (let i = 0; i < filled; i++) {
    const t = i / width
    const r1 = parseInt(colorStart.slice(1, 3), 16)
    const g1 = parseInt(colorStart.slice(3, 5), 16)
    const b1 = parseInt(colorStart.slice(5, 7), 16)
    const r2 = parseInt(colorEnd.slice(1, 3), 16)
    const g2 = parseInt(colorEnd.slice(3, 5), 16)
    const b2 = parseInt(colorEnd.slice(5, 7), 16)

    const r = Math.round(r1 + (r2 - r1) * t)
    const g = Math.round(g1 + (g2 - g1) * t)
    const b = Math.round(b1 + (b2 - b1) * t)

    bar += `\x1b[38;2;${r};${g};${b}m${progress.full}\x1b[0m`
  }

  bar += colors.dimmed(progress.light.repeat(empty))

  if (showPercentage) {
    const pct = (percentage * 100).toFixed(1)
    bar += ` ${colors.neonCyan(pct + '%')}`
  }

  return `${colors.dimmed('▐')}${bar}${colors.dimmed('▌')}`
}

// Create a simple inline progress bar (no wrapper)
export function simpleProgressBar(
  value: number,
  max: number,
  width: number = 20,
  colorStart: string = '#FF2D95',
  colorEnd: string = '#00F0FF'
): string {
  const percentage = Math.min(1, Math.max(0, value / max))
  const filled = Math.round(percentage * width)
  const empty = width - filled

  let bar = ''
  for (let i = 0; i < filled; i++) {
    const t = i / width
    const r1 = parseInt(colorStart.slice(1, 3), 16)
    const g1 = parseInt(colorStart.slice(3, 5), 16)
    const b1 = parseInt(colorStart.slice(5, 7), 16)
    const r2 = parseInt(colorEnd.slice(1, 3), 16)
    const g2 = parseInt(colorEnd.slice(3, 5), 16)
    const b2 = parseInt(colorEnd.slice(5, 7), 16)

    const r = Math.round(r1 + (r2 - r1) * t)
    const g = Math.round(g1 + (g2 - g1) * t)
    const b = Math.round(b1 + (b2 - b1) * t)

    bar += `\x1b[38;2;${r};${g};${b}m${progress.full}\x1b[0m`
  }

  bar += colors.dimmed(progress.light.repeat(empty))
  return bar
}

// Create animated spinner
export function createSpinner(frame: number, style: keyof typeof spinners = 'cyber'): string {
  const frames = spinners[style]
  const idx = frame % frames.length
  return colors.neonCyan(frames[idx])
}

// Create status indicator
export function statusIndicator(status: 'running' | 'passed' | 'failed' | 'warning' | 'pending'): string {
  switch (status) {
    case 'running':
      return colors.neonBlue('◉')
    case 'passed':
      return colors.success(icons.success)
    case 'failed':
      return colors.error(icons.error)
    case 'warning':
      return colors.warning(icons.warning)
    case 'pending':
      return colors.dimmed('○')
  }
}

// Create metric display
export function metricDisplay(label: string, value: string | number, unit: string = '', maxWidth: number = 30): string {
  const valueStr = typeof value === 'number' ? value.toFixed(2) : value
  const labelPart = colors.muted(label + ':')
  const valuePart = colors.neonGreen(valueStr)
  const unitPart = unit ? colors.dimmed(` ${unit}`) : ''

  return `${labelPart} ${valuePart}${unitPart}`
}

// Create benchmark result card
export function benchmarkCard(result: BenchmarkResult, width: number = 60): string {
  const lines: string[] = []

  // Header
  const status = statusIndicator(result.status)
  const nameStyled = colors.bright(result.name)
  lines.push(`${status} ${nameStyled}`)

  // Score bar
  const scoreBar = progressBar(result.score, 100, width - 20)
  lines.push(scoreBar)

  // Details
  for (const [key, val] of Object.entries(result.details)) {
    const formatted = typeof val === 'number' ? val.toFixed(2) : String(val)
    lines.push(`  ${colors.dimmed('├─')} ${colors.muted(key)}: ${colors.neonCyan(formatted)}`)
  }

  // Duration
  lines.push(
    `  ${colors.dimmed('└─')} ${colors.muted('Duration')}: ${colors.neonPink(formatDuration(result.duration))}`
  )

  return lines.join('\n')
}

// Create dashboard stats grid
export function statsGrid(
  stats: { label: string; value: string; bar?: number; color?: keyof typeof colors }[],
  columns: number = 2,
  columnWidth: number = 35
): string {
  const lines: string[] = []
  const rows = Math.ceil(stats.length / columns)

  for (let row = 0; row < rows; row++) {
    let line = ''
    for (let col = 0; col < columns; col++) {
      const idx = row * columns + col
      if (idx < stats.length) {
        const stat = stats[idx]
        const valueColor = stat.color ? colors[stat.color] : colors.neonCyan

        let cell = ''
        if (stat.bar !== undefined) {
          const barWidth = 12
          const bar = simpleProgressBar(stat.bar, 100, barWidth)
          cell = `${colors.muted(stat.label.padEnd(12))} ${bar} ${valueColor(stat.value)}`
        } else {
          cell = `${colors.muted(stat.label.padEnd(12))} ${valueColor(stat.value)}`
        }

        const cellLen = stripAnsi(cell).length
        line += cell + ' '.repeat(Math.max(0, columnWidth - cellLen))
      }
    }
    lines.push(line)
  }

  return lines.join('\n')
}

// Create live stats panel - FIXED
export function liveStatsPanel(stats: Record<string, number | string>, title: string = 'LIVE METRICS'): string {
  const width = 52
  const innerWidth = width - 2
  const lines: string[] = []

  // Decorative header
  const titleText = ` ⚡ ${title} ⚡ `
  const titleLen = stripAnsi(titleText).length
  const leftPad = Math.floor((width - titleLen) / 2)
  const rightPad = width - titleLen - leftPad

  lines.push(colors.neonPink('╔' + '═'.repeat(width) + '╗'))
  lines.push(
    colors.neonPink('║') +
      ' '.repeat(leftPad) +
      createGradient(titleText, gradientPresets.cyber) +
      ' '.repeat(rightPad) +
      colors.neonPink('║')
  )
  lines.push(colors.neonPink('╠' + '═'.repeat(width) + '╣'))

  // Stats
  for (const [key, value] of Object.entries(stats)) {
    const formattedValue = typeof value === 'number' ? value.toFixed(2) : String(value)
    const keyPart = colors.muted(key)
    const valuePart = colors.neonGreen(formattedValue)

    const keyLen = stripAnsi(key).length
    const valueLen = stripAnsi(formattedValue).length
    const spacing = innerWidth - keyLen - valueLen - 2

    const content = ' ' + keyPart + ' '.repeat(Math.max(1, spacing)) + valuePart + ' '
    lines.push(colors.neonPink('║') + content + colors.neonPink('║'))
  }

  lines.push(colors.neonPink('╚' + '═'.repeat(width) + '╝'))

  return lines.join('\n')
}

// Create table
export function createTable(headers: string[], rows: (string | number)[][], columnWidths?: number[]): string {
  const numCols = headers.length
  const widths =
    columnWidths ||
    headers.map((h, i) => {
      const maxContent = Math.max(h.length, ...rows.map((r) => String(r[i]).length))
      return Math.min(30, maxContent + 2)
    })

  const totalWidth = widths.reduce((a, b) => a + b, 0) + (numCols - 1) * 3 + 4
  const lines: string[] = []

  // Header
  const headerCells = headers.map((h, i) => colors.neonPink(h.padEnd(widths[i])))
  lines.push(colors.dimmed('┌' + widths.map((w) => '─'.repeat(w + 2)).join('┬') + '┐'))
  lines.push(colors.dimmed('│') + ' ' + headerCells.join(colors.dimmed(' │ ')) + ' ' + colors.dimmed('│'))
  lines.push(colors.dimmed('├' + widths.map((w) => '─'.repeat(w + 2)).join('┼') + '┤'))

  // Rows
  for (const row of rows) {
    const cells = row.map((cell, i) => {
      const str = String(cell)
      return colors.subtle(str.padEnd(widths[i]))
    })
    lines.push(colors.dimmed('│') + ' ' + cells.join(colors.dimmed(' │ ')) + ' ' + colors.dimmed('│'))
  }

  lines.push(colors.dimmed('└' + widths.map((w) => '─'.repeat(w + 2)).join('┴') + '┘'))

  return lines.join('\n')
}

// Create ASCII chart (simple bar chart)
export function barChart(
  data: { label: string; value: number }[],
  maxWidth: number = 40,
  color: string = '#00F0FF'
): string {
  const maxValue = Math.max(...data.map((d) => d.value))
  const labelWidth = Math.max(...data.map((d) => d.label.length))

  return data
    .map(({ label, value }) => {
      const barWidth = Math.round((value / maxValue) * maxWidth)
      const bar = createGradient('█'.repeat(barWidth), ['#FF2D95', color])
      const emptyWidth = maxWidth - barWidth
      const empty = colors.dimmed('░'.repeat(emptyWidth))
      const pct = ((value / maxValue) * 100).toFixed(0)
      return `${colors.muted(label.padEnd(labelWidth))} ${bar}${empty} ${colors.neonCyan(pct.padStart(3) + '%')}`
    })
    .join('\n')
}

// Create sparkline
export function sparkline(data: number[], width: number = 20): string {
  const chars = ' ▁▂▃▄▅▆▇█'
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const normalized = data.slice(-width).map((v) => Math.round(((v - min) / range) * (chars.length - 1)))

  return normalized.map((i) => colors.neonCyan(chars[i])).join('')
}

// Create section divider
export function sectionDivider(title: string, width: number = 60): string {
  const titleLen = title.length + 4
  const leftLen = Math.floor((width - titleLen) / 2)
  const rightLen = width - titleLen - leftLen

  return (
    colors.dimmed('─'.repeat(leftLen)) +
    colors.neonPink(` ${icons.lightning} ${title} ${icons.lightning} `) +
    colors.dimmed('─'.repeat(rightLen))
  )
}

// Animated loading bar
export function loadingAnimation(frame: number, width: number = 40): string {
  const position = frame % (width * 2)
  const chars = new Array(width).fill(progress.light)

  const glowWidth = 5
  const actualPos = position < width ? position : width * 2 - position

  for (let i = 0; i < glowWidth; i++) {
    const idx = actualPos - glowWidth / 2 + i
    if (idx >= 0 && idx < width) {
      const intensity = 1 - Math.abs(i - glowWidth / 2) / (glowWidth / 2)
      if (intensity > 0.7) {
        chars[idx] = progress.full
      } else if (intensity > 0.4) {
        chars[idx] = progress.almost
      } else {
        chars[idx] = progress.half
      }
    }
  }

  return colors.dimmed('▐') + createGradient(chars.join(''), gradientPresets.cyber) + colors.dimmed('▌')
}

// Create fancy banner
export function createBanner(text: string): string {
  const width = stripAnsi(text).length + 8
  const lines: string[] = []

  lines.push(createGradient('╔' + '═'.repeat(width) + '╗', gradientPresets.fire))
  lines.push(
    createGradient('║', gradientPresets.fire) +
      '  ' +
      colors.bright(icons.fire) +
      ' ' +
      createGradient(text, gradientPresets.cyber) +
      ' ' +
      colors.bright(icons.fire) +
      '  ' +
      createGradient('║', gradientPresets.fire)
  )
  lines.push(createGradient('╚' + '═'.repeat(width) + '╝', gradientPresets.fire))

  return lines.join('\n')
}

// Create help panel
export function helpPanel(): string {
  const commands = [
    ['bench', 'Run full benchmark suite'],
    ['cpu', 'CPU stress test and benchmark'],
    ['memory', 'Memory performance test'],
    ['storage', 'Storage I/O benchmark'],
    ['network <url>', 'Network throughput test'],
    ['--help', 'Show this help message'],
    ['--version', 'Show version info']
  ]

  return createTable(['Command', 'Description'], commands, [20, 40])
}

// Create results summary panel
export function resultsSummaryPanel(results: BenchmarkResult[]): string {
  const width = 70
  const innerWidth = width - 2
  const lines: string[] = []

  // Calculate overall score
  const overallScore = results.reduce((sum, r) => sum + r.score, 0) / results.length

  // Header
  lines.push(colors.neonPink('╔' + '═'.repeat(width) + '╗'))

  const titleText = ' BENCHMARK RESULTS SUMMARY '
  const titlePad = Math.floor((width - titleText.length) / 2)
  lines.push(
    colors.neonPink('║') +
      ' '.repeat(titlePad) +
      createGradient(titleText, gradientPresets.cyber) +
      ' '.repeat(width - titlePad - titleText.length) +
      colors.neonPink('║')
  )

  lines.push(colors.neonPink('╠' + '═'.repeat(width) + '╣'))

  // Overall score
  const scoreLabel = 'Overall Score:'
  const scoreValue = `${overallScore.toFixed(1)}/100`
  const scoreLine = ` ${colors.muted(scoreLabel)} ${colors.neonPink(scoreValue)}`
  lines.push(
    colors.neonPink('║') + scoreLine + ' '.repeat(innerWidth - stripAnsi(scoreLine).length) + colors.neonPink('║')
  )

  // Progress bar line
  const barLine = ' ' + progressBar(overallScore, 100, 50)
  lines.push(
    colors.neonPink('║') +
      barLine +
      ' '.repeat(Math.max(0, innerWidth - stripAnsi(barLine).length)) +
      colors.neonPink('║')
  )

  lines.push(colors.neonPink('╠' + '─'.repeat(width) + '╣'))

  // Individual results header
  const headerLine = ` ${'Test'.padEnd(25)} ${'Score'.padStart(8)} ${'Status'.padStart(10)}`
  lines.push(
    colors.neonPink('║') + colors.muted(headerLine) + ' '.repeat(innerWidth - headerLine.length) + colors.neonPink('║')
  )
  lines.push(colors.neonPink('║') + colors.dimmed(' ' + '─'.repeat(innerWidth - 1)) + colors.neonPink('║'))

  // Individual results
  for (const result of results) {
    const status = statusIndicator(result.status)
    const testName = result.name.padEnd(25)
    const score = result.score.toFixed(1).padStart(8)
    const resultLine = ` ${colors.bright(testName)} ${colors.neonCyan(score)} ${status}`
    lines.push(
      colors.neonPink('║') +
        resultLine +
        ' '.repeat(Math.max(0, innerWidth - stripAnsi(resultLine).length - 5)) +
        colors.neonPink('║')
    )
  }

  lines.push(colors.neonPink('╚' + '═'.repeat(width) + '╝'))

  return lines.join('\n')
}

// Matrix rain frame
export function matrixRainFrame(width: number, height: number, frame: number): string[] {
  const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789'
  const lines: string[] = []

  for (let y = 0; y < height; y++) {
    let line = ''
    for (let x = 0; x < width; x++) {
      const drop = (x * 7 + frame) % height
      const dist = Math.abs(y - drop)

      if (dist === 0) {
        line += colors.bright(chars[Math.floor(Math.random() * chars.length)])
      } else if (dist < 3) {
        line += colors.matrixGreen(chars[Math.floor(Math.random() * chars.length)])
      } else if (dist < 6) {
        line += colors.dimmed(chars[Math.floor(Math.random() * chars.length)])
      } else {
        line += ' '
      }
    }
    lines.push(line)
  }

  return lines
}
