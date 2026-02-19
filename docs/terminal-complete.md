# Terminal Complete Guide

The NeumanOS Terminal is a versatile tool with two modes: **AI Chat** for conversing with AI models and **Phantom Shell** for running development commands -- all running entirely in your browser.

---

## Table of Contents

- [Quick Start](#quick-start)
- [AI Chat Mode](#ai-chat-mode)
- [Phantom Shell Mode](#phantom-shell-mode)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Troubleshooting](#troubleshooting)
- [Glossary](#glossary)
- [Related Guides](#related-guides)

---

## Quick Start

### What is the Terminal?

| Mode | Purpose | Best For |
|------|---------|----------|
| **AI Chat** | Converse with AI models | Questions, brainstorming, coding help |
| **Phantom Shell** | Run development commands | npm, node, building projects |

### Opening the Terminal

- **Keyboard:** Press `Ctrl+Shift+A` (Windows/Linux) or `Cmd+Shift+A` (Mac)
- **Click:** The terminal icon in the bottom panel

### Your First AI Conversation

1. Open the terminal (starts in AI Chat mode)
2. Type your question and press Enter
3. Watch the AI respond in real-time

```
You: What's the best way to center a div in CSS?

AI: There are several modern approaches to center a div:

1. **Flexbox (recommended)**
   .container {
     display: flex;
     justify-content: center;
     align-items: center;
   }
...
```

### Your First Shell Command

1. Click the **Shell** tab or type `/shell` in AI Chat
2. Type `/version` to boot the runtime
3. Try `node -v` to see Node.js version

```
phantom:~$ /version
Phantom Shell v1.0.0
WebContainer: Ready
Node.js: v18.x

phantom:~$ node -v
v18.20.2
```

---

## AI Chat Mode

### Supported Providers

NeumanOS supports 9 AI providers. Some work directly in your browser, others require a proxy.

| Provider | Browser Access | Free Tier | Recommendation |
|----------|---------------|-----------|----------------|
| **OpenRouter** | Direct | Yes | Best for beginners -- access 200+ models |
| **HuggingFace** | Direct | Yes | Great free option |
| **Anthropic** | Direct | No | Best quality (Claude) |
| **Groq** | Limited | Yes | Fastest responses |
| **Mistral** | Limited | Yes | European option |
| **Gemini** | Proxy needed | Yes | Google's models |
| **OpenAI** | Proxy needed | No | GPT-4, ChatGPT |
| **xAI** | Proxy needed | No | Grok models |
| **DeepSeek** | Proxy needed | No | Excellent value |

> **Tip:** Providers marked "Proxy needed" block direct browser requests. Use **OpenRouter** to access those models without a proxy, or see the [Backend Proxy Setup Guide](./backend-proxy-setup.md).

### Setting Up API Keys

1. Click the **gear icon** in the terminal header
2. Find your preferred provider
3. Click **Add API Key**
4. Paste your key and click **Save**
5. Click **Test** to verify

| Provider | Key URL | Free Credits |
|----------|---------|--------------|
| OpenRouter | [openrouter.ai/keys](https://openrouter.ai/keys) | $1 free |
| Anthropic | [console.anthropic.com](https://console.anthropic.com/settings/keys) | None |
| OpenAI | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | $5 free (new accounts) |
| Groq | [console.groq.com/keys](https://console.groq.com/keys) | Generous free tier |
| HuggingFace | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) | Free |
| DeepSeek | [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys) | ~$5 free |
| Gemini | [aistudio.google.com](https://aistudio.google.com/app/apikey) | Free tier |

### Choosing the Right Model

- **General Chat:** OpenRouter Llama 3.3 70B (free, fast) or Anthropic Claude 3.5 Sonnet (best quality)
- **Coding:** DeepSeek Coder (excellent, cheap) or Claude 3.5 Sonnet (best overall)
- **Fast Responses:** Groq Llama 3.3 70B (lightning fast)
- **Complex Reasoning:** DeepSeek Reasoner (R1 model) or OpenAI o1 (via OpenRouter)

### Privacy & Security

Your API keys are encrypted with AES-256 before storage, stored only in your browser, never sent to NeumanOS servers, and only sent directly to the AI provider you choose.

---

## Phantom Shell Mode

### What is Phantom Shell?

Phantom Shell is a real development terminal running in your browser. It uses WebContainer technology to run Node.js directly -- no installation needed.

### What Works vs What Doesn't

| Works | Doesn't Work |
|-------|-------------|
| `npm install` | `git clone` |
| `npm run dev` | `docker` |
| `node script.js` | `python` |
| `npx create-react-app` | `ping` |
| `ls`, `cd`, `cat`, `mkdir` | `curl`, `wget` |

Phantom Shell runs Node.js in the browser -- it's not a full operating system. First-time boot takes 2--5 seconds; after that, it's instant.

### Built-in Commands

| Command | Description |
|---------|-------------|
| `/help` | Show all commands |
| `/version` | Boot runtime, show status |
| `/clear` | Clear terminal screen |
| `/history` | Show command history |
| `/projects` | List your projects |
| `/new <name>` | Create new project |
| `/open <name>` | Open a project |
| `/close` | Close current project |
| `/ai <prompt>` | Ask AI for help |

### System Commands

After booting, run standard Node.js commands:

```bash
node -v              # Check Node version
npm init -y          # Create new project
npm install express  # Install packages
node index.js        # Run scripts
npm run dev          # Start dev server
ls -la               # List files
```

### AI-Assisted Commands

Ask the AI to help with commands:

```bash
/ai create a react app with typescript
```

### Live Preview

When you run a dev server (`npm run dev`), a preview pane automatically shows your app with real-time updates. Toggle preview with the split button in the terminal header.

### Projects

```bash
/new my-react-app    # Create project
/open my-react-app   # Open it
/projects            # List all projects
/close               # Close current project
```

Projects persist across sessions.

---

## Keyboard Shortcuts

### Global

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Shift + A` | Toggle terminal |
| `Escape` | Close terminal |

### Terminal

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message / Run command |
| `Up/Down` | Navigate command history |
| `Ctrl + C` | Cancel current input |
| `Ctrl + L` | Clear screen |
| `Ctrl + Shift + F` | Search in terminal |

### AI Chat

| Shortcut | Action |
|----------|--------|
| `Tab` | Switch provider/model |
| `Ctrl + N` | New conversation |

---

## Troubleshooting

### "Proxy Required" -- Can't use OpenAI/xAI/DeepSeek

Use **OpenRouter** instead (it proxies requests for you), use **Anthropic** for Claude, or set up your own proxy ([guide](./backend-proxy-setup.md)).

### "WebContainer not ready"

Run `/version` first to boot the runtime (takes 2--5 seconds).

### "ping/git/docker doesn't work"

Phantom Shell only supports Node.js commands. For git, use an external git client.

### "API key invalid"

Check key format, verify at provider's website, ensure key hasn't expired, check remaining credits/quota.

### "Rate limit exceeded"

Wait a few minutes, switch to a different provider, or upgrade your API plan.

### Terminal is slow or unresponsive

Run `/clear`, refresh the page, check browser console for errors. Supported browsers: Chrome 89+, Firefox 89+, Safari 16.4+.

---

## Glossary

| Term | Definition |
|------|-----------|
| **CORS** | Browser security feature restricting cross-domain requests. Why some providers show "Proxy Required." |
| **WebContainer** | Browser-based Node.js runtime using WebAssembly. Runs real npm/node commands without local installation. |
| **API Key** | Secret string authenticating you with an AI provider. Keep it private. |
| **Streaming** | Real-time delivery of AI responses as they're generated. |
| **Provider** | Company offering AI models through an API (OpenAI, Anthropic, etc.). |
| **Model** | Specific AI system within a provider (GPT-4, Claude 3.5, Llama 3.3, etc.). |
| **Token** | Basic unit AI models use to process text. Roughly 4 characters = 1 token. |
| **Context Window** | How much text an AI model can "remember" in a conversation. |

---

## Related Guides

- **[AI Terminal](./ai-terminal.md)** -- Detailed provider setup and API key instructions
- **[Backend Proxy Setup](./backend-proxy-setup.md)** -- Set up your own proxy server
- **[Keyboard Shortcuts](./keyboard-shortcuts.md)** -- Complete shortcut reference
- **[Privacy & Security](./privacy-security.md)** -- How your data is protected
