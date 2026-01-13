# ChatGPT Integration

This VK bot now supports ChatGPT integration to provide AI-powered responses to user messages.

## Setup

1. **Get OpenAI API Key**
   - Sign up at [OpenAI](https://platform.openai.com)
   - Generate an API key from your account dashboard

2. **Configure Environment Variables**
   ```bash
   export OPENAI_API_KEY="your-openai-api-key-here"
   export OPENAI_MODEL="gpt-3.5-turbo"  # Optional, defaults to gpt-3.5-turbo
   ```

## How It Works

### Trigger Conditions
The ChatGPT trigger activates when:
- Message is from a user (not outgoing)
- Message is in a private conversation (not group chat)
- Message contains ChatGPT keywords (case-insensitive):
  - `chatgpt`, `чатгпт`, `chat gpt`
  - `openai`
  - `ответь как ии`, `ответь как ai`
  - `нейросеть`
  - `искусственный интеллект`
  - `ai`, `ии`
- At least 30 minutes have passed since the last ChatGPT response (cooldown)

### Features
- **Context Awareness**: Includes up to 10 previous messages for context
- **Response Limiting**: Responses are limited to 500 characters
- **Fallback Handling**: Graceful error handling with user-friendly messages
- **Russian Language**: Optimized for Russian language conversations

### Configuration Options
- `OPENAI_MODEL`: OpenAI model to use (default: "gpt-3.5-turbo")
- `MAX_RESPONSE_LENGTH`: Maximum response length (500 characters)
- `COOLDOWN_HOURS`: Time between ChatGPT responses (0.5 hours = 30 minutes)
- `MAX_HISTORY_MESSAGES`: Number of previous messages to include (10 messages)

## Example Usage

**User:** `Привет ChatGPT, как дела?`
**Bot:** `Привет! У меня всё отлично, спасибо! Как у тебя дела? Чем могу помочь?`

**User:** `ответь как ИИ: что такое машинное обучение?`
**Bot:** `Машинное обучение - это метод искусственного интеллекта, при котором компьютеры учатся выполнять задачи, анализируя данные и выявляя закономерности, без явного программирования каждого шага.`

## Error Handling

If the OpenAI API is unavailable or not configured, the bot will respond with:
`Извините, сейчас не могу ответить с помощью ИИ. Попробуйте позже.`

## Testing

Run the tests to verify the integration:
```bash
npm test -- __tests__/triggers/chatgpt-response.js
```

## Customization

You can modify the trigger keywords, system prompt, and other settings by editing the `triggers/chatgpt-response.js` file.