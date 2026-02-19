# Backend Proxy Setup

This is an advanced guide for setting up your own proxy server to use AI providers that don't support direct browser requests (OpenAI, xAI, DeepSeek, Gemini).

> **Tip:** Before setting up a proxy, consider using **OpenRouter** instead. It provides browser-compatible access to OpenAI, Anthropic, and 200+ other models through one API with no setup required.

---

## Table of Contents

- [Why You Might Need This](#why-you-might-need-this)
- [Option 1: Use OpenRouter (Easiest)](#option-1-use-openrouter-easiest)
- [Option 2: Cloudflare Worker](#option-2-cloudflare-worker)
- [Option 3: Self-Hosted Node.js Proxy](#option-3-self-hosted-nodejs-proxy)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [Related Guides](#related-guides)

---

## Why You Might Need This

NeumanOS runs entirely in your browser for maximum privacy. However, some AI providers block direct browser requests due to CORS (Cross-Origin Resource Sharing) security policies:

| Provider | Direct Access | Needs Proxy |
|----------|--------------|-------------|
| OpenRouter | Yes | No |
| Anthropic | Yes | No |
| HuggingFace | Yes | No |
| **OpenAI** | No | **Yes** |
| **xAI (Grok)** | No | **Yes** |
| **DeepSeek** | No | **Yes** |
| **Gemini** | No | **Yes** |

---

## Option 1: Use OpenRouter (Easiest)

OpenRouter acts as a proxy service that provides browser-compatible access to many providers.

1. Go to [openrouter.ai](https://openrouter.ai)
2. Create an account
3. Get your API key from [openrouter.ai/keys](https://openrouter.ai/keys)
4. Add the key to NeumanOS's OpenRouter provider

**Benefits:** No server setup, access to 200+ models, unified billing, works immediately.

**Models available via OpenRouter:** GPT-4o, Claude 3.5 Sonnet, Llama 3.3 70B, Gemini Pro, Mistral Large, DeepSeek Chat, and many more.

---

## Option 2: Cloudflare Worker

A Cloudflare Worker is a serverless function that runs at the edge. Free tier includes 100,000 requests/day.

### Prerequisites

- Free Cloudflare account
- Wrangler CLI: `npm install -g wrangler`

### Step 1: Create the Worker

```bash
wrangler login
wrangler init ai-proxy
cd ai-proxy
```

### Step 2: Add the Proxy Code

Replace `src/index.js` with:

```javascript
const ALLOWED_ORIGINS = [
  'https://your-domain.com',
  'http://localhost:5173',
  'http://localhost:3000'
];

const PROVIDER_URLS = {
  openai: 'https://api.openai.com',
  deepseek: 'https://api.deepseek.com',
  xai: 'https://api.x.ai',
  gemini: 'https://generativelanguage.googleapis.com'
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return handleCORS(request);
    }

    const url = new URL(request.url);
    const provider = url.searchParams.get('provider');

    if (!provider || !PROVIDER_URLS[provider]) {
      return new Response('Invalid provider', { status: 400 });
    }

    const origin = request.headers.get('Origin');
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return new Response('Forbidden', { status: 403 });
    }

    const targetUrl = PROVIDER_URLS[provider] + url.pathname.replace('/proxy', '');

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers),
        'Host': new URL(PROVIDER_URLS[provider]).host
      },
      body: request.method !== 'GET' ? await request.text() : undefined
    });

    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', origin);
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return newResponse;
  }
};

function handleCORS(request) {
  const origin = request.headers.get('Origin');

  if (!ALLOWED_ORIGINS.includes(origin)) {
    return new Response('Forbidden', { status: 403 });
  }

  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
```

### Step 3: Configure Allowed Origins

Edit the `ALLOWED_ORIGINS` array to include your actual domains.

### Step 4: Deploy

```bash
wrangler deploy
```

You'll get a URL like: `https://ai-proxy.your-subdomain.workers.dev`

---

## Option 3: Self-Hosted Node.js Proxy

For full control, run your own proxy server.

### Prerequisites

- Node.js 18+
- A server (VPS, cloud instance, or local machine)

### Step 1: Create the Project

```bash
mkdir ai-proxy && cd ai-proxy
npm init -y
npm install express cors helmet
```

### Step 2: Create the Server

Create `server.js`:

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());

const allowedOrigins = [
  'https://your-domain.com',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

const PROVIDERS = {
  openai: 'https://api.openai.com',
  deepseek: 'https://api.deepseek.com',
  xai: 'https://api.x.ai',
  gemini: 'https://generativelanguage.googleapis.com'
};

app.all('/proxy/:provider/*', async (req, res) => {
  const { provider } = req.params;
  const baseUrl = PROVIDERS[provider];

  if (!baseUrl) {
    return res.status(400).json({ error: 'Invalid provider' });
  }

  const path = req.params[0];
  const targetUrl = `${baseUrl}/${path}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`AI Proxy running on port ${PORT}`);
});
```

### Step 3: Run the Server

```bash
# Development
node server.js

# Production (use PM2 or similar)
npm install -g pm2
pm2 start server.js --name ai-proxy
```

### Step 4: Deploy

**Railway:** `npm install -g @railway/cli && railway login && railway init && railway up`

**Docker:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

**Manual VPS:** Upload files, install dependencies, run with PM2, set up nginx reverse proxy with SSL.

---

## Security Considerations

### Do

- Restrict origins to your specific domains only
- Use HTTPS in production
- Add rate limiting to prevent abuse
- Log requests and monitor for suspicious activity
- Keep secrets secure (never commit API keys)

### Don't

- Allow all origins (`Access-Control-Allow-Origin: *`)
- Expose your proxy publicly without restrictions
- Store user API keys on the server (keys should stay in browser)
- Skip input validation

### Adding Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests' }
});

app.use('/proxy', limiter);
```

---

## Troubleshooting

### "CORS error" after setting up proxy
Check your proxy is running (`curl https://your-proxy.com/health`), verify your origin is in the allowed list, check browser console for details.

### "502 Bad Gateway"
Verify the target provider is accessible, check your API key, check proxy server logs.

### Requests are slow
Choose a proxy location close to the AI provider. Cloudflare Workers are globally distributed and typically fastest.

---

## Summary

| Option | Difficulty | Cost | Best For |
|--------|-----------|------|----------|
| OpenRouter | Easy | Pay per use | Most users |
| Cloudflare Worker | Medium | Free (100k/day) | Developers |
| Self-hosted | Advanced | Server costs | Full control |

> **Tip:** Start with OpenRouter. Only set up your own proxy if you have specific requirements (compliance, latency, cost optimization).

---

## Related Guides

- **[AI Terminal](./ai-terminal.md)** -- Provider setup and API key instructions
- **[Terminal Complete Guide](./terminal-complete.md)** -- AI Chat and Phantom Shell
- **[Privacy & Security](./privacy-security.md)** -- How your data is protected
