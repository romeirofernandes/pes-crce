# PES Tournament Manager

A production-grade Single Page Application (SPA) for managing eFootball / PES tournaments with support for 1v1 and 2v2 formats.

## Features

- **Dashboard**: Real-time tournament standings with React Flow graph visualization
- **Admin Panel**: Password-protected tournament management
- **1v1 & 2v2 Formats**: Toggle between single and team play
- **Smart Fixtures**: Generate non-repeating match pairings with randomization
- **Automatic Stats**: Derived standings with points, goals, win %, goal difference
- **Persistent Storage**: Single data.json local storage with Zustand state management
- **Dark Theme**: Minimal, legible interface with subtle animated dither background

## Tech Stack

- **React** 18 + React Router 6 (Vite)
- **TailwindCSS 4** - Styling only
- **React Flow** - Tournament visualization
- **React Icons** - Icon library
- **Zustand** - State management
- **Base UI** - Headless primitives

## Getting Started

### Install dependencies
```bash
npm install
```

### Setup environment
```bash
cp .env.example .env.local
# Edit VITE_ADMIN_PASSWORD if needed
```

### Development
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Build
```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── Button.jsx     # Primary button with skeuomorphic depth
│   └── TournamentFlow.jsx  # React Flow visualization
├── pages/            # Route pages
│   ├── Dashboard.jsx  # Public tournament view
│   └── Admin.jsx      # Password-gated admin panel
├── store/            # Zustand state management
│   └── tournamentStore.js
├── utils/            # Helper functions
│   ├── cx.js         # Class merging utility
│   └── stats.js      # Tournament stats calculator
├── App.jsx           # Router setup
├── main.jsx          # Entry point
└── index.css         # Global styles & dither background

public/
└── data.json         # Example tournament data
```

## Usage

### Public Dashboard (`/`)
- View live tournament standings
- See match history with scores
- Visualize completed matches in React Flow graph
- View upcoming fixtures

### Admin Panel (`/admin`)
**Password**: `admin123` (set via `VITE_ADMIN_PASSWORD`)

**Capabilities**:
- ➕ Add/remove players
- 🔄 Toggle format (1v1 ↔ 2v2)
- 👥 Auto-generate or manually pair teams (2v2 only)
- 🎲 Generate randomized, non-repeating fixtures
- ⚽ Enter match results with auto-recompute standings
- 🔄 Reset tournament to defaults

## Data Persistence

All tournament data is stored in `localStorage` under the key `tournament-data`. The state is automatically persisted after every mutation.

**Default data structure**:
```json
{
  "players": [...],
  "format": "1v1",
  "teams": [],
  "matches": [...],
  "fixtures": [...]
}
```

## Configuration

### Admin Password
Set in `.env.local`:
```
VITE_ADMIN_PASSWORD=your_secure_password
```

### Styling
- **Font Stack**: Plus Jakarta Sans (primary) + Space Grotesk (headings)
- **Colors**: Dark mode only (zinc-950 background)
- **Motion**: Subtle, functional animations only
- **Dither**: Animated SVG background pattern

## Tournament Logic

### Fair Randomization
- Prevents repeat matchups until all pairings exhausted
- Graceful handling of odd player counts
- Deterministic regeneration when data resets

### Standings Calculation
- **Points**: Win=3, Draw=1, Loss=0
- **Sorting**: Points → Goal Difference → Goals For
- **Stats**: Played, Wins, Draws, Losses, GF, GA, GD

### 2v2 Support
- Random team generation or manual pairing
- Team-level statistics with member tracking
- Individual performance within team context

## Performance

- Lightweight bundle (React + router + Zustand + React Flow only)
- No unnecessary re-renders via Zustand selectors
- React Flow optimized for small player counts (<50)
- LocalStorage for instant persistence

## Browser Support

Modern browsers with ES2020+ support. Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT
