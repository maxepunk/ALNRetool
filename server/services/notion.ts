import { Client } from '@notionhq/client';
import Bottleneck from 'bottleneck';

// Notion's rate limit is 3 requests per second.
// 1000ms / 3 = ~333ms per request. We'll add a small buffer.
const limiter = new Bottleneck({
  minTime: 340, // ms between requests
});

const notionClient = new Client({ 
  auth: process.env.NOTION_API_KEY 
});

// Wrap the Notion client methods with rate limiting
export const notion = {
  databases: {
    query: limiter.wrap(notionClient.databases.query.bind(notionClient.databases)),
    retrieve: limiter.wrap(notionClient.databases.retrieve.bind(notionClient.databases)),
  },
  pages: {
    retrieve: limiter.wrap(notionClient.pages.retrieve.bind(notionClient.pages)),
    update: limiter.wrap(notionClient.pages.update.bind(notionClient.pages)),
  },
  blocks: {
    children: {
      list: limiter.wrap(notionClient.blocks.children.list.bind(notionClient.blocks.children)),
    }
  }
};