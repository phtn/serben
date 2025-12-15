import { colors, createGradient, gradientPresets, formatBytes, formatDuration, scoreColor } from '../utils/colors.js';
import { box, boxRound, progress, icons, spinners, separator, decorators } from '../utils/ascii.js';
import type { BenchmarkResult } from '../types/index.js';

const terminalWidth = process.stdout.columns || 80;

// Create a styled box with content
export function createBox(
  title: string,
  content: string[],
  width: number = 60,
  color: keyof typeof colors = 'neonPink'
): string {
  const colorFn = colors[color];
  const innerWidth = width - 4;
  
  const lines: string[] = [];
  
  // Top border with title
  const titleText = ` ${title} `;
  const titleLen = title.length + 2;
  const leftBorder = Math.floor((width - titleLen) / 2);
  const rightBorder = width - leftBorder - titleLen;
  
  lines.push(
    colorFn(boxRound.topLeft) +
    colorFn(boxRound.horizontal.repeat(leftBorder)) +
    colors.bright(titleText) +
    colorFn(boxRound.horizontal.repeat(rightBorder)) +
    colorFn(boxRound.topRight)
  );
  
  // Content lines
  for (const line of content) {
    const stripped = stripAnsi(line);
    const padding = innerWidth - stripped.length;
    const rightPad = Math.max(0, padding);
    lines.push(
      colorFn(boxRound.vertical) + ' ' + line + ' '.repeat(rightPad) + ' ' + colorFn(boxRound.vertical)
    );
  }
  
  // Bottom border
  lines.push(
    colorFn(boxRound.bottomLeft) +
    colorFn(boxRound.horizontal.repeat(width)) +
    colorFn(boxRound.bottomRight)
  );
  
  return lines.join('\n');
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
  const percentage = Math.min(1, Math.max(0, value / max));
  const filled = Math.round(percentage * width);
  const empty = width - filled;
  
  let bar = '';
  for (let i = 0; i < filled; i++) {
    const t = i / width;
    const r1 = parseInt(colorStart.slice(1, 3), 16);
    const g1 = parseInt(colorStart.slice(3, 5), 16);
    const b1 = parseInt(colorStart.slice(5, 7), 16);
    const r2 = parseInt(colorEnd.slice(1, 3), 16);
    const g2 = parseInt(colorEnd.slice(3, 5), 16);
    const b2 = parseInt(colorEnd.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    bar += `\x1b[38;2;${r};${g};${b}m${progress.full}\x1b[0m`;
  }
  
  bar += colors.dimmed(progress.light.repeat(empty));
  
  if (showPercentage) {
    const pct = (percentage * 100).toFixed(1);
    bar += ` ${colors.neonCyan(pct + '%')}`;
  }
  
  return `${colors.dimmed('▐')}${bar}${colors.dimmed('▌')}`;
}

// Create animated spinner
export function createSpinner(frame: number, style: keyof typeof spinners = 'cyber'): string {
  const frames = spinners[style];
  const idx = frame % frames.length;
  return colors.neonCyan(frames[idx]);
}

// Create status indicator
export function statusIndicator(status: 'running' | 'passed' | 'failed' | 'warning' | 'pending'): string {
  switch (status) {
    case 'running':
      return colors.neonBlue('◉');
    case 'passed':
      return colors.success(icons.success);
    case 'failed':
      return colors.error(icons.error);
    case 'warning':
      return colors.warning(icons.warning);
    case 'pending':
      return colors.dimmed('○');
  }
}

// Create metric display
export function metricDisplay(
  label: string,
  value: string | number,
  unit: string = '',
  maxWidth: number = 30
): string {
  const valueStr = typeof value === 'number' ? value.toFixed(2) : value;
  const labelPart = colors.muted(label + ':');
  const valuePart = colors.neonGreen(valueStr);
  const unitPart = unit ? colors.dimmed(` ${unit}`) : '';
  
  return `${labelPart} ${valuePart}${unitPart}`;
}

// Create benchmark result card
export function benchmarkCard(result: BenchmarkResult, width: number = 60): string {
  const lines: string[] = [];
  
  // Header
  const status = statusIndicator(result.status);
  const nameStyled = colors.bright(result.name);
  lines.push(`${status} ${nameStyled}`);
  
  // Score bar
  const scoreBar = progressBar(result.score, 100, width - 20);
  lines.push(scoreBar);
  
  // Details
  for (const [key, val] of Object.entries(result.details)) {
    const formatted = typeof val === 'number' ? val.toFixed(2) : String(val);
    lines.push(`  ${colors.dimmed('├─')} ${colors.muted(key)}: ${colors.neonCyan(formatted)}`);
  }
  
  // Duration
  lines.push(`  ${colors.dimmed('└─')} ${colors.muted('Duration')}: ${colors.neonPink(formatDuration(result.duration))}`);
  
  return lines.join('\n');
}

// Create live stats panel
export function liveStatsPanel(stats: Record<string, number | string>, title: string = 'LIVE METRICS'): string {
  const width = 50;
  const lines: string[] = [];
  
  // Decorative header
  lines.push(colors.neonPink('╔' + '═'.repeat(width) + '╗'));
  lines.push(colors.neonPink('║') + createGradient(` ⚡ ${title} ⚡ `.padStart((width + title.length + 6) / 2).padEnd(width), gradientPresets.cyber) + colors.neonPink('║'));
  lines.push(colors.neonPink('╠' + '═'.repeat(width) + '╣'));
  
  // Stats
  for (const [key, value] of Object.entries(stats)) {
    const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;
    const line = ` ${colors.muted(key.padEnd(20))} ${colors.neonGreen(String(formattedValue).padStart(25))} `;
    lines.push(colors.neonPink('║') + line.padEnd(width) + colors.neonPink('║'));
  }
  
  lines.push(colors.neonPink('╚' + '═'.repeat(width) + '╝'));
  
  return lines.join('\n');
}

// Create table
export function createTable(
  headers: string[],
  rows: (string | number)[][],
  columnWidths?: number[]
): string {
  const numCols = headers.length;
  const widths = columnWidths || headers.map((h, i) => {
    const maxContent = Math.max(h.length, ...rows.map(r => String(r[i]).length));
    return Math.min(30, maxContent + 2);
  });
  
  const lines: string[] = [];
  
  // Header
  const headerCells = headers.map((h, i) => colors.neonPink(h.padEnd(widths[i])));
  lines.push(colors.dimmed('┌' + widths.map(w => '─'.repeat(w + 2)).join('┬') + '┐'));
  lines.push(colors.dimmed('│') + ' ' + headerCells.join(colors.dimmed(' │ ')) + ' ' + colors.dimmed('│'));
  lines.push(colors.dimmed('├' + widths.map(w => '─'.repeat(w + 2)).join('┼') + '┤'));
  
  // Rows
  for (const row of rows) {
    const cells = row.map((cell, i) => {
      const str = String(cell);
      return colors.subtle(str.padEnd(widths[i]));
    });
    lines.push(colors.dimmed('│') + ' ' + cells.join(colors.dimmed(' │ ')) + ' ' + colors.dimmed('│'));
  }
  
  lines.push(colors.dimmed('└' + widths.map(w => '─'.repeat(w + 2)).join('┴') + '┘'));
  
  return lines.join('\n');
}

// Create ASCII chart (simple bar chart)
export function barChart(
  data: { label: string; value: number }[],
  maxWidth: number = 40,
  color: string = '#00F0FF'
): string {
  const maxValue = Math.max(...data.map(d => d.value));
  const labelWidth = Math.max(...data.map(d => d.label.length));
  
  return data.map(({ label, value }) => {
    const barWidth = Math.round((value / maxValue) * maxWidth);
    const bar = createGradient('█'.repeat(barWidth), ['#FF2D95', color]);
    const pct = ((value / maxValue) * 100).toFixed(0);
    return `${colors.muted(label.padEnd(labelWidth))} ${colors.dimmed('▐')}${bar}${colors.dimmed('▌')} ${colors.neonCyan(pct + '%')}`;
  }).join('\n');
}

// Create sparkline
export function sparkline(data: number[], width: number = 20): string {
  const chars = ' ▁▂▃▄▅▆▇█';
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const normalized = data.slice(-width).map(v => 
    Math.round(((v - min) / range) * (chars.length - 1))
  );
  
  return normalized.map(i => colors.neonCyan(chars[i])).join('');
}

// Create section divider
export function sectionDivider(title: string, width: number = 60): string {
  const titleLen = title.length + 4;
  const leftLen = Math.floor((width - titleLen) / 2);
  const rightLen = width - titleLen - leftLen;
  
  return colors.dimmed('─'.repeat(leftLen)) + 
         colors.neonPink(` ${icons.lightning} ${title} ${icons.lightning} `) + 
         colors.dimmed('─'.repeat(rightLen));
}

// Strip ANSI codes for length calculation
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

// Animated loading bar
export function loadingAnimation(frame: number, width: number = 40): string {
  const position = frame % (width * 2);
  const chars = new Array(width).fill(progress.light);
  
  const glowWidth = 5;
  const actualPos = position < width ? position : (width * 2) - position;
  
  for (let i = 0; i < glowWidth; i++) {
    const idx = actualPos - glowWidth / 2 + i;
    if (idx >= 0 && idx < width) {
      const intensity = 1 - Math.abs(i - glowWidth / 2) / (glowWidth / 2);
      if (intensity > 0.7) {
        chars[idx] = progress.full;
      } else if (intensity > 0.4) {
        chars[idx] = progress.almost;
      } else {
        chars[idx] = progress.half;
      }
    }
  }
  
  return colors.dimmed('▐') + 
         createGradient(chars.join(''), gradientPresets.cyber) + 
         colors.dimmed('▌');
}

// Create fancy banner
export function createBanner(text: string): string {
  const width = text.length + 8;
  const lines: string[] = [];
  
  lines.push(createGradient('╔' + '═'.repeat(width) + '╗', gradientPresets.fire));
  lines.push(createGradient('║', gradientPresets.fire) + 
             '  ' + colors.bright(icons.fire) + ' ' + 
             createGradient(text, gradientPresets.cyber) + 
             ' ' + colors.bright(icons.fire) + '  ' + 
             createGradient('║', gradientPresets.fire));
  lines.push(createGradient('╚' + '═'.repeat(width) + '╝', gradientPresets.fire));
  
  return lines.join('\n');
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
    ['--version', 'Show version info'],
  ];
  
  return createTable(['Command', 'Description'], commands, [20, 40]);
}

// Matrix rain frame
export function matrixRainFrame(width: number, height: number, frame: number): string[] {
  const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789';
  const lines: string[] = [];
  
  for (let y = 0; y < height; y++) {
    let line = '';
    for (let x = 0; x < width; x++) {
      const drop = ((x * 7 + frame) % height);
      const dist = Math.abs(y - drop);
      
      if (dist === 0) {
        line += colors.bright(chars[Math.floor(Math.random() * chars.length)]);
      } else if (dist < 3) {
        line += colors.matrixGreen(chars[Math.floor(Math.random() * chars.length)]);
      } else if (dist < 6) {
        line += colors.dimmed(chars[Math.floor(Math.random() * chars.length)]);
      } else {
        line += ' ';
      }
    }
    lines.push(line);
  }
  
  return lines;
}

