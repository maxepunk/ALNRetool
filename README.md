# ALNRetool

A modern web-based visualization and editing tool for "About Last Night," a murder mystery game for 20-40 players. This tool provides interactive graph visualization and real-time editing capabilities for game content stored in Notion databases.

## 🚀 Current Status

## ✨ Features

### Implemented ✅

### In Development 🚧


## 🛠️ Tech Stack

### Frontend

### Backend


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