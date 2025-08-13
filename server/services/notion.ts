import { Client } from '@notionhq/client';
import Bottleneck from 'bottleneck';

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
    if (!process.env.NOTION_API_KEY) {
      throw new Error('NOTION_API_KEY is not configured');
    }
    notionClient = new Client({ 
      auth: process.env.NOTION_API_KEY 
    });
  }
  return notionClient;
}

// Wrap the Notion client methods with rate limiting
export const notion = {
  databases: {
    query: limiter.wrap((params: any) => getNotionClient().databases.query(params)),
    retrieve: limiter.wrap((params: any) => getNotionClient().databases.retrieve(params)),
  },
  pages: {
    retrieve: limiter.wrap((params: any) => getNotionClient().pages.retrieve(params)),
    update: limiter.wrap((params: any) => getNotionClient().pages.update(params)),
  },
  blocks: {
    children: {
      list: limiter.wrap((params: any) => getNotionClient().blocks.children.list(params)),
    }
  }
};