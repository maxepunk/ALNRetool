# ALNRetool

**ALNRetool** is a visualization and editing tool for "About Last Night," a 20-40 player murder mystery game. It enables puzzle and narrative designers to visualize and edit game content stored in Notion databases through interactive graph interfaces.

## 🎯 Core Features

- **Interactive Graph Visualizations**: Understand complex relationships between characters, puzzles, and story elements
- **Direct Notion Integration**: Fetches data directly from your game's Notion databases via a secure API proxy
- **Three Core Views**:
  1. **Puzzle Focus View**: Visualize puzzle dependencies and reward paths
  2. **Character Journey View**: Track character-specific content and access paths
  3. **Content Status View**: Monitor the production status of all game elements
- **Real-time Caching**: 5-minute cache reduces Notion API calls by 70-80%
- **Robust Security**: API key authentication, CORS protection, and rate limiting

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TanStack Query, React Flow
- **Backend**: Express.js, TypeScript, Notion API SDK
- **Graph Visualization**: React Flow with Pure Dagre layout engine (modular architecture)
- **Testing**: Vitest (500+ tests), Mock Service Worker, Testing Library
- **Styling**: Tailwind CSS v4, shadcn/ui components, glassmorphism effects
- **Development**: ESLint, Prettier, Commitizen, GitHub Actions CI/CD

## 🚀 Quick Start

### Prerequisites

- Node.js v18+ and npm
- Git
- Notion API key and database IDs (request from team lead)

### Installation

```bash
# Clone the repository
git clone https://github.com/maxepunk/ALNRetool.git
cd ALNRetool

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Notion credentials
```

### Environment Variables

Edit `.env` with the following required values:

```env
# Notion API Configuration (get from team lead)
NOTION_API_KEY="your-notion-integration-token"
NOTION_CHARACTERS_DB="18c2f33d-583f-8060-a6ab-de32ff06bca2"
NOTION_ELEMENTS_DB="18c2f33d-583f-8020-91bc-d84c7dd94306"
NOTION_PUZZLES_DB="1b62f33d-583f-80cc-87cf-d7d6c4b0b265"
NOTION_TIMELINE_DB="1b52f33d-583f-80de-ae5a-d20020c120dd"

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Development

```bash
# Start both frontend and backend
npm run dev

# Frontend only (Vite on port 5173)
npm run dev:client

# Backend only (Express on port 3001)
npm run dev:server
```

Visit http://localhost:5173 to see the application.

## 📁 Project Structure

```
ALNRetool/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API client services
│   ├── lib/graph/         # Graph transformation logic
│   └── types/             # TypeScript type definitions
├── server/                # Backend Express server
│   ├── routes/            # API route handlers
│   ├── services/          # Notion API integration
│   └── middleware/        # Auth, validation, error handling
├── docs/                  # Additional documentation
└── scripts/               # Utility and testing scripts
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Unit tests only (500+ tests)
npm run test:run

# Integration tests (requires .env)
npm run test:integration

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 🚢 Deployment

The application is deployed on [Render.com](https://render.com). See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📚 Documentation

### Planning Documents
- [Product Requirements](./alnretool-prd.md) - Complete product vision and feature specifications
- [Development Roadmap](./alnretool-action-plan.md) - 8-week sprint plan and timeline

### Technical Documentation
- [Developer Handbook](./docs/DEVELOPER_HANDBOOK.md) - Architecture decisions and development patterns
- [API Documentation](./docs/API.md) - Backend API endpoints reference
- [Testing Strategy](./docs/TESTING_STRATEGY.md) - Testing approach and coverage
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [Project Status](./docs/PROJECT_STATUS.md) - Current sprint progress and metrics

## 🤝 Contributing

This project uses conventional commits with Commitizen. To make a commit:

```bash
npx cz
```

Pre-commit hooks automatically run:
- ESLint for code quality
- TypeScript type checking
- Located in `.git/hooks/pre-commit`

## 📊 Current Status

**Sprint 1: Foundation (Complete)**
- ✅ Development environment setup
- ✅ Notion API integration with all 4 databases
- ✅ React Query data layer implementation
- ✅ Server-side caching with cache management
- ✅ Comprehensive test coverage (99% passing)
- ✅ Production deployment on Render

**Sprint 2: Interactive Graph Views (In Progress - Week 3)**
- ✅ React Flow graph visualization with modular architecture
- ✅ Interactive puzzle dependency network with pure Dagre layout
- ✅ Visual component enhancements (glassmorphism, animations)
- ✅ Diamond puzzle nodes with sophisticated styling
- ✅ Owner badges and element flow indicators
- ✅ Edge rendering fixed with BaseEdge integration
- 🔄 Details panel and mutation support pending

## 📄 License

Private repository - All rights reserved

## 👥 Team

- Game Design: About Last Night team
- Development: ALNRetool contributors

---

For AI assistant instructions, see [CLAUDE.md](./CLAUDE.md)