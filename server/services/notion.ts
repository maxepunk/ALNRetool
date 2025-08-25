import { Client } from '@notionhq/client';
import type { 
  GetDatabaseParameters,
  GetDatabaseResponse,
  QueryDatabaseParameters,
  QueryDatabaseResponse,
  GetPageParameters,
  GetPageResponse,
  UpdatePageParameters,
  UpdatePageResponse,
  GetPagePropertyParameters,
  GetPagePropertyResponse,
  ListBlockChildrenParameters,
  ListBlockChildrenResponse
} from '@notionhq/client/build/src/api-endpoints';
import Bottleneck from 'bottleneck';
import config from '../config/index.js';

// Notion's rate limit is 3 requests per second.
// Use reservoir-based limiting for better throughput
const limiter = new Bottleneck({
  reservoir: 3, // 3 requests available
  reservoirRefreshAmount: 3, // refill to 3
  reservoirRefreshInterval: 1000, // every 1 second
  maxConcurrent: 1, // sequential for safety
});

// Lazy initialization to ensure env vars are loaded
let notionClient: Client | null = null;

function getNotionClient() {
  if (!notionClient) {
    notionClient = new Client({ 
      auth: config.notionApiKey 
    });
  }
  return notionClient;
}

// Wrap the Notion client methods with rate limiting
export const notion = {
  databases: {
    query: limiter.wrap((params: QueryDatabaseParameters): Promise<QueryDatabaseResponse> => 
      getNotionClient().databases.query(params)
    ),
    retrieve: limiter.wrap((params: GetDatabaseParameters): Promise<GetDatabaseResponse> => 
      getNotionClient().databases.retrieve(params)
    ),
  },
  pages: {
    retrieve: limiter.wrap((params: GetPageParameters): Promise<GetPageResponse> => 
      getNotionClient().pages.retrieve(params)
    ),
    update: limiter.wrap((params: UpdatePageParameters): Promise<UpdatePageResponse> => 
      getNotionClient().pages.update(params)
    ),
    properties: {
      retrieve: limiter.wrap((params: GetPagePropertyParameters): Promise<GetPagePropertyResponse> => 
        getNotionClient().pages.properties.retrieve(params)
      ),
    }
  },
  blocks: {
    children: {
      list: limiter.wrap((params: ListBlockChildrenParameters): Promise<ListBlockChildrenResponse> => 
        getNotionClient().blocks.children.list(params)
      ),
    }
  }
};