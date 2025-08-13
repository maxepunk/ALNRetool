# ALNRetool API Documentation

## Overview

The ALNRetool API provides a secure proxy layer between the React frontend and Notion's API, handling authentication, rate limiting, and data transformation. All endpoints return consistent response formats and error structures.

**Base URL**: `http://localhost:3001/api`  
**Authentication**: X-API-Key header required for all `/notion/*` endpoints

## Table of Contents

1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [Response Formats](#response-formats)
4. [Endpoints](#endpoints)
   - [Health Check](#health-check)
   - [Characters](#characters)
   - [Elements](#elements)
   - [Puzzles](#puzzles)
   - [Timeline](#timeline)
   - [Cache Management](#cache-management)
5. [Caching](#caching)
6. [Input Validation](#input-validation)
7. [Error Handling](#error-handling)
8. [Environment Configuration](#environment-configuration)
9. [CORS Policy](#cors-policy)

## Authentication

All Notion API endpoints require authentication via the `X-API-Key` header.

```http
X-API-Key: your-api-key-here
```

### Authentication Errors

Missing or invalid API key:
```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "Unauthorized - Invalid API key"
}
```

Server configuration error (API_KEY not set):
```json
{
  "statusCode": 500,
  "code": "CONFIG_ERROR",
  "message": "Server configuration error."
}
```

## Rate Limiting

The API implements two layers of rate limiting:

### 1. Express Rate Limiting (Incoming Requests)
- **Limit**: 100 requests per minute per IP
- **Window**: 1 minute rolling window
- **Applies to**: All `/api/*` endpoints
- **Error Response** (429):
```json
{
  "message": "Too many requests from this IP, please try again after a minute"
}
```

### 2. Bottleneck Rate Limiting (Notion API Calls)
- **Limit**: ~2.94 requests per second (340ms spacing)
- **Purpose**: Respect Notion's 3 req/sec rate limit
- **Implementation**: Automatic queuing with no user-facing errors
- **Note**: Multiple requests are queued and processed sequentially

## Response Formats

### Success Response

All successful API responses follow this structure:

```typescript
interface APIResponse<T> {
  data: T[];           // Array of entities
  nextCursor: null;    // Always null (pagination handled internally)
  hasMore: false;      // Always false (all data fetched)
}
```

Example:
```json
{
  "data": [
    {
      "id": "abc-123",
      "name": "Sofia Chen",
      "type": "Player",
      "tier": "Core"
      // ... additional fields
    }
  ],
  "nextCursor": null,
  "hasMore": false
}
```

### Error Response

All errors follow this structure:

```typescript
interface APIError {
  statusCode: number;  // HTTP status code
  code: string;        // Error code constant
  message: string;     // Human-readable message
}
```

## Endpoints

### Health Check

Check server status without authentication.

**Endpoint**: `GET /api/health`  
**Authentication**: None required  
**Rate Limit**: Subject to Express rate limit only

#### Response (200 OK)
```json
{
  "status": "ok",
  "timestamp": "2025-01-14T12:34:56.789Z"
}
```

### Characters

Fetch all characters from the Notion database.

**Endpoint**: `GET /api/notion/characters`  
**Authentication**: Required (X-API-Key)  
**Rate Limit**: Both Express and Bottleneck apply  
**Query Parameters**:
- `limit` (optional): Number of results to return (1-100, default: 20)
- `cursor` (optional): Pagination cursor for next page

#### Success Response (200 OK)
```json
{
  "data": [
    {
      "id": "18c2f33d-583f-8060-a6ab-de32ff06bca2",
      "name": "Sofia Chen",
      "type": "Player",
      "tier": "Core",
      "ownedElementIds": ["elem-1", "elem-2"],
      "associatedElementIds": ["elem-3"],
      "characterPuzzleIds": ["puzzle-1"],
      "eventIds": ["event-1", "event-2"],
      "connections": ["char-2", "char-3"],
      "primaryAction": "Investigates financial records",
      "characterLogline": "Ambitious CFO with hidden agenda",
      "overview": "Sofia joined the company...",
      "emotionTowardsCEO": "Resentful but respectful"
    }
  ],
  "nextCursor": null,
  "hasMore": false
}
```

#### Character Object Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique Notion page ID |
| name | string | Character name |
| type | "NPC" \| "Player" | Character playability |
| tier | "Core" \| "Secondary" \| "Tertiary" | Narrative importance |
| ownedElementIds | string[] | IDs of elements character starts with |
| associatedElementIds | string[] | IDs of narratively connected elements |
| characterPuzzleIds | string[] | IDs of accessible puzzles |
| eventIds | string[] | IDs of timeline events involving character |
| connections | string[] | IDs of characters with shared events |
| primaryAction | string | Core character behavior |
| characterLogline | string | One-line description |
| overview | string | Detailed background |
| emotionTowardsCEO | string | Relationship dynamics |

### Elements

Fetch all game elements (props, documents, memory tokens).

**Endpoint**: `GET /api/notion/elements`  
**Authentication**: Required (X-API-Key)  
**Rate Limit**: Both Express and Bottleneck apply  
**Query Parameters**:
- `limit` (optional): Number of results to return (1-100, default: 20)
- `cursor` (optional): Pagination cursor for next page

#### Success Response (200 OK)
```json
{
  "data": [
    {
      "id": "elem-123",
      "name": "Contract Draft",
      "descriptionText": "Legal document with amendments...",
      "sfPatterns": {
        "rfid": "RFID-001",
        "valueRating": 4,
        "memoryType": "Business",
        "group": "Legal Documents"
      },
      "basicType": "Document",
      "ownerId": "char-1",
      "containerId": null,
      "contentIds": [],
      "timelineEventId": "event-1",
      "status": "Writing Complete",
      "firstAvailable": "Act 1",
      "requiredForPuzzleIds": ["puzzle-1"],
      "rewardedByPuzzleIds": ["puzzle-2"],
      "containerPuzzleId": null,
      "narrativeThreads": ["Corporate Espionage", "Financial Fraud"],
      "associatedCharacterIds": ["char-1", "char-2"],
      "puzzleChain": [],
      "productionNotes": "Print on aged paper",
      "filesMedia": [
        {
          "name": "contract-v2.pdf",
          "url": "https://notion.so/..."
        }
      ],
      "contentLink": "https://drive.google.com/...",
      "isContainer": false
    }
  ],
  "nextCursor": null,
  "hasMore": false
}
```

#### Element Object Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique element ID |
| name | string | Element name |
| descriptionText | string | Full content including SF_ patterns |
| sfPatterns | object | Parsed metadata (rfid, valueRating, etc.) |
| basicType | string | Physical manifestation type |
| ownerId | string? | Character who starts with item |
| containerId | string? | Parent container element |
| contentIds | string[] | Elements contained within |
| timelineEventId | string? | Associated timeline event |
| status | string | Production readiness status |
| firstAvailable | Act? | When element becomes accessible |
| requiredForPuzzleIds | string[] | Puzzles needing this element |
| rewardedByPuzzleIds | string[] | Puzzles that unlock this |
| containerPuzzleId | string? | Puzzle that opens container |
| narrativeThreads | string[] | Story categories (26 options) |
| associatedCharacterIds | string[] | Characters in related events |
| puzzleChain | string[] | Puzzle dependency chain |
| productionNotes | string | Design/fabrication notes |
| filesMedia | array | Attached files with URLs |
| contentLink | string? | External resource URL |
| isContainer | boolean | Whether element contains others |

#### Element Types
- `Set Dressing` - Environmental decoration
- `Prop` - Interactive physical item
- `Memory Token (Audio)` - RFID audio content
- `Memory Token (Video)` - RFID video content
- `Memory Token (Image)` - RFID image content
- `Memory Token (Audio+Image)` - RFID multimedia
- `Document` - Written content

#### Element Status Values
- **To-do**: `Idea/Placeholder`
- **In Progress**: `in space playtest ready`, `In development`, `Writing Complete`, `Design Complete`, `Source Prop/print`, `Ready for Playtest`
- **Complete**: `Done`

### Puzzles

Fetch all puzzles and their dependencies.

**Endpoint**: `GET /api/notion/puzzles`  
**Authentication**: Required (X-API-Key)  
**Rate Limit**: Both Express and Bottleneck apply  
**Query Parameters**:
- `limit` (optional): Number of results to return (1-100, default: 20)
- `cursor` (optional): Pagination cursor for next page

#### Success Response (200 OK)
```json
{
  "data": [
    {
      "id": "puzzle-123",
      "name": "Hidden Safe",
      "descriptionSolution": "Enter code 4-8-15 after finding clues",
      "puzzleElementIds": ["elem-1", "elem-2"],
      "lockedItemId": "elem-safe",
      "ownerId": "char-1",
      "rewardIds": ["elem-3", "elem-4"],
      "parentItemId": null,
      "subPuzzleIds": ["puzzle-124"],
      "storyReveals": ["event-1"],
      "timing": ["Act 1"],
      "narrativeThreads": ["Corporate Secrets"],
      "assetLink": "https://docs.google.com/..."
    }
  ],
  "nextCursor": null,
  "hasMore": false
}
```

#### Puzzle Object Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique puzzle ID |
| name | string | Puzzle name |
| descriptionSolution | string | How to solve the puzzle |
| puzzleElementIds | string[] | Required elements to solve |
| lockedItemId | string? | Container this puzzle opens |
| ownerId | string? | Character who "owns" puzzle |
| rewardIds | string[] | Elements gained on completion |
| parentItemId | string? | Parent in puzzle chain |
| subPuzzleIds | string[] | Child puzzles |
| storyReveals | string[] | Timeline events uncovered |
| timing | Act[] | When puzzle becomes solvable |
| narrativeThreads | string[] | Story categories touched |
| assetLink | string? | External documentation |

### Timeline

Fetch all timeline events (game backstory).

**Endpoint**: `GET /api/notion/timeline`  
**Authentication**: Required (X-API-Key)  
**Rate Limit**: Both Express and Bottleneck apply  
**Query Parameters**:
- `limit` (optional): Number of results to return (1-100, default: 20)
- `cursor` (optional): Pagination cursor for next page

#### Success Response (200 OK)
```json
{
  "data": [
    {
      "id": "event-123",
      "description": "CEO announces merger plans",
      "date": "2024-03-15",
      "charactersInvolvedIds": ["char-1", "char-2"],
      "memoryEvidenceIds": ["elem-1"],
      "memTypes": ["Memory Token (Video)"],
      "notes": "Critical story beat",
      "lastEditedTime": "2025-01-14T10:30:00.000Z"
    }
  ],
  "nextCursor": null,
  "hasMore": false
}
```

#### Timeline Object Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique event ID |
| description | string | Event summary |
| date | string | ISO date when event occurred |
| charactersInvolvedIds | string[] | Characters present |
| memoryEvidenceIds | string[] | Elements revealing this event |
| memTypes | string[] | Types of evidence |
| notes | string | Design notes |
| lastEditedTime | string | Last modification timestamp |

### Cache Management

Manage the server-side cache for optimal performance.

#### Get Cache Statistics

**Endpoint**: `GET /api/cache/stats`  
**Authentication**: Required (X-API-Key)  
**Rate Limit**: Express rate limit applies

##### Response (200 OK)
```json
{
  "hits": 245,
  "misses": 50,
  "hitRate": "83.05%",
  "totalKeys": 12,
  "keySizeBytes": 480,
  "valueSizeBytes": 15360,
  "totalSizeBytes": 15840,
  "timestamp": "2025-01-14T12:34:56.789Z"
}
```

#### Clear All Cache

**Endpoint**: `POST /api/cache/clear`  
**Authentication**: Required (X-API-Key)  
**Headers**: `X-Admin-Key` required in production  
**Rate Limit**: Express rate limit applies

##### Response (200 OK)
```json
{
  "message": "Cache cleared successfully",
  "clearedKeys": 12,
  "timestamp": "2025-01-14T12:34:56.789Z"
}
```

#### Clear Endpoint Cache

**Endpoint**: `POST /api/cache/clear/:endpoint`  
**Authentication**: Required (X-API-Key)  
**Rate Limit**: Express rate limit applies  
**Valid Endpoints**: `characters`, `elements`, `puzzles`, `timeline`

##### Response (200 OK)
```json
{
  "message": "Cache cleared for characters",
  "pattern": "characters:*",
  "clearedKeys": 3,
  "timestamp": "2025-01-14T12:34:56.789Z"
}
```

## Caching

The API implements server-side caching to reduce Notion API load and improve response times.

### Cache Configuration
- **TTL**: 5 minutes (300 seconds) - configurable via `CACHE_TTL` env var
- **Max Keys**: 1000 entries
- **Strategy**: Cache-first with fallback to Notion

### Cache Headers

All cached responses include these headers:
- `X-Cache-Hit`: `"true"` if served from cache, `"false"` if fetched from Notion

### Cache Bypass

Force a fresh fetch from Notion by including:
```http
X-Cache-Bypass: true
```

### Cache Key Format
Cache keys follow the pattern: `{endpoint}:{limit}:{cursor}`
- Example: `characters:20:null` or `elements:50:abc123`

## Input Validation

All Notion endpoints validate pagination parameters to prevent invalid requests.

### Validation Rules

#### Limit Parameter
- **Type**: Integer
- **Range**: 1-100
- **Default**: 20 (if not provided)
- **Error Code**: `INVALID_LIMIT`

#### Invalid Limit Examples
```bash
# Too large
GET /api/notion/characters?limit=101
# Response: 400 Bad Request
{
  "statusCode": 400,
  "code": "INVALID_LIMIT",
  "message": "Limit must be between 1 and 100"
}

# Too small
GET /api/notion/elements?limit=0
# Response: 400 Bad Request

# Non-numeric
GET /api/notion/puzzles?limit=abc
# Response: 400 Bad Request
```

## Error Handling

### Common Error Responses

#### 400 Bad Request
Notion validation error:
```json
{
  "statusCode": 400,
  "code": "validation_error",
  "message": "Invalid database ID"
}
```

#### 401 Unauthorized
Missing or invalid API key:
```json
{
  "statusCode": 401,
  "code": "UNAUTHORIZED",
  "message": "Unauthorized - Invalid API key"
}
```

#### 429 Too Many Requests
Rate limit exceeded:
```json
{
  "message": "Too many requests from this IP, please try again after a minute"
}
```

#### 500 Internal Server Error
Configuration error:
```json
{
  "statusCode": 500,
  "code": "CONFIG_ERROR",
  "message": "Characters database ID not configured"
}
```

Generic server error:
```json
{
  "statusCode": 500,
  "code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred"
}
```

## Environment Configuration

Required environment variables:

```bash
# Server Configuration
PORT=3001                    # Server port (default: 3001)
NODE_ENV=development         # Environment mode
API_KEY=your-api-key-here   # API authentication key

# Notion Configuration
NOTION_API_KEY=secret_xxx    # Notion integration token
NOTION_CHARACTERS_DB=xxx     # Characters database ID
NOTION_ELEMENTS_DB=xxx       # Elements database ID
NOTION_PUZZLES_DB=xxx        # Puzzles database ID
NOTION_TIMELINE_DB=xxx       # Timeline database ID

# Cache Configuration (optional)
CACHE_TTL=300               # Cache TTL in seconds (default: 300 = 5 minutes)
ADMIN_KEY=your-admin-key    # Required for cache clear in production

# Production Only
FRONTEND_URL=https://app.com # Frontend origin for CORS
```

## CORS Policy

### Development Mode
- Allowed origin: `http://localhost:5173`
- Credentials: Enabled

### Production Mode
- Allowed origin: Value of `FRONTEND_URL` environment variable
- Credentials: Enabled

### Headers Set
- `Access-Control-Allow-Origin`: Frontend URL
- `Access-Control-Allow-Credentials`: true

## Usage Examples

### Fetch All Characters
```bash
curl -X GET http://localhost:3001/api/notion/characters \
  -H "X-API-Key: your-api-key-here"
```

### Check Server Health
```bash
curl -X GET http://localhost:3001/api/health
```

### Handle Rate Limiting in Client
```javascript
async function fetchWithRetry(endpoint, options, retries = 3) {
  try {
    const response = await fetch(endpoint, options);
    
    if (response.status === 429 && retries > 0) {
      // Wait 60 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 60000));
      return fetchWithRetry(endpoint, options, retries - 1);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(endpoint, options, retries - 1);
    }
    throw error;
  }
}
```

## Notes

1. **Pagination**: The API supports query-based pagination with `limit` (1-100) and `cursor` parameters.
2. **Real-time Updates**: The API does not support webhooks or real-time updates. Use polling if needed.
3. **Caching**: Server-side caching with 5-minute TTL reduces Notion API calls by 70-80%. Use `X-Cache-Bypass: true` to force fresh data.
4. **Data Freshness**: Cached data is served by default (5-minute TTL). Fresh data available via cache bypass header.
5. **Performance**: Cached requests return in <50ms. Initial Notion requests may take 1-3 seconds depending on database size.

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure Notion integration has proper permissions
4. Test with the smoke test suite: `npm test`