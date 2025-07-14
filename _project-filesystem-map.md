# ALNRetool Project Filesystem Map

## Root Directory Structure
```
ALNRetool/
├── CLAUDE.md                      # Project-specific Claude instructions
├── alnretool-action-plan.md       # 8-week development timeline
├── alnretool-prd.md              # Product requirements document
├── dist/                         # Build output (gitignored)
├── docs/                         # Project documentation
│   ├── API.md                    # API reference documentation
│   ├── DEVELOPER_GUIDE.md        # Developer onboarding guide
│   └── PROJECT_STATUS.md         # Sprint progress dashboard
├── eslint.config.js              # ESLint configuration
├── index.html                    # Vite HTML template
├── node_modules/                 # Dependencies (gitignored)
├── package-lock.json             # Dependency lockfile
├── package.json                  # Project configuration and scripts
├── public/                       # Static assets
│   └── vite.svg                  # Vite logo
├── scripts/                      # Testing and utility scripts
│   ├── integration-test.ts       # Full Notion API integration tests
│   └── smoke-test.ts             # Quick API health checks
├── server/                       # Express backend
│   ├── index.ts                  # Server entry point
│   ├── middleware/               # Express middleware
│   │   ├── auth.ts               # API key authentication
│   │   ├── errorHandler.ts       # Global error handling
│   │   └── validation.ts         # Request validation
│   ├── routes/                   # API routes
│   │   └── notion.ts             # Notion proxy endpoints
│   ├── services/                 # Business logic
│   │   └── notion.ts             # Notion client wrapper
│   └── utils/                    # Server utilities
│       └── asyncHandler.ts       # Async route error handling
├── src/                          # React frontend
│   ├── App.css                   # Main app styles
│   ├── App.tsx                   # Root React component
│   ├── assets/                   # Frontend assets
│   │   └── react.svg             # React logo
│   ├── index.css                 # Global styles
│   ├── main.tsx                  # React entry point
│   ├── types/                    # TypeScript type definitions
│   │   ├── api/                  # API-related types
│   │   ├── notion/               # Notion data types
│   │   │   ├── app.ts            # Clean app types
│   │   │   ├── raw.ts            # Raw Notion API types
│   │   │   └── transforms.ts     # Data transformation functions
│   │   └── shared/               # Shared type definitions
│   └── vite-env.d.ts             # Vite type definitions
├── tsconfig.app.json             # Frontend TypeScript config
├── tsconfig.json                 # Root TypeScript config
├── tsconfig.node.json            # Node.js TypeScript config
├── tsconfig.server.json          # Backend TypeScript config
└── vite.config.ts                # Vite build configuration
```

## Git Configuration
- `.git/hooks/pre-commit` - Pre-commit validation hooks (ESLint, TypeScript, zen:precommit)
- `.gitignore` - Standard Node.js + build artifacts ignore patterns

## Environment Configuration
- `.env.example` - Template for environment variables
- `.env` - Local environment (gitignored)

## Key File Counts
- TypeScript files: ~15 (src/ + server/ + scripts/)
- Documentation files: 5 (.md files in docs/ + root)
- Configuration files: 6 (tsconfig.*, eslint, vite, package.json)
- Test files: 2 (smoke-test.ts, integration-test.ts)

## Architecture Summary
- **Dual Server Setup**: Vite dev server (5173) + Express API proxy (3001)
- **Type System**: 3-file approach (raw, app, transforms)
- **Testing**: Smoke tests (mock) + Integration tests (real Notion)
- **Documentation**: Comprehensive from Day 1 for team handoffs