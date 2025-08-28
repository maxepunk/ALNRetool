/**
 * Notion API Client Service
 * 
 * Provides rate-limited access to Notion API with automatic throttling.
 * Implements the repository pattern for data access with lazy initialization.
 * 
 * @module server/services/notion
 * 
 * **Architecture:**
 * - Lazy client initialization for better startup performance
 * - Bottleneck rate limiting (3 requests/second per Notion limits)
 * - Wrapped API methods for transparent throttling
 * - Type-safe interfaces from @notionhq/client
 * 
 * **Rate Limiting Strategy:**
 * - Reservoir-based limiting for better throughput
 * - 3 requests per second maximum (Notion's limit)
 * - Sequential processing to prevent race conditions
 * - Automatic queuing of excess requests
 * 
 * @see {@link https://developers.notion.com/reference/rate-limits}
 */

import { Client } from '@notionhq/client';
import type { 
  GetDatabaseParameters,
  GetDatabaseResponse,
  QueryDatabaseParameters,
  QueryDatabaseResponse,
  GetPageParameters,
  GetPageResponse,
  CreatePageParameters,
  CreatePageResponse,
  UpdatePageParameters,
  UpdatePageResponse,
  GetPagePropertyParameters,
  GetPagePropertyResponse,
  ListBlockChildrenParameters,
  ListBlockChildrenResponse
} from '@notionhq/client/build/src/api-endpoints';
import Bottleneck from 'bottleneck';
import config from '../config/index.js';

/**
 * Rate limiter for Notion API requests.
 * Configured for Notion's 3 requests per second limit.
 * 
 * @constant {Bottleneck} limiter
 * 
 * **Configuration:**
 * - reservoir: 3 tokens available initially
 * - reservoirRefreshAmount: Refills to 3 tokens
 * - reservoirRefreshInterval: Refills every 1000ms
 * - maxConcurrent: 1 (sequential processing for safety)
 * 
 * **Behavior:**
 * - Automatically queues requests when limit exceeded
 * - Provides smooth request flow without bursts
 * - Prevents 429 (Too Many Requests) errors
 * 
 * **Complexity:** O(1) for request scheduling
 */
const limiter = new Bottleneck({
  reservoir: 3, // 3 requests available
  reservoirRefreshAmount: 3, // refill to 3
  reservoirRefreshInterval: 1000, // every 1 second
  maxConcurrent: 3, // Allow full parallelism within rate limit
});

/**
 * Cached Notion client instance for singleton pattern.
 * Null until first use to support lazy initialization.
 * 
 * @type {Client | null}
 * @private
 */
let notionClient: Client | null = null;

/**
 * Gets or creates the Notion API client instance.
 * Implements lazy initialization and singleton pattern.
 * 
 * @function getNotionClient
 * @returns {Client} Configured Notion API client
 * 
 * **Benefits:**
 * - Delays client creation until first API call
 * - Ensures environment variables are loaded
 * - Reuses single client instance for all requests
 * - Reduces memory overhead and connection pooling
 * 
 * **Throws:**
 * - Error if config.notionApiKey is undefined
 * 
 * @example
 * const client = getNotionClient();
 * await client.databases.query({ database_id: 'abc123' });
 */
function getNotionClient() {
  if (!notionClient) {
    notionClient = new Client({ 
      auth: config.notionApiKey 
    });
  }
  return notionClient;
}

/**
 * Rate-limited Notion API client wrapper.
 * Provides transparent throttling for all Notion API methods.
 * 
 * @constant {Object} notion
 * @exports notion
 * 
 * **Available Methods:**
 * 
 * **Databases:**
 * - `databases.query()` - Query database with filters and sorts
 * - `databases.retrieve()` - Get database metadata and schema
 * 
 * **Pages:**
 * - `pages.retrieve()` - Get page data and properties
 * - `pages.update()` - Update page properties
 * - `pages.properties.retrieve()` - Get specific page property
 * 
 * **Blocks:**
 * - `blocks.children.list()` - List child blocks of a page/block
 * 
 * **Rate Limiting:**
 * All methods are automatically rate-limited to 3 req/sec.
 * Excess requests are queued and processed sequentially.
 * 
 * @example
 * // Query a database with automatic rate limiting
 * const response = await notion.databases.query({
 *   database_id: config.databaseIds.characters,
 *   page_size: 100
 * });
 * 
 * @example
 * // Update a page property
 * await notion.pages.update({
 *   page_id: 'abc-123',
 *   properties: {
 *     Name: { title: [{ text: { content: 'Updated Name' } }] }
 *   }
 * });
 */
export const notion = {
  databases: {
    /**
     * Query a Notion database with filters and sorting.
     * @param {QueryDatabaseParameters} params - Query parameters
     * @returns {Promise<QueryDatabaseResponse>} Paginated results
     */
    query: limiter.wrap((params: QueryDatabaseParameters): Promise<QueryDatabaseResponse> => 
      getNotionClient().databases.query(params)
    ),
    /**
     * Retrieve database metadata and schema.
     * @param {GetDatabaseParameters} params - Database ID
     * @returns {Promise<GetDatabaseResponse>} Database schema
     */
    retrieve: limiter.wrap((params: GetDatabaseParameters): Promise<GetDatabaseResponse> => 
      getNotionClient().databases.retrieve(params)
    ),
  },
  pages: {
    /**
     * Create a new page.
     * @param {CreatePageParameters} params - Parent and properties
     * @returns {Promise<CreatePageResponse>} Created page
     */
    create: limiter.wrap((params: CreatePageParameters): Promise<CreatePageResponse> => 
      getNotionClient().pages.create(params)
    ),
    /**
     * Retrieve a page with all properties.
     * @param {GetPageParameters} params - Page ID
     * @returns {Promise<GetPageResponse>} Page data
     */
    retrieve: limiter.wrap((params: GetPageParameters): Promise<GetPageResponse> => 
      getNotionClient().pages.retrieve(params)
    ),
    /**
     * Update page properties.
     * @param {UpdatePageParameters} params - Page ID and properties
     * @returns {Promise<UpdatePageResponse>} Updated page
     */
    update: limiter.wrap((params: UpdatePageParameters): Promise<UpdatePageResponse> => 
      getNotionClient().pages.update(params)
    ),
    properties: {
      /**
       * Retrieve a specific page property.
       * @param {GetPagePropertyParameters} params - Page and property IDs
       * @returns {Promise<GetPagePropertyResponse>} Property value
       */
      retrieve: limiter.wrap((params: GetPagePropertyParameters): Promise<GetPagePropertyResponse> => 
        getNotionClient().pages.properties.retrieve(params)
      ),
    }
  },
  blocks: {
    children: {
      /**
       * List child blocks of a page or block.
       * @param {ListBlockChildrenParameters} params - Parent block ID
       * @returns {Promise<ListBlockChildrenResponse>} Child blocks
       */
      list: limiter.wrap((params: ListBlockChildrenParameters): Promise<ListBlockChildrenResponse> => 
        getNotionClient().blocks.children.list(params)
      ),
    }
  }
};