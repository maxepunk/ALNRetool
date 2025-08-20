# API Documentation

Complete API reference for ALNRetool backend services.

## Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://your-domain.com/api`

## Authentication

All API endpoints (except health checks) require API key authentication:

```http
X-API-Key: your-api-key-here
```

Set the `API_KEY` environment variable to enable authentication. If not set, authentication is bypassed in development mode.

## Rate Limiting

- **Limit**: 100 requests per minute per IP
- **Window**: 1 minute sliding window
- **Headers**: Standard rate limit headers included in responses

## Response Format

All successful responses follow this structure:

```typescript
interface APIResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

Error responses:

```typescript
interface ErrorResponse {
  error: string;
  details?: any;
  stack?: string; // Only in development
}
```

## Endpoints

### Health Checks

#### GET /api/health
Check API server health status.

**Authentication**: Not required

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-20T12:00:00.000Z"
}
```

#### GET /healthz
Production health check endpoint (for Render/monitoring).

**Authentication**: Not required

**Response**: 
```
OK
```

### Character Endpoints

#### GET /api/notion/characters
Fetch all characters from Notion database.

**Query Parameters**:
- `cursor` (string, optional): Pagination cursor
- `limit` (number, optional): Results per page (max 100, default 100)

**Response**:
```json
{
  "data": [
    {
      "id": "char-uuid",
      "name": "Character Name",
      "description": "Character description",
      "relationships": ["char-uuid-2", "char-uuid-3"],
      "narrativeThreads": ["thread1", "thread2"],
      "timing": "early",
      "color": "#4ADE80",
      "imageUrl": "https://example.com/image.jpg",
      "notes": "Internal notes"
    }
  ],
  "nextCursor": "cursor-string",
  "hasMore": false
}
```

#### GET /api/notion/characters/:id
Fetch a single character by ID.

**Response**:
```json
{
  "data": [{
    "id": "char-uuid",
    "name": "Character Name",
    "description": "Character description",
    "relationships": ["char-uuid-2"],
    "narrativeThreads": ["thread1"],
    "timing": "early",
    "color": "#4ADE80"
  }],
  "nextCursor": null,
  "hasMore": false
}
```

#### PUT /api/notion/characters/:id
Update a character's properties.

