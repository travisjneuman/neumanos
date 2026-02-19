/**
 * AI Terminal Service
 * Handles communication with Google Gemini API
 */

import { GoogleGenerativeAI, type Content } from '@google/generative-ai';
import type { Message } from '../stores/useTerminalStore';

const SYSTEM_PROMPT = `You are an AI assistant integrated into NeumanOS, a productivity web application. You help users with:

1. **General Questions**: Answer questions on any topic
2. **Code Generation**: Generate React/TypeScript/JavaScript code snippets
3. **Code Explanation**: Explain code and debug errors
4. **Terminal Commands**: Explain shell commands and their usage
5. **Productivity**: Help with task management, planning, note-taking

**Guidelines:**
- Be concise and helpful
- Format code with markdown code blocks
- For complex code, explain what it does
- If user asks for terminal commands, explain them clearly
- Always consider the context of a web-based productivity app

**Current Context:**
- App: NeumanOS (React + TypeScript + Tailwind CSS)
- Features: Dashboard widgets, Tasks (Kanban), Calendar, Notes, Planning
- Storage: IndexedDB (local-first, privacy-focused)
`;

export class AITerminalService {
  private genAI: GoogleGenerativeAI | null = null;
  private apiKey: string | null = null;

  setApiKey(key: string) {
    this.apiKey = key;
    this.genAI = new GoogleGenerativeAI(key);
  }

  isConfigured(): boolean {
    return !!this.apiKey && !!this.genAI;
  }

  /**
   * Convert our Message format to Gemini's Content format
   */
  private messagesToHistory(messages: Message[]): Content[] {
    return messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));
  }

  /**
   * Send a message and get a response
   */
  async sendMessage(
    userMessage: string,
    chatHistory: Message[],
    model: 'gemini-1.5-flash' | 'gemini-1.5-pro' = 'gemini-1.5-flash',
    onChunk?: (text: string) => void
  ): Promise<string> {
    if (!this.genAI) {
      throw new Error('API key not configured. Please add your Google AI API key in Settings.');
    }

    try {
      const genModel = this.genAI.getGenerativeModel({ model });

      // Convert chat history to Gemini format
      const history = this.messagesToHistory(chatHistory);

      // Start chat with history
      const chat = genModel.startChat({
        history,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
        systemInstruction: SYSTEM_PROMPT,
      });

      // Stream response if callback provided
      if (onChunk) {
        const result = await chat.sendMessageStream(userMessage);
        let fullText = '';

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
          onChunk(chunkText);
        }

        return fullText;
      } else {
        // Non-streaming response
        const result = await chat.sendMessage(userMessage);
        return result.response.text();
      }
    } catch (error: any) {
      if (error?.message?.includes('API_KEY_INVALID')) {
        throw new Error('Invalid API key. Please check your Google AI API key in Settings.');
      } else if (error?.message?.includes('RATE_LIMIT_EXCEEDED')) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (error?.message?.includes('QUOTA_EXCEEDED')) {
        throw new Error('Quota exceeded. Please check your API usage or upgrade your plan.');
      } else {
        throw new Error(`AI Error: ${error?.message || 'Unknown error occurred'}`);
      }
    }
  }

  /**
   * Generate code with specific instructions
   */
  async generateCode(
    description: string,
    language: string = 'typescript'
  ): Promise<string> {
    if (!this.genAI) {
      throw new Error('API key not configured');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Generate ${language} code for the following:

${description}

Return ONLY the code with proper formatting. Include brief comments for complex parts.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Explain code
   */
  async explainCode(code: string, language?: string): Promise<string> {
    if (!this.genAI) {
      throw new Error('API key not configured');
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Explain this ${language || 'code'} in simple terms:

\`\`\`${language || ''}
${code}
\`\`\`

Provide a clear, concise explanation of what it does and how it works.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}

// Singleton instance
export const aiTerminalService = new AITerminalService();
