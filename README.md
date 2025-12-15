# ⚡ NEXUS BENCH

```
███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗    ██████╗ ███████╗███╗   ██╗ ██████╗██╗  ██╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝    ██╔══██╗██╔════╝████╗  ██║██╔════╝██║  ██║
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗    ██████╔╝█████╗  ██╔██╗ ██║██║     ███████║
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║    ██╔══██╗██╔══╝  ██║╚██╗██║██║     ██╔══██║
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║    ██████╔╝███████╗██║ ╚████║╚██████╗██║  ██║
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝    ╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝╚═╝  ╚═╝
```

> 🔥 **Next-Generation Server Benchmarking CLI** — More cyberpunk than Night City itself

A stunning, futuristic CLI tool for comprehensive web server benchmarking with real-time visualizations, neon-styled output, and Matrix-inspired aesthetics.

## ✨ Features

- **🔲 CPU Benchmark** — Prime calculation, matrix multiplication, fibonacci, sorting, hash computation, and floating-point tests
- **💾 Memory Benchmark** — Sequential/random access, memory copy, allocation stress, bandwidth, and latency tests  
- **💿 Storage Benchmark** — Sequential/random read/write, mixed I/O, and latency measurements
- **🌐 Network Benchmark** — DNS resolution, connection timing, latency, throughput, and bandwidth estimation
- **📊 Live Monitor** — Real-time system metrics dashboard with sparklines and animated UI
- **🎨 Cyberpunk Aesthetics** — Neon gradients, Matrix rain, glitch effects, and animated spinners

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Run the full benchmark suite
bun run dev

# Or use the CLI directly
bun run src/index.ts
```

## 📖 Commands

| Command | Description |
|---------|-------------|
| `nexus` | Run complete benchmark suite |
| `nexus cpu` | CPU benchmark only |
| `nexus memory` | Memory benchmark only |
| `nexus storage` | Storage I/O benchmark |
| `nexus network [url]` | Network performance test |
| `nexus stress cpu` | CPU stress test |
| `nexus stress memory` | Memory stress test |
| `nexus monitor` | Live system monitoring |
| `nexus info` | Display system information |

## ⚙️ Options

```bash
# CPU benchmark with extreme intensity
nexus cpu --intensity extreme

# Network benchmark with custom settings
nexus network https://api.example.com --requests 100 --concurrent 20

# Export results to JSON
nexus --output results.json

# Run without animations (quiet mode)
nexus --quiet
```

## 🎮 Usage Examples

### Full Benchmark Suite
```bash
bun run src/index.ts
```

### CPU Stress Test (60 seconds)
```bash
bun run src/index.ts stress cpu --duration 60
```

### Network Benchmark (Custom Target)
```bash
bun run src/index.ts network https://your-server.com/api --requests 200
```

### Live System Monitor
```bash
bun run src/index.ts monitor
```

### Export Results
```bash
bun run src/index.ts --output benchmark-results.json
```

## 📊 Benchmark Scoring

| Grade | Score Range | Description |
|-------|-------------|-------------|
| **S+** | 90-100 | Exceptional performance |
| **A** | 80-89 | Excellent |
| **B** | 70-79 | Good |
| **C** | 60-69 | Average |
| **D** | 50-59 | Below average |
| **F** | 0-49 | Poor |

## 🎨 UI Features

- **Neon Gradients** — Smooth color transitions across text and progress bars
- **Animated Spinners** — Multiple spinner styles (cyber, matrix, pulse, orbital)
- **Progress Bars** — Gradient-filled progress indicators with percentages
- **Box Drawing** — Beautiful ASCII box components for data display
- **Sparklines** — Compact inline charts for historical data
- **Matrix Rain** — Authentic Matrix-style character rain effects
- **Glitch Effects** — Random glitch animations for cyberpunk feel

## 🛠️ Tech Stack

- **Runtime**: [Bun](https://bun.sh) — Ultra-fast JavaScript runtime
- **Language**: TypeScript — Full type safety
- **CLI Framework**: Commander.js — Robust command-line interface
- **Styling**: Chalk — Terminal string styling
- **System Info**: systeminformation — Hardware and OS details

## 📁 Project Structure

```
src/
├── index.ts              # Main CLI entry point
├── types/
│   └── index.ts          # TypeScript type definitions
├── utils/
│   ├── colors.ts         # Color utilities and gradients
│   └── ascii.ts          # ASCII art and decorators
├── ui/
│   ├── components.ts     # UI components (boxes, bars, tables)
│   ├── animations.ts     # Animation utilities
│   └── dashboard.ts      # Dashboard views and live monitor
└── benchmarks/
    ├── cpu.ts            # CPU benchmark tests
    ├── memory.ts         # Memory benchmark tests
    ├── storage.ts        # Storage I/O tests
    └── network.ts        # Network performance tests
```

## 📝 License

MIT

---

<p align="center">
  <strong>⚡ Built with Bun • Powered by TypeScript • Styled like Cyberpunk ⚡</strong>
</p>
