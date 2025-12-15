import { colors, createGradient, gradientPresets } from '../utils/colors.js';
import { spinners, progress } from '../utils/ascii.js';

// Animated text effects
export class TextAnimator {
  private frame: number = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start(fps: number = 15): void {
    this.intervalId = setInterval(() => {
      this.frame++;
    }, 1000 / fps);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getFrame(): number {
    return this.frame;
  }

  // Typing effect
  typeText(text: string, speed: number = 50): Promise<void> {
    return new Promise((resolve) => {
      let i = 0;
      const interval = setInterval(() => {
        process.stdout.write(text[i]);
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          resolve();
        }
      }, speed);
    });
  }

  // Glitch text effect
  glitchText(text: string): string {
    const glitchChars = '!@#$%^&*<>[]{}|░▒▓';
    const glitchProbability = 0.1 + Math.sin(this.frame * 0.3) * 0.05;
    
    return text.split('').map(char => {
      if (Math.random() < glitchProbability && char !== ' ') {
        const glitchChar = glitchChars[Math.floor(Math.random() * glitchChars.length)];
        return colors.cyberRed(glitchChar);
      }
      return char;
    }).join('');
  }

  // Wave text effect
  waveText(text: string, amplitude: number = 3): string {
    const lines: string[] = Array(amplitude * 2 + 1).fill('');
    
    text.split('').forEach((char, i) => {
      const offset = Math.round(Math.sin((i + this.frame) * 0.3) * amplitude);
      for (let y = 0; y < lines.length; y++) {
        if (y === amplitude + offset) {
          lines[y] += char;
        } else {
          lines[y] += ' ';
        }
      }
    });
    
    return lines.join('\n');
  }

  // Pulse color effect
  pulseColor(text: string, color1: string = '#FF2D95', color2: string = '#00F0FF'): string {
    const intensity = (Math.sin(this.frame * 0.15) + 1) / 2;
    
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * intensity);
    const g = Math.round(g1 + (g2 - g1) * intensity);
    const b = Math.round(b1 + (b2 - b1) * intensity);
    
    return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
  }

  // Scanning line effect
  scanningLine(width: number): string {
    const pos = this.frame % (width * 2);
    const actualPos = pos < width ? pos : width * 2 - pos;
    
    return ' '.repeat(actualPos) + colors.neonCyan('█') + ' '.repeat(width - actualPos - 1);
  }

  // Spinner
  spinner(style: keyof typeof spinners = 'cyber'): string {
    const frames = spinners[style];
    return colors.neonCyan(frames[this.frame % frames.length]);
  }
}

// Progress animation class
export class ProgressAnimator {
  private current: number = 0;
  private target: number = 0;
  private speed: number = 0.1;

  setTarget(value: number): void {
    this.target = value;
  }

  setCurrent(value: number): void {
    this.current = value;
  }

  update(): number {
    this.current += (this.target - this.current) * this.speed;
    return this.current;
  }

  render(width: number = 40): string {
    const filled = Math.round((this.current / 100) * width);
    const empty = width - filled;
    
    let bar = '';
    for (let i = 0; i < filled; i++) {
      const t = i / width;
      bar += createGradient(progress.full, gradientPresets.cyber.slice(0, 2));
    }
    bar += colors.dimmed(progress.light.repeat(empty));
    
    const pct = this.current.toFixed(1);
    return `${colors.dimmed('▐')}${bar}${colors.dimmed('▌')} ${colors.neonCyan(pct + '%')}`;
  }
}

// Loading animation
export async function showLoadingAnimation(
  message: string,
  duration: number,
  callback?: () => Promise<void>
): Promise<void> {
  const frames = spinners.cyber;
  let frame = 0;
  let completed = false;
  
  const animate = setInterval(() => {
    const spinner = colors.neonCyan(frames[frame % frames.length]);
    const text = colors.muted(message);
    process.stdout.write(`\r${spinner} ${text}`);
    frame++;
  }, 80);
  
  if (callback) {
    await callback();
    completed = true;
  } else {
    await new Promise(resolve => setTimeout(resolve, duration));
    completed = true;
  }
  
  clearInterval(animate);
  
  if (completed) {
    process.stdout.write(`\r${colors.success('✓')} ${colors.muted(message)}\n`);
  }
}

