# ALNRetool

A modern web-based visualization and editing tool for "About Last Night," a murder mystery game for 20-40 players. This tool provides interactive graph visualization and real-time editing capabilities for game content stored in Notion databases.

## 🚀 Current Status

- **Version**: Sprint 2 (Complete) - Moving to Sprint 3
- **Production Ready**: ❌ Not yet (targeting Sprint 4)
- **Core Features**: ✅ Fully Working
- **Graph Visualization**: ✅ Complete with React Flow
- **Two-way Notion Sync**: ✅ Fully Implemented
- **Filtering System**: ✅ Advanced multi-dimensional filters
- **Character Journey**: 🚧 In Progress (Sprint 3)

## ✨ Features

### Implemented ✅
- **Interactive Graph Visualization**: React Flow-based graph with custom node types
- **Multi-view System**: 
  - Content Status View (default)
  - Puzzle Focus View 
  - Character Journey View
  - Node Connections View
- **Real-time Notion Integration**: Two-way sync with Notion databases
- **Detail Panel**: Interactive editing with optimistic updates and field validation
- **Advanced Filtering System**:
  - Character-based filtering with story/faction/tier support
  - Puzzle filtering by chains, complexity, and tier
  - Content filters for narrative threads and clue types
  - Graph depth control for connection visualization
  - Active filters summary display
- **Smart Layout Engine**: Pure Dagre layout with semantic edge positioning
- **Visual Enhancements**: Glassmorphism effects, smooth animations, skeleton loading
- **Performance Optimizations**: Request batching, 5-minute cache TTL, React Query
- **Sidebar Navigation**: Collapsible sidebar with search and filters
- **Error Boundaries**: Comprehensive error handling and recovery
- **Zustand State Management**: For filters and UI state

### In Development 🚧
- Character journey timeline enhancements
- Additional mutation operations for batch updates
- Production deployment configuration
- Performance monitoring and analytics

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **React Flow** (@xyflow/react) for graph visualization
- **TanStack Query v5** for server state management
- **Tailwind CSS v4** with PostCSS
- **shadcn/ui** component library
- **Zustand** for client state management
- **Dagre** for graph layout algorithms
- **Framer Motion** for animations
- **Lucide React** for icons

### Backend
- **Express.js v5** API server
- **Notion SDK v4** for database integration
- **node-cache** for response caching (5-minute TTL)
- **Rate limiting** with express-rate-limit
- **TypeScript** with CommonJS output
- **Bottleneck** for API request throttling

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Notion API key and database IDs

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ALNRetool.git
cd ALNRetool
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Notion credentials:
```env
# Notion Configuration (Required)
NOTION_API_KEY=your_notion_integration_token
NOTION_CHARACTERS_DB=18c2f33d-583f-8060-a6ab-de32ff06bca2
NOTION_ELEMENTS_DB=18c2f33d-583f-8020-91bc-d84c7dd94306
NOTION_PUZZLES_DB=1b62f33d-583f-80cc-87cf-d7d6c4b0b265
NOTION_TIMELINE_DB=1b52f33d-583f-80de-ae5a-d20020c120dd

# Server Configuration (Optional)
PORT=3001
NODE_ENV=development
API_KEY=your_optional_api_key
```

## 🚀 Development

### Start Development Server
```bash
npm run dev
```
This starts:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Available Scripts

#### Development
```bash
npm run dev              # Start both frontend and backend
npm run dev:client       # Frontend only (Vite)
npm run dev:server       # Backend only (Express)
```

#### Testing
```bash
npm test                 # Run tests in watch mode
npm run test:run         # Run all tests once
npm run test:ui          # Open Vitest UI
npm run test:coverage    # Generate coverage report
npm run test:integration # Integration tests (requires .env)
npm run test:smoke       # Quick smoke test
```

#### Build & Production
```bash
npm run build            # Build for production
npm start                # Start production server
npm run preview          # Preview production build
```

#### Code Quality
```bash
npm run lint             # Run ESLint
npm run typecheck        # TypeScript validation
```

## 📁 Project Structure

