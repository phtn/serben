import { colors, createGradient, gradientPresets } from './colors.js';

// Epic ASCII art logo
export const NEXUS_LOGO = `
███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗    ██████╗ ███████╗███╗   ██╗ ██████╗██╗  ██╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝    ██╔══██╗██╔════╝████╗  ██║██╔════╝██║  ██║
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗    ██████╔╝█████╗  ██╔██╗ ██║██║     ███████║
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║    ██╔══██╗██╔══╝  ██║╚██╗██║██║     ██╔══██║
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║    ██████╔╝███████╗██║ ╚████║╚██████╗██║  ██║
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝    ╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝╚═╝  ╚═╝
`;

export const NEXUS_LOGO_SMALL = `
╔═╗╔═╗═╗ ╦╦ ╦╔═╗  ╔╗ ╔═╗╔╗╔╔═╗╦ ╦
║║║║╣ ╔╩╦╝║ ║╚═╗  ╠╩╗║╣ ║║║║  ╠═╣
╝╚╝╚═╝╩ ╚═╚═╝╚═╝  ╚═╝╚═╝╝╚╝╚═╝╩ ╩`;

export const CPU_ICON = `
 ┌───────────┐
 │ ▓▓▓▓▓▓▓▓▓ │
 │ ▓ CPU ▓ │
 │ ▓▓▓▓▓▓▓▓▓ │
 └───────────┘`;

export const RAM_ICON = `
 ╔═══╦═══╦═══╗
 ║▓▓▓║▓▓▓║▓▓▓║
 ╠═══╬═══╬═══╣
 ║ R ║ A ║ M ║
 ╚═══╩═══╩═══╝`;

export const DISK_ICON = `
 ╭─────────────╮
 │ ◉ ════════ │
 │   ════════ │
 │   STORAGE  │
 ╰─────────────╯`;

export const NETWORK_ICON = `
    ╱╲
   ╱  ╲
  ◯────◯
 ╱ ╲  ╱ ╲
◯   ◯◯   ◯`;

// Box drawing utilities
export const box = {
  topLeft: '╔',
  topRight: '╗',
  bottomLeft: '╚',
  bottomRight: '╝',
  horizontal: '═',
  vertical: '║',
  cross: '╬',
  teeDown: '╦',
  teeUp: '╩',
  teeLeft: '╣',
  teeRight: '╠',
};

export const boxLight = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  cross: '┼',
  teeDown: '┬',
  teeUp: '┴',
  teeLeft: '┤',
  teeRight: '├',
};

export const boxRound = {
  topLeft: '╭',
  topRight: '╮',
  bottomLeft: '╰',
  bottomRight: '╯',
  horizontal: '─',
  vertical: '│',
};

// Progress bar characters
export const progress = {
  full: '█',
  almost: '▓',
  half: '▒',
  light: '░',
  empty: ' ',
  leftCap: '▐',
  rightCap: '▌',
};

// Spinner frames for different styles
export const spinners = {
  cyber: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  matrix: ['▖', '▘', '▝', '▗'],
  pulse: ['◐', '◓', '◑', '◒'],
  neon: ['◜', '◠', '◝', '◞', '◡', '◟'],
  orbital: ['◴', '◷', '◶', '◵'],
  dots: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'],
  bounce: ['⠁', '⠂', '⠄', '⠂'],
  arrows: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
  circuit: ['◰', '◳', '◲', '◱'],
  hexagon: ['⬡', '⬢'],
  blocks: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃', '▂'],
};

// Status icons
export const icons = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
  bullet: '•',
  arrow: '→',
  arrowDouble: '»',
  star: '★',
  lightning: '⚡',
  fire: '🔥',
  rocket: '🚀',
  cpu: '🔲',
  memory: '💾',
  disk: '💿',
  network: '🌐',
  clock: '⏱',
  check: '☑',
  radioOn: '◉',
  radioOff: '○',
  play: '▶',
  pause: '⏸',
  stop: '⏹',
};

// Decorative lines
export const decorators = {
  wave: '～～～～～～～～～～',
  dots: '• • • • • • • • • •',
  arrows: '›››››››››››››››››',
  dashes: '─ ─ ─ ─ ─ ─ ─ ─ ─',
  circuit: '┬┴┬┴┬┴┬┴┬┴┬┴┬┴┬┴',
  binary: '01010101010101010',
  glitch: '▓▒░▓▒░▓▒░▓▒░▓▒░',
};

// Create fancy header
export function createHeader(title: string, width: number = 60): string {
  const padding = Math.max(0, width - title.length - 4);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  
  const top = `${box.topLeft}${box.horizontal.repeat(width)}${box.topRight}`;
  const middle = `${box.vertical} ${' '.repeat(leftPad)}${title}${' '.repeat(rightPad)} ${box.vertical}`;
  const bottom = `${box.bottomLeft}${box.horizontal.repeat(width)}${box.bottomRight}`;
  
  return `${top}\n${middle}\n${bottom}`;
}

// Create separator line
export function separator(width: number = 60, style: 'heavy' | 'light' | 'dots' = 'heavy'): string {
  const chars = {
    heavy: '═',
    light: '─',
    dots: '·',
  };
  return chars[style].repeat(width);
}

// Create styled logo
export function styledLogo(): string {
  const lines = NEXUS_LOGO.split('\n');
  return lines.map((line, i) => {
    return createGradient(line, gradientPresets.cyber);
  }).join('\n');
}

// Create smaller styled logo
export function styledLogoSmall(): string {
  const lines = NEXUS_LOGO_SMALL.split('\n');
  return lines.map((line) => {
    return createGradient(line, gradientPresets.plasma);
  }).join('\n');
}

// Create tagline
export function tagline(): string {
  const text = '⚡ NEXT-GEN SERVER BENCHMARKING SYSTEM ⚡';
  return colors.neonPink(text);
}

// Create version badge
export function versionBadge(version: string): string {
  return `${colors.dimmed('[')}${colors.neonCyan('v' + version)}${colors.dimmed(']')}`;
}

// Matrix rain effect line
export function matrixLine(width: number): string {
  const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789';
  let line = '';
  for (let i = 0; i < width; i++) {
    const char = chars[Math.floor(Math.random() * chars.length)];
    const brightness = Math.random();
    if (brightness > 0.8) {
      line += colors.matrixGreen(char);
    } else if (brightness > 0.4) {
      line += colors.dimmed(char);
    } else {
      line += colors.matrixDark(char);
    }
  }
  return line;
}