// Countdown animation
export async function countdown(seconds: number): Promise<void> {
  for (let i = seconds; i > 0; i--) {
    const bigNum = createBigNumber(i);
    console.clear();
    console.log(createGradient(bigNum, gradientPresets.fire));
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.clear();
}

// Create big ASCII numbers
function createBigNumber(n: number): string {
  const digits: Record<number, string[]> = {
    0: ['╔═══╗', '║   ║', '║   ║', '║   ║', '╚═══╝'],
    1: ['  ╦  ', '  ║  ', '  ║  ', '  ║  ', '  ╩  '],
    2: ['╔═══╗', '    ║', '╔═══╝', '║    ', '╚═══╝'],
    3: ['╔═══╗', '    ║', ' ═══╣', '    ║', '╚═══╝'],
    4: ['╦   ╦', '║   ║', '╚═══╣', '    ║', '    ╩'],
    5: ['╔═══╗', '║    ', '╚═══╗', '    ║', '╚═══╝'],
    6: ['╔═══╗', '║    ', '╠═══╗', '║   ║', '╚═══╝'],
    7: ['╔═══╗', '    ║', '    ║', '    ║', '    ╩'],
    8: ['╔═══╗', '║   ║', '╠═══╣', '║   ║', '╚═══╝'],
    9: ['╔═══╗', '║   ║', '╚═══╣', '    ║', '╚═══╝'],
  };
  
  return digits[n]?.join('\n') || '';
}

// Matrix rain animation
export function createMatrixRain(width: number, height: number, frame: number): string {
  const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789ABCDEF';
  const drops: number[] = [];
  
  // Initialize drops
  for (let i = 0; i < width; i++) {
    drops[i] = Math.floor(Math.random() * height);
  }
  
  let result = '';
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dropY = (drops[x] + frame) % height;
      const distance = (y - dropY + height) % height;
      
      const char = chars[Math.floor(Math.random() * chars.length)];
      
      if (distance === 0) {
        result += colors.bright(char);
      } else if (distance < 3) {
        result += colors.matrixGreen(char);
      } else if (distance < 8) {
        result += colors.dimmed(char);
      } else {
        result += ' ';
      }
    }
    result += '\n';
  }
  
  return result;
}

// Cyber scan effect
export async function cyberScan(lines: string[], delay: number = 50): Promise<void> {
  for (const line of lines) {
    let revealed = '';
    for (let i = 0; i < line.length; i++) {
      // Show scan effect
      process.stdout.write(`\r${revealed}${colors.neonCyan('▓')}${colors.dimmed('░'.repeat(line.length - i - 1))}`);
      await new Promise(resolve => setTimeout(resolve, delay / 2));
      
      revealed += line[i];
    }
    console.log(`\r${line}`);
  }
}

// Boot sequence animation
export async function bootSequence(): Promise<void> {
  const bootMessages = [
    { msg: 'Initializing NEXUS BENCH v1.0.0...', delay: 200 },
    { msg: 'Loading kernel modules...', delay: 150 },
    { msg: 'Calibrating sensors...', delay: 100 },
    { msg: 'Establishing secure connection...', delay: 180 },
    { msg: 'Initializing benchmark protocols...', delay: 120 },
    { msg: 'System ready.', delay: 100 },
  ];

  for (const { msg, delay } of bootMessages) {
    await showLoadingAnimation(msg, delay);
  }
}

// Glitch screen effect
export function glitchScreen(content: string): string {
  const lines = content.split('\n');
  const glitched: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Random horizontal offset
    if (Math.random() < 0.1) {
      const offset = Math.floor(Math.random() * 10) - 5;
      if (offset > 0) {
        line = ' '.repeat(offset) + line;
      } else {
        line = line.slice(-offset);
      }
    }
    
    // Random color corruption
    if (Math.random() < 0.05) {
      line = colors.cyberRed(line);
    } else if (Math.random() < 0.05) {
      line = colors.neonCyan(line);
    }
    
    glitched.push(line);
  }
  
  return glitched.join('\n');
}