```
ALNRetool/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   │   ├── graph/         # Graph visualization components
│   │   │   ├── nodes/     # Custom node types (Puzzle, Character, Element, Timeline)
│   │   │   └── edges/     # Custom edge types
│   │   ├── detail-panel/  # Entity detail panels
│   │   │   └── field-editors/ # Field-specific editors
│   │   ├── sidebar/       # Sidebar navigation and filters
│   │   ├── layout/        # Layout components
│   │   └── ui/            # shadcn/ui components
│   ├── hooks/             # Custom React hooks
│   │   ├── generic/       # Reusable hook patterns
│   │   ├── mutations/     # Mutation hooks
│   │   └── detail-panel/  # Detail panel specific
│   ├── lib/               # Core libraries
│   │   ├── graph/         # Graph transformation system
│   │   │   ├── modules/   # Modular transformers
│   │   │   │   └── transformers/ # Entity-specific transformers
│   │   │   └── layout/    # Layout algorithms (Dagre, Force)
│   │   ├── filters/       # Filter system
│   │   └── utils/         # Utility functions
│   ├── stores/            # Zustand state stores
│   ├── services/          # API and data services
│   ├── types/             # TypeScript type definitions
│   │   ├── notion/        # Notion-specific types
│   │   └── api/           # API response types
│   └── views/             # Page-level components
├── server/                # Backend source code
│   ├── middleware/        # Express middleware
│   ├── routes/            # API route handlers
│   │   └── notion/        # Notion-specific routes
│   ├── services/          # Business logic
│   └── utils/             # Server utilities
├── scripts/               # Debug and test scripts
├── docs/                  # Documentation
└── tests/                 # Test configuration
```

## 🔌 API Endpoints

### Entity Endpoints
- `GET /api/notion/characters` - Fetch all characters
- `GET /api/notion/characters/:id` - Fetch single character
- `PUT /api/notion/characters/:id` - Update character
- `GET /api/notion/elements` - Fetch all story elements
- `GET /api/notion/elements/:id` - Fetch single element
- `PUT /api/notion/elements/:id` - Update element
- `GET /api/notion/puzzles` - Fetch all puzzles
- `GET /api/notion/puzzles/:id` - Fetch single puzzle
- `PUT /api/notion/puzzles/:id` - Update puzzle
- `GET /api/notion/timeline` - Fetch timeline events

### Specialized Endpoints
- `GET /api/notion/synthesized` - Get all entities with bidirectional relationships
- `GET /api/cache/stats` - Cache statistics
- `POST /api/cache/clear` - Clear cache
- `POST /api/cache/warm` - Warm cache

### Health Checks
- `GET /api/health` - API health check
- `GET /healthz` - Production health check

## 🧪 Testing

The project uses Vitest for testing with the following configuration:
- **Unit Tests**: Component and hook testing with React Testing Library
- **Integration Tests**: API endpoint testing with real Notion integration
- **Coverage Thresholds**: 80% for branches, functions, lines, statements

Run tests:
```bash
npm test                 # Watch mode
npm run test:run         # Single run
npm run test:coverage    # With coverage
```

## 🚢 Deployment

### Environment Variables (Production)
Set these in your deployment platform:
- `NOTION_API_KEY` - Your Notion integration token
- `NOTION_CHARACTERS_DB` - Characters database ID
- `NOTION_ELEMENTS_DB` - Elements database ID  
- `NOTION_PUZZLES_DB` - Puzzles database ID
- `NOTION_TIMELINE_DB` - Timeline database ID
- `NODE_ENV=production` - Production mode
- `API_KEY` - Optional API key for additional security

### Build for Production
```bash
npm run build
npm start
```

### Deployment Platforms
The app is configured for deployment on:
- **Render**: Use `render.yaml` configuration
- **Vercel**: Frontend deployment ready
- **Railway/Heroku**: Node.js deployment ready

## 📚 Documentation

- [Project Status](docs/PROJECT_STATUS.md) - Sprint progress and roadmap
- [API Documentation](docs/API.md) - Detailed API reference
- [Architecture](docs/ARCHITECTURE.md) - System design and data flow
- [Graph Architecture](docs/GRAPH_ARCHITECTURE.md) - Graph system details
- [Developer Handbook](docs/DEVELOPER_HANDBOOK.md) - Development guidelines
- [Testing Strategy](docs/TESTING_STRATEGY.md) - Testing approach

## 🤝 Contributing

1. Check [PROJECT_STATUS.md](docs/PROJECT_STATUS.md) for current sprint goals
2. Review [DEVELOPER_HANDBOOK.md](docs/DEVELOPER_HANDBOOK.md) for coding standards
3. Create feature branch from `main`
4. Write tests for new features
5. Ensure all tests pass and coverage thresholds are met
6. Submit PR with clear description

## 📄 License

Private project - All rights reserved

## 🙏 Acknowledgments

- Built with React Flow for graph visualization
- Powered by Notion API for content management
- UI components from shadcn/ui
- Layout algorithms from Dagre