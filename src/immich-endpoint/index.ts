import type { EndpointConfig } from '@directus/extensions';

const endpoint: EndpointConfig = (router, context) => {
  const { env } = context;

  // GET requests for fetching images/thumbnails and specific resources
  router.get('/', async (req, res) => {
    const immichUrl = env['IMMICH_URL'];
    const apiKey = env['IMMICH_API_KEY'];

    if (!immichUrl || !apiKey) {
      res.status(500);
      return res.send({ error: 'IMMICH_URL and IMMICH_API_KEY must be configured' });
    }

    const path = req.query.path as string;

    if (!path) {
      res.status(400);
      return res.send({ error: 'path query parameter is required' });
    }

    // Validate path to prevent directory traversal
    if (path.includes('..') || path.startsWith('/')) {
      res.status(400);
      return res.send({ error: 'Invalid path' });
    }

    try {
      const url = `${immichUrl}/api/${path}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
        },
      });

      // For image responses, we need to handle the binary data
      const contentType = response.headers.get('content-type') || 'application/json';

      if (contentType.startsWith('image/') || contentType.startsWith('video/')) {
        const buffer = await response.arrayBuffer();
        res.header('Content-Type', contentType);
        res.header('Cache-Control', 'public, max-age=31536000');
        return res.send(Buffer.from(buffer));
      }

      // For JSON responses
      const data = await response.json();
      return res.send(data);
    } catch (error) {
      res.status(502);
      return res.send({ error: 'Failed to fetch from Immich', details: String(error) });
    }
  });

  // POST requests for search
  router.post('/search', async (req, res) => {
    const immichUrl = env['IMMICH_URL'];
    const apiKey = env['IMMICH_API_KEY'];

    if (!immichUrl || !apiKey) {
      res.status(500);
      return res.send({ error: 'IMMICH_URL and IMMICH_API_KEY must be configured' });
    }

    try {
      const url = `${immichUrl}/api/search/metadata`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body || {}),
      });

      const data = await response.json();
      return res.send(data);
    } catch (error) {
      res.status(502);
      return res.send({ error: 'Failed to search Immich', details: String(error) });
    }
  });

  // GET albums
  router.get('/albums', async (req, res) => {
    const immichUrl = env['IMMICH_URL'];
    const apiKey = env['IMMICH_API_KEY'];

    if (!immichUrl || !apiKey) {
      res.status(500);
      return res.send({ error: 'IMMICH_URL and IMMICH_API_KEY must be configured' });
    }

    try {
      const url = `${immichUrl}/api/albums`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
        },
      });

      const data = await response.json();
      return res.send(data);
    } catch (error) {
      res.status(502);
      return res.send({ error: 'Failed to fetch albums', details: String(error) });
    }
  });

  // GET single album with assets
  router.get('/albums/:id', async (req, res) => {
    const immichUrl = env['IMMICH_URL'];
    const apiKey = env['IMMICH_API_KEY'];

    if (!immichUrl || !apiKey) {
      res.status(500);
      return res.send({ error: 'IMMICH_URL and IMMICH_API_KEY must be configured' });
    }

    try {
      const url = `${immichUrl}/api/albums/${req.params.id}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
        },
      });

      const data = await response.json();
      return res.send(data);
    } catch (error) {
      res.status(502);
      return res.send({ error: 'Failed to fetch album', details: String(error) });
    }
  });

  // GET all stacks
  router.get('/stacks', async (req, res) => {
    const immichUrl = env['IMMICH_URL'];
    const apiKey = env['IMMICH_API_KEY'];

    if (!immichUrl || !apiKey) {
      res.status(500);
      return res.send({ error: 'IMMICH_URL and IMMICH_API_KEY must be configured' });
    }

    try {
      const url = `${immichUrl}/api/stacks`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
        },
      });

      const data = await response.json();
      return res.send(data);
    } catch (error) {
      res.status(502);
      return res.send({ error: 'Failed to fetch stacks', details: String(error) });
    }
  });

  // GET search suggestions (camera makes, models, etc.)
  router.get('/suggestions/:type', async (req, res) => {
    const immichUrl = env['IMMICH_URL'];
    const apiKey = env['IMMICH_API_KEY'];

    if (!immichUrl || !apiKey) {
      res.status(500);
      return res.send({ error: 'IMMICH_URL and IMMICH_API_KEY must be configured' });
    }

    const validTypes = ['camera-make', 'camera-model', 'city', 'state', 'country'];
    if (!validTypes.includes(req.params.type)) {
      res.status(400);
      return res.send({ error: 'Invalid suggestion type' });
    }

    try {
      const url = `${immichUrl}/api/search/suggestions?type=${req.params.type}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
        },
      });

      const data = await response.json();
      return res.send(data);
    } catch (error) {
      res.status(502);
      return res.send({ error: 'Failed to fetch suggestions', details: String(error) });
    }
  });
};

export default endpoint;