**Request Body**:
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "relationships": ["char-uuid-2", "char-uuid-3"],
  "narrativeThreads": ["thread1", "thread2"],
  "timing": "middle"
}
```

**Response**:
```json
{
  "data": [{
    "id": "char-uuid",
    "name": "Updated Name",
    "description": "Updated description",
    "relationships": ["char-uuid-2", "char-uuid-3"],
    "narrativeThreads": ["thread1", "thread2"],
    "timing": "middle"
  }],
  "nextCursor": null,
  "hasMore": false
}
```

### Element Endpoints

#### GET /api/notion/elements
Fetch all story elements.

**Query Parameters**:
- `cursor` (string, optional): Pagination cursor
- `limit` (number, optional): Results per page (max 100, default 100)

**Response**:
```json
{
  "data": [
    {
      "id": "elem-uuid",
      "name": "Element Name",
      "description": "Element description",
      "type": "object",
      "narrativeThreads": ["thread1"],
      "timing": "middle",
      "color": "#A855F7",
      "discoveredBy": ["char-uuid"],
      "puzzles": ["puzzle-uuid"],
      "notes": "Internal notes"
    }
  ],
  "nextCursor": null,
  "hasMore": false
}
```

#### GET /api/notion/elements/:id
Fetch a single element by ID.

#### PUT /api/notion/elements/:id
Update an element's properties.

**Request Body**:
```json
{
  "name": "Updated Element",
  "description": "Updated description",
  "type": "information",
  "narrativeThreads": ["thread1", "thread2"],
  "timing": "late",
  "discoveredBy": ["char-uuid-1", "char-uuid-2"],
  "puzzles": ["puzzle-uuid-1"]
}
```

### Puzzle Endpoints

#### GET /api/notion/puzzles
Fetch all puzzles.

**Query Parameters**:
- `cursor` (string, optional): Pagination cursor
- `limit` (number, optional): Results per page (max 100, default 100)

**Response**:
```json
{
  "data": [
    {
      "id": "puzzle-uuid",
      "name": "Puzzle Name",
      "description": "Puzzle description",
      "solutionType": "deduction",
      "difficulty": 3,
      "dependencies": ["puzzle-uuid-2"],
      "rewards": ["elem-uuid"],
      "requiredElements": ["elem-uuid-2"],
      "location": "library",
      "timing": "middle",
      "narrativeThreads": ["thread1"],
      "chain": "chain-name",
      "solvableBy": ["char-uuid"],
      "notes": "Internal notes"
    }
  ],
  "nextCursor": null,
  "hasMore": false
}
```

#### GET /api/notion/puzzles/:id
Fetch a single puzzle by ID.

#### PUT /api/notion/puzzles/:id
Update a puzzle's properties.

**Request Body**:
```json
{
  "name": "Updated Puzzle",
  "description": "Updated description",
  "solutionType": "physical",
  "difficulty": 4,
  "dependencies": ["puzzle-uuid-1", "puzzle-uuid-2"],
  "rewards": ["elem-uuid-1"],
  "requiredElements": ["elem-uuid-2", "elem-uuid-3"],
  "location": "garden",
  "timing": "late",
  "narrativeThreads": ["thread1", "thread2"],
  "chain": "new-chain",
  "solvableBy": ["char-uuid-1", "char-uuid-2"]
}
```

### Timeline Endpoints

#### GET /api/notion/timeline
Fetch timeline events.

**Query Parameters**:
- `cursor` (string, optional): Pagination cursor
- `limit` (number, optional): Results per page (max 100, default 100)

**Response**:
```json
{
  "data": [
    {
      "id": "timeline-uuid",
      "name": "Event Name",
      "description": "Event description",
      "timestamp": "2025-01-20T20:00:00Z",
      "location": "ballroom",
      "participants": ["char-uuid-1", "char-uuid-2"],
      "narrativeThreads": ["thread1"],
      "puzzles": ["puzzle-uuid"],
      "elements": ["elem-uuid"],
      "notes": "Internal notes"
    }
  ],
  "nextCursor": null,
  "hasMore": false
}
```

### Synthesized Data Endpoint

#### GET /api/notion/synthesized
Fetch all entities with bidirectional relationships resolved.

This endpoint returns all characters, elements, and puzzles with their relationships fully synthesized. It ensures bidirectional consistency (e.g., if Character A references Character B, Character B will also reference Character A).

**Query Parameters**:
- `includeTimeline` (boolean, optional): Include timeline events (default: false)

**Response**:
```json
{
  "data": {
    "characters": [...],
    "elements": [...],
    "puzzles": [...],
    "timeline": [...]  // Only if includeTimeline=true
  },
  "metadata": {
    "characterCount": 25,
    "elementCount": 50,
    "puzzleCount": 30,
    "timelineCount": 20,
    "synthesizedAt": "2025-01-20T12:00:00.000Z"
  }
}
```

### Cache Management Endpoints

#### GET /api/cache/stats
Get cache statistics.

**Response**:
```json
{
  "keys": 12,
  "hits": 245,
  "misses": 23,
  "ksize": 1024,
  "vsize": 524288,
  "cachedEndpoints": [
    "/api/notion/characters",
    "/api/notion/elements",
    "/api/notion/puzzles"
  ]
}
```

#### POST /api/cache/clear
Clear all cached data.

**Request Body** (optional):
```json
{
  "pattern": "characters*"  // Optional pattern to clear specific keys
}
```

**Response**:
```json
{
  "message": "Cache cleared successfully",
  "keysCleared": 12
}
```

#### POST /api/cache/warm
Pre-warm the cache by fetching all entities.

**Response**:
```json
{
  "message": "Cache warmed successfully",
  "endpoints": [
    "/api/notion/characters",
    "/api/notion/elements",
    "/api/notion/puzzles",
    "/api/notion/timeline"
  ],
  "totalCached": 4
}
```

## Error Handling

### HTTP Status Codes

- `200 OK`: Successful request
- `400 Bad Request`: Invalid parameters or request body
- `401 Unauthorized`: Missing or invalid API key
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Error Response Format

```json
{
  "error": "Detailed error message",
  "details": {
    "field": "Additional context"
  },
  "stack": "Stack trace (development only)"
}
```

## Pagination

All list endpoints support cursor-based pagination:

1. Initial request without cursor returns first page
2. Response includes `nextCursor` if more results exist
3. Pass `nextCursor` as query parameter for next page
4. `hasMore: false` indicates last page

Example:
```http
GET /api/notion/characters?limit=10
GET /api/notion/characters?limit=10&cursor=eyJpZCI6InV1aWQifQ==
```

## Caching

- **TTL**: 5 minutes for all cached responses
- **Cache Key**: Based on endpoint and query parameters
- **Invalidation**: Automatic on entity updates
- **Manual Clear**: Use `/api/cache/clear` endpoint

## Rate Limiting Headers

Responses include rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705750800
```

## CORS Configuration

- **Development**: Allows localhost ports 5173-5175
- **Production**: Configured via `FRONTEND_URL` environment variable
- **Credentials**: Supported for authenticated requests

## Environment Variables

Required for all endpoints:
- `NOTION_API_KEY`: Notion integration token
- `NOTION_CHARACTERS_DB`: Characters database ID
- `NOTION_ELEMENTS_DB`: Elements database ID
- `NOTION_PUZZLES_DB`: Puzzles database ID
- `NOTION_TIMELINE_DB`: Timeline database ID

Optional:
- `API_KEY`: API key for authentication
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Frontend URL for CORS in production

## TypeScript Types

See `server/types/index.ts` for complete type definitions:

```typescript
interface Character {
  id: string;
  name: string;
  description: string;
  relationships: string[];
  narrativeThreads: string[];
  timing: 'early' | 'middle' | 'late';
  color?: string;
  imageUrl?: string;
  notes?: string;
}

interface Element {
  id: string;
  name: string;
  description: string;
  type: 'object' | 'information' | 'location';
  narrativeThreads: string[];
  timing: 'early' | 'middle' | 'late';
  color?: string;
  discoveredBy: string[];
  puzzles: string[];
  notes?: string;
}

interface Puzzle {
  id: string;
  name: string;
  description: string;
  solutionType: 'deduction' | 'physical' | 'social' | 'technical';
  difficulty: number;
  dependencies: string[];
  rewards: string[];
  requiredElements: string[];
  location?: string;
  timing: 'early' | 'middle' | 'late';
  narrativeThreads: string[];
  chain?: string;
  solvableBy: string[];
  notes?: string;
}
```

## Testing

Test the API using the provided scripts:

```bash
# Test individual endpoints
tsx scripts/test-single-endpoint.ts

# Test synthesized endpoint
tsx scripts/test-synthesized-endpoint.ts

# Test timeline performance
tsx scripts/test-timeline-performance.ts

# Integration tests
npm run test:integration
```