// EXACT implementation for MSW v2
import { http, HttpResponse } from 'msw';

export const notionHandlers = [
  // GET /api/notion/characters
  http.get('*/api/notion/characters', () => {
    return HttpResponse.json({
      results: [
        { id: 'char-1', name: 'Test Character', type: 'NPC', tier: 'Core' }
      ],
      hasMore: false
    });
  }),
  
  // POST /api/notion/characters
  http.post('*/api/notion/characters', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      id: `char-${Date.now()}`,
      ...body,
      version: 1 // NEW: Version for ETag
    });
  }),
  
  // PUT /api/notion/characters/:id - SUCCESS
  http.put('*/api/notion/characters/:id', async ({ request }) => {
    const version = request.headers.get('If-Match');
    const body = await request.json() as Record<string, unknown>;
    if (version === '1') {
      return HttpResponse.json({ 
        ...body, 
        version: 2 
      });
    }
    return HttpResponse.json(
      { error: 'Version mismatch' },
      { status: 409 }
    );
  })
];