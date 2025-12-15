import chalk from 'chalk';

// Cyberpunk color palette
export const colors = {
  // Neon colors
  neonPink: chalk.hex('#FF2D95'),
  neonBlue: chalk.hex('#00F0FF'),
  neonGreen: chalk.hex('#39FF14'),
  neonPurple: chalk.hex('#BF40BF'),
  neonOrange: chalk.hex('#FF6B35'),
  neonYellow: chalk.hex('#FFFF00'),
  neonCyan: chalk.hex('#00FFFF'),
  
  // Cyberpunk specific
  cyberRed: chalk.hex('#FF003C'),
  cyberBlue: chalk.hex('#0047AB'),
  cyberPink: chalk.hex('#FF10F0'),
  cyberGold: chalk.hex('#FFD700'),
  cyberSilver: chalk.hex('#C0C0C0'),
  
  // Matrix theme
  matrixGreen: chalk.hex('#00FF41'),
  matrixDark: chalk.hex('#003B00'),
  
  // Plasma/Electric
  plasmaBlue: chalk.hex('#7DF9FF'),
  electricBlue: chalk.hex('#125DFF'),
  plasmaPurple: chalk.hex('#8B00FF'),
  
  // UI colors
  dimmed: chalk.hex('#666666'),
  muted: chalk.hex('#888888'),
  subtle: chalk.hex('#AAAAAA'),
  bright: chalk.hex('#FFFFFF'),
  
  // Status colors
  success: chalk.hex('#00FF88'),
  warning: chalk.hex('#FFB800'),
  error: chalk.hex('#FF3366'),
  info: chalk.hex('#00BFFF'),
};

// Gradient presets
export const gradientPresets = {
  cyber: ['#FF2D95', '#00F0FF'],
  matrix: ['#003B00', '#00FF41'],
  fire: ['#FF6B35', '#FFD700', '#FF2D95'],
  ice: ['#00BFFF', '#00FFFF', '#7DF9FF'],
  plasma: ['#8B00FF', '#FF10F0', '#00FFFF'],
  neon: ['#FF2D95', '#BF40BF', '#00F0FF'],
  sunset: ['#FF6B35', '#FF2D95', '#BF40BF'],
  aurora: ['#00FF88', '#00FFFF', '#BF40BF', '#FF2D95'],
};

// Create gradient text effect manually
export function createGradient(text: string, colors: string[]): string {
  const chars = text.split('');
  const colorCount = colors.length;
  
  return chars.map((char, i) => {
    const colorIndex = Math.floor((i / chars.length) * colorCount);
    const color = colors[Math.min(colorIndex, colorCount - 1)];
    return chalk.hex(color)(char);
  }).join('');
}

// Rainbow effect
export function rainbow(text: string): string {
  const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
  return createGradient(text, rainbowColors);
}

// Pulse effect (for animation)
export function pulse(text: string, frame: number, color1: string, color2: string): string {
  const intensity = Math.sin(frame * 0.1) * 0.5 + 0.5;
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  
  const r = Math.round(r1 + (r2 - r1) * intensity);
  const g = Math.round(g1 + (g2 - g1) * intensity);
  const b = Math.round(b1 + (b2 - b1) * intensity);
  
  return chalk.rgb(r, g, b)(text);
}

// Glitch effect
export function glitch(text: string): string {
  const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
  const chars = text.split('');
  
  return chars.map(char => {
    if (Math.random() < 0.1) {
      return colors.cyberRed(glitchChars[Math.floor(Math.random() * glitchChars.length)]);
    }
    return char;
  }).join('');
}

// Format bytes to human readable
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let value = bytes;
  
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  
  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

// Format duration to human readable
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

// Score to color
export function scoreColor(score: number, max: number): chalk.Chalk {
  const ratio = score / max;
  if (ratio >= 0.8) return colors.success;
  if (ratio >= 0.6) return colors.neonGreen;
  if (ratio >= 0.4) return colors.warning;
  if (ratio >= 0.2) return colors.neonOrange;
  return colors.error;
}

