    "gsuite": {
      "type": "stdio",
      "command": "uv",
      "args": ["--directory", "/home/spide/projects/GitHub/mcp-gsuite", "run", "mcp-gsuite"]
    },
    "duckduckgo": {
      "type": "stdio", 
      "command": "npx",
      "args": ["-y", "@oevortex/ddg_search"]
    },
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN:-}"
      }
    },
    "desktop-commander": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@wonderwhy-er/desktop-commander"]
    },