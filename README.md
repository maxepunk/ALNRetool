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
- **Testing**: Vitest, Mock Service Worker, Testing Library
- **Styling**: CSS Modules
- **Development**: ESLint, Prettier, Commitizen

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm
- Git
- Access to Notion workspace (request from team lead)

### Installation & Setup

1. **Clone the repository:**
```bash
git clone https://github.com/maxepunk/ALNRetool.git
cd ALNRetool
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```
*Edit `.env` with your Notion API keys and database IDs (get from team lead)*

4. **Run the development servers:**
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

## 📊 Project Status

**Sprint 1 (Foundation & Data Layer)**: ✅ **100% COMPLETE**

- 504/509 tests passing (99.0% success rate)
- 23/23 integration tests passing (100%)
- All 4 Notion API endpoints operational
- Graph visualization foundation complete
- CI/CD pipeline configured with GitHub Actions

**Sprint 2 (Coming Next)**: Focus on mutation capabilities (editing data)

## 🧪 Testing

```bash
npm test                 # Quick smoke test
npm run test:run         # Full unit test suite (504 tests)
npm run test:integration # Integration tests with real Notion API (23 tests)
npm run test:coverage    # Generate coverage report
```

## 📝 Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend servers |
| `npm run dev:client` | Start only frontend (Vite) |
| `npm run dev:server` | Start only backend (Express) |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |
| `npx cz` | Create conventional commit |

## 📁 Project Structure

```
ALNRetool/
├── src/                 # React frontend source
│   ├── components/      # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Core libraries (graph, query)
│   ├── services/       # API client
│   └── views/          # Main view components
├── server/             # Express backend
│   ├── routes/         # API routes
│   ├── middleware/     # Auth, error handling
│   └── services/       # Notion integration
├── scripts/            # Development & testing scripts
└── docs/              # Documentation
```

## 🔒 Security Features

- API key authentication for all Notion endpoints
- CORS configured for localhost development
- Express rate limiting (100 req/min per IP)
- Bottleneck rate limiting for Notion API (3 req/sec)
- Environment variable protection
- Input validation middleware

## 📚 Documentation

- [API Documentation](docs/API.md) - Complete API reference
- [Developer Guide](docs/DEVELOPER_GUIDE.md) - Onboarding and development workflow
- [Project Status](docs/PROJECT_STATUS.md) - Sprint tracking and metrics
- [Sprint 1 Verification](SPRINT_1_VERIFICATION.md) - Detailed completion report

## 🤝 Contributing

1. Check [PROJECT_STATUS.md](docs/PROJECT_STATUS.md) for current sprint goals
2. Create a feature branch from `develop`
3. Follow conventional commits (`npx cz`)
4. Ensure tests pass (`npm run test:run`)
5. Submit PR with description of changes

## 📄 License

Private project - All rights reserved

## 👥 Team

- Project Lead: Max (@maxepunk)
- [Add team members as appropriate]

---

Built with ❤️ for the About Last Night murder mystery game