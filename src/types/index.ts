export interface BenchmarkResult {
  name: string;
  score: number;
  unit: string;
  duration: number;
  details: Record<string, string | number>;
  status: 'passed' | 'warning' | 'failed';
  timestamp: Date;
}

export interface SystemInfo {
  cpu: {
    manufacturer: string;
    brand: string;
    cores: number;
    physicalCores: number;
    speed: number;
    speedMax: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    active: number;
  };
  disk: {
    size: number;
    used: number;
    available: number;
    type: string;
  };
  network: {
    interface: string;
    ip4: string;
    speed: number;
  };
  os: {
    platform: string;
    distro: string;
    release: string;
    kernel: string;
    arch: string;
  };
}

export interface BenchmarkConfig {
  duration: number;
  iterations: number;
  warmup: number;
  target?: string;
  concurrent?: number;
}

export interface ProgressCallback {
  (progress: number, message: string, phase: string): void;
}

export interface NetworkBenchmarkOptions {
  target: string;
  requests: number;
  concurrent: number;
  timeout: number;
}

export interface CPUBenchmarkOptions {
  duration: number;
  threads: number;
  intensity: 'low' | 'medium' | 'high' | 'extreme';
}

export interface MemoryBenchmarkOptions {
  blockSize: number;
  iterations: number;
  pattern: 'sequential' | 'random';
}

export interface StorageBenchmarkOptions {
  fileSize: number;
  blockSize: number;
  iterations: number;
}

export type ThemeColor = 
  | 'neon_pink'
  | 'cyber_blue'
  | 'matrix_green'
  | 'plasma_purple'
  | 'fire_orange'
  | 'ice_cyan';

export interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  muted: string;
  background: string;
}

