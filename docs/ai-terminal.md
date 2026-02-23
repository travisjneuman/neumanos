# AI Terminal

The AI Terminal gives you access to 9 different AI providers with automatic fallback and encrypted key storage. Get help with coding, questions, brainstorming, and more -- powered by your own API keys, running entirely in your browser.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Choosing a Provider](#choosing-a-provider)
- [Understanding Proxy Requirements](#understanding-proxy-requirements)
- [Getting API Keys](#getting-api-keys)
- [Understanding Models](#understanding-models)
- [Using the AI Terminal](#using-the-ai-terminal)
- [Advanced Features](#advanced-features)
- [Encryption & Security](#encryption--security)
- [Tips & Best Practices](#tips--best-practices)
- [Troubleshooting](#troubleshooting)
- [FAQs](#faqs)
- [Related Guides](#related-guides)

---

## Quick Start

### Step 1: Open the AI Terminal

Click the **AI Terminal** button in the bottom-right corner of the screen, or press **Ctrl+Shift+A** / **Cmd+Shift+A**.

### Step 2: Configure a Provider

1. Click the **Settings** button in the terminal header
2. Choose a provider (see recommendations below)
3. Get an API key from the provider's website
4. Enter your API key and click **Save**
5. Click **Test Key** to verify it works
6. Click **Done** to close settings

### Step 3: Start Chatting

Type your question or request and press Enter. The AI responds in real-time.

---

## Choosing a Provider

| Provider | Free Tier | Paid Pricing | Credit Card Required | Best For |
|----------|-----------|--------------|---------------------|----------|
| **OpenRouter** | Many free models | $0.06--$30/1M tokens | No | Most versatile |
| **Groq** | Generous free tier | N/A (free only) | No | Fastest speed |
| **HuggingFace** | True free tier | N/A (free only) | No | Open source |
| **Mistral** | Limited free | $0.25--$2/1M tokens | Yes | European / GDPR |
| **Gemini** | Free tier | $0.075--$1.25/1M tokens | Yes | Large context |
| **OpenAI** | No | $0.15--$15/1M tokens | Yes | GPT-4o, o1 |
| **Anthropic** | No | $1--$15/1M tokens | Yes | Best quality |
| **xAI** | No | ~$5/1M tokens | Yes | Real-time info |
| **DeepSeek** | Limited free | ~$0.14--$2.19/1M tokens | Yes | Cost-effective reasoning |

> **Tip:** Start with OpenRouter or Groq -- both free, no credit card needed.

---

## Understanding Proxy Requirements

You may see a **Proxy Required** badge next to some providers. NeumanOS runs entirely in your browser for privacy -- your API keys never touch our servers. However, some AI providers block direct browser requests due to CORS security policies.

| Provider | Browser Access | Status |
|----------|---------------|--------|
| **OpenRouter** | Direct | Works in browser |
| **Anthropic** | Direct | Works in browser |
| **HuggingFace** | Direct | Works in browser |
| **Groq** | Limited | Usually works |
| **Mistral** | Limited | Usually works |
| **OpenAI** | Blocked | Needs proxy |
| **xAI (Grok)** | Blocked | Needs proxy |
| **DeepSeek** | Blocked | Needs proxy |
| **Gemini** | Blocked | Needs proxy |

### Solutions (Easiest First)

**1. Use OpenRouter (Recommended)** -- Access GPT-4o, Claude, Llama, and 200+ other models with one API key that works directly in the browser. Free tier available.

**2. Use Anthropic for Claude** -- Claude models work directly in the browser. Best quality for writing and analysis.

**3. Set Up Your Own Proxy (Advanced)** -- See [Backend Proxy Setup Guide](./backend-proxy-setup.md).

---

## Getting API Keys

### Free Providers

#### OpenRouter

Access 200+ models (including GPT-4o, Claude, Llama) through one API. Many free models available.

1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign in with Google/GitHub/Email
3. Go to [openrouter.ai/keys](https://openrouter.ai/keys)
4. Click **Create Key**, give it a name
5. Copy the API key (starts with `sk-or-v1-...`)
6. Paste into NeumanOS AI Terminal settings

**Free models:** Llama 3.3 70B, Gemini 2.0 Flash Thinking, Mistral 7B, Qwen 2.5 72B

#### Groq

Fastest AI inference available. 100% free.

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up with Google/Email
3. Click **API Keys** > **Create API Key**
4. Copy the key (starts with `gsk_...`)
5. Paste into NeumanOS settings

**Free models:** Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B, Gemma 2 9B. Rate limits: 30 requests/minute, 14,400/day.

#### HuggingFace

Thousands of open-source models. True free tier.

1. Go to [huggingface.co/join](https://huggingface.co/join)
2. Sign up, verify email
3. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
4. Click **New token** with **Read** permission
5. Copy the token (starts with `hf_...`)
6. Paste into NeumanOS settings

#### Mistral

European AI company, GDPR-friendly.

1. Go to [console.mistral.ai](https://console.mistral.ai)
2. Sign up, verify email
3. Go to [console.mistral.ai/api-keys/](https://console.mistral.ai/api-keys/)
4. Click **Create new key**
5. Copy and paste into NeumanOS settings

### Paid Providers

#### Google Gemini

Massive 1M token context window. Multimodal (text + images).

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with Google account
3. Click **Get API key** > **Create API key**
4. Copy the key (starts with `AIza...`)

#### OpenAI

GPT-4o and o1 models. Requires proxy for browser use -- use OpenRouter instead for easiest access.

1. Go to [platform.openai.com/signup](https://platform.openai.com/signup)
2. Sign up, add payment method
3. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
4. Click **Create new secret key**
5. Copy immediately (can't view again)

#### Anthropic Claude

Best quality responses for writing, analysis, coding. Works directly in browser.

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up, add payment method
3. Go to [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
4. Click **Create Key**
5. Copy the key (starts with `sk-ant-...`)

#### xAI Grok

Unique personality, real-time information access. Requires proxy.

1. Go to [console.x.ai](https://console.x.ai)
2. Sign in with X account
3. Create API Key
4. Copy and paste into NeumanOS settings

#### DeepSeek

Cost-effective reasoning and coding models. Requires proxy for browser use.

1. Go to [platform.deepseek.com](https://platform.deepseek.com)
2. Sign up and verify your account
3. Go to API Keys section
4. Create a new API key
5. Copy and paste into NeumanOS settings

**Models:** DeepSeek-V3 (general purpose), DeepSeek-R1 (reasoning). Known for strong coding performance at low cost.

---

## Understanding Models

### Choosing the Right Model

| Task Type | Best Free Model | Best Paid Model |
|-----------|----------------|-----------------|
| Code Generation | Llama 3.3 70B (OpenRouter) | GPT-4o |
| Code Debugging | Llama 3.3 70B (Groq) | Claude 3.5 Sonnet |
| Writing & Editing | Llama 3.3 70B (OpenRouter) | Claude 3.5 Sonnet |
| Research & Analysis | Qwen 2.5 72B (OpenRouter) | o1 |
| Quick Q&A | Gemini Flash (OpenRouter) | Claude 3.5 Haiku |
| Brainstorming | Mixtral 8x7B (Groq) | GPT-4o |
| Math & Logic | Llama 3.3 70B (Groq) | o1 |
| Multilingual | Qwen 2.5 72B (OpenRouter) | Gemini Pro |
| Long Context | Gemini Flash (free tier) | Gemini Pro |

**Cost-Optimized Strategy:**
1. **Free daily use:** OpenRouter Llama 3.3 70B for everything
2. **Need speed:** Groq Llama 3.3 70B (same model, much faster)
3. **Complex reasoning:** Upgrade to Claude 3.5 Sonnet or o1 only when needed
4. **Huge context:** Use Gemini Flash free tier (1M tokens)

---

## Using the AI Terminal

### Basic Chat

Type your question and press Enter. Examples:

```
What's the difference between React and Vue?

Write a function to validate email addresses in JavaScript

Help me debug this error: "Cannot read property 'map' of undefined"
```

### Multi-Line Input

- Press **Shift+Enter** for a new line
- Press **Enter** alone to send the message

### Clear Chat

Click the trash icon button to clear chat history.

### Streaming Responses

All providers support streaming (except o1 models), so you see responses appear in real-time.

---

## Advanced Features

### Voice Input

Click the microphone icon in the AI Terminal input bar to dictate your message using your browser's built-in speech recognition. Voice input is processed entirely in your browser -- no audio is sent to NeumanOS servers. Supported in Chrome, Edge, and Safari.

### Cross-Module Context

The AI Terminal can see context from your other NeumanOS modules to provide more relevant responses. When enabled, the AI can reference:

- **Notes** -- Your recent notes and their content
- **Tasks** -- Your task board, statuses, and due dates
- **Calendar** -- Upcoming events and schedule
- **Habits** -- Your habit streaks and tracking data

Toggle cross-module context on or off in AI Terminal Settings > Context. When enabled, relevant data is included in your prompt to the AI provider. This data is sent to whichever AI provider you have selected, so only enable it with providers you trust.

### Natural Language Bar

The AI Terminal supports a natural language action bar. Instead of navigating the UI, you can type natural commands like:

- "Create a task called 'Review PR' due Friday"
- "What's on my calendar tomorrow?"
- "Summarize my notes from this week"
- "Start a 25-minute focus session"

The AI interprets your intent and executes the corresponding action within NeumanOS.

### Local AI with Ollama

For fully offline, private AI, you can connect NeumanOS to a local Ollama instance running on your machine. This keeps all AI conversations entirely on your device -- nothing is sent over the network.

1. Install [Ollama](https://ollama.com) on your computer
2. Pull a model (e.g., `ollama pull llama3.1`)
3. Start Ollama (`ollama serve`)
4. In NeumanOS AI Terminal Settings, select **Ollama** as provider
5. Enter the local URL (default: `http://localhost:11434`)

Ollama supports dozens of open-source models including Llama 3, Mistral, CodeLlama, and Phi. All processing happens on your hardware.

### Model Selection

Click the **Model Selector** to browse available models, filter by provider/use case/free/paid, and compare speed, quality, context, and cost.

### Usage Tracking

Click the **Usage Tracker** to see requests per provider, estimated token usage, cost estimates, and time range filters.

### Automatic Fallback

If your primary provider fails (rate limit, quota, network error), the system automatically tries backup providers. You'll see a notification like: "openrouter failed: Rate limit exceeded. Switched to groq."

Fallback order: OpenRouter > Groq > HuggingFace > Mistral > Gemini.

### Provider Information

Each message shows which provider and model was used:

```
[Assistant Response]
12:34 PM -- openrouter -- llama-3.3-70b
```

---

## Encryption & Security

### Password Protection

Your API keys are encrypted with AES-256 encryption.

**First Time Setup:**
1. When you save your first API key, you're prompted to create a password
2. Choose a strong password (minimum 12 characters)
3. Select password expiry (daily, weekly, or monthly)
4. Your password is stored in memory only (never saved to disk)

### How Encryption Works

```
Your API Key
    |
Encrypted with your password (AES-256)
    |
Stored in browser (encrypted)
    |
Decrypted when needed (in memory only)
```

**Your API keys are NEVER:**
- Sent to our servers
- Stored in plaintext
- Shared with anyone

**Your password is NEVER:**
- Stored on disk
- Sent over network
- Recoverable if forgotten

### Backup Considerations

Encrypted keys are NOT included in `.brain` exports by default. To include them: AI Terminal Settings > enable "Export Encrypted Keys." Only do this if you have a strong password and store the file securely.

---

## Tips & Best Practices

### Getting Better Results

- **Be specific:** "Write a React component that fetches data from an API and displays it in a table" rather than "Help with code"
- **Provide context:** Include error messages, mention what you've tried, share relevant code snippets
- **Use the right model:** Quick questions need fast models, complex reasoning needs quality models

### Managing Costs

- Use free providers first -- OpenRouter, Groq, and HuggingFace are excellent
- Monitor usage with the Usage Tracker
- Use cheaper models for simple tasks, quality models only when needed

### Security

1. Use strong passwords (16+ characters with mix of types)
2. Don't share `.brain` files with encrypted keys enabled
3. Rotate API keys every few months
4. Monitor API usage on provider dashboards
5. Set spending limits in provider dashboards when available

---

## Troubleshooting

### "Provider not configured"
Open Settings, find the provider, add your API key, save and test.

### "Invalid API key"
Check key format matches the provider (e.g., OpenRouter starts with `sk-or-v1-`, Groq starts with `gsk_`). Copy/paste carefully, verify key is still active in provider dashboard.

### "Failed to decrypt API key"
Wrong password or corrupted data. Try your password again (check Caps Lock). If needed, clear all encrypted keys in Settings > Security and re-add them.

### "Rate limit exceeded"
Wait for the limit to reset (1 minute to 24 hours depending on provider). Automatic fallback will switch to another provider. Configure multiple providers for redundancy.

### "CORS error" (OpenAI, xAI)
Use OpenRouter instead (accesses same models, works in browser). Or use Anthropic for Claude. See [Backend Proxy Setup Guide](./backend-proxy-setup.md) for advanced options.

### Slow Responses
Switch to a faster model (Groq responds in under 1 second). Clear conversation history (shorter context = faster). Try different provider.

### "Network error" or "Failed to fetch"
Check internet connection, check provider status pages, disable VPN temporarily, try different browser.

---

## FAQs

**Is my data private?** Yes. Chat history is stored locally in your browser. API keys are encrypted. No cloud storage, no server tracking.

**Can I use multiple providers at once?** Yes. Configure as many as you want. The system uses one at a time but automatically falls back if needed.

**What happens if I forget my password?** You'll need to clear your API keys and re-add them with a new password. Chat history is not affected.

**Which provider is best?** For free: OpenRouter (most versatile) or Groq (fastest). For paid: Claude 3.5 Sonnet (best quality) or GPT-4o (most popular).

**Do I need to pay?** No. OpenRouter, Groq, HuggingFace, and Mistral all offer free tiers.

**How much do paid providers cost?** Typically $0.15--$15 per 1 million tokens. Average conversation uses 500--2000 tokens, so you can have hundreds of conversations for $1.

---

## Related Guides

- **[Terminal Complete Guide](./terminal-complete.md)** -- AI Chat and Phantom Shell modes
- **[Backend Proxy Setup](./backend-proxy-setup.md)** -- Set up your own proxy for blocked providers
- **[Privacy & Security](./privacy-security.md)** -- How your data is protected
- **[Keyboard Shortcuts](./keyboard-shortcuts.md)** -- Terminal shortcuts
