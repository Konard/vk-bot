const { enqueueMessage } = require('../outgoing-messages');
const { DateTime } = require('luxon');

// Configuration - these can be moved to environment variables or config file
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
const MAX_RESPONSE_LENGTH = 500;
const COOLDOWN_HOURS = 0.5; // 30 minutes cooldown between ChatGPT responses
const MAX_HISTORY_MESSAGES = 10; // Number of previous messages to include for context

// Keywords that trigger ChatGPT response - can be customized
const chatGptTriggerKeywords = [
  'chatgpt',
  'чатгпт',
  'chat gpt',
  'openai',
  'ответь как ии',
  'ответь как ai',
  'нейросеть',
  'искусственный интеллект',
  'ai',
  'ии'
];

/**
 * Calls OpenAI ChatGPT API to generate a response
 * @param {string} userMessage - The user's message
 * @param {Array} messageHistory - Previous messages for context
 * @returns {Promise<string>} - ChatGPT response
 */
async function generateChatGptResponse(userMessage, messageHistory = []) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not configured, ChatGPT responses disabled');
    return null;
  }

  try {
    // Prepare conversation history for ChatGPT
    const messages = [
      {
        role: 'system',
        content: 'Ты дружелюбный VK бот. Отвечай кратко и по делу на русском языке. Будь вежливым и помогай пользователям.'
      }
    ];

    // Add recent message history for context (limit to avoid token limits)
    const recentHistory = messageHistory.slice(0, MAX_HISTORY_MESSAGES);
    for (const msg of recentHistory.reverse()) {
      if (msg.text && msg.text.trim()) {
        messages.push({
          role: msg.out ? 'assistant' : 'user',
          content: msg.text.trim()
        });
      }
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: messages,
        max_tokens: 200,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let chatGptResponse = data.choices?.[0]?.message?.content?.trim();

    if (chatGptResponse && chatGptResponse.length > MAX_RESPONSE_LENGTH) {
      chatGptResponse = chatGptResponse.substring(0, MAX_RESPONSE_LENGTH) + '...';
    }

    return chatGptResponse;
  } catch (error) {
    console.error('Error calling ChatGPT API:', error);
    return null;
  }
}

/**
 * Checks if message contains ChatGPT trigger keywords
 * @param {string} text - Message text
 * @returns {boolean}
 */
function containsChatGptKeywords(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return chatGptTriggerKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

const trigger = {
  name: "ChatGptResponseTrigger",
  condition: (context) => {
    // Only respond to messages from users (not outgoing messages)
    if (context.request?.isOutbox || !context?.request?.isFromUser) {
      return false;
    }

    // Only respond in private messages, not in group chats
    if (context.request.peerType !== "user") {
      return false;
    }

    // Check if enough time has passed since last ChatGPT response (cooldown)
    const now = DateTime.now();
    const lastTriggered = context?.state?.triggers?.[trigger.name]?.lastTriggered;
    if (lastTriggered) {
      const lastTriggeredDiff = now.diff(lastTriggered, 'hours').hours;
      if (lastTriggeredDiff < COOLDOWN_HOURS) {
        return false;
      }
    }

    // Check if message contains ChatGPT trigger keywords
    const messageText = context.request.text || '';
    return containsChatGptKeywords(messageText);
  },
  action: async (context) => {
    try {
      const userMessage = context.request.text || '';
      const messageHistory = context?.state?.history || [];

      console.log(`ChatGPT trigger activated for message: "${userMessage}"`);

      const chatGptResponse = await generateChatGptResponse(userMessage, messageHistory);

      if (chatGptResponse) {
        console.log(`ChatGPT response generated: "${chatGptResponse}"`);
        enqueueMessage({
          ...context,
          response: {
            message: chatGptResponse
          }
        });
      } else {
        console.log('Failed to generate ChatGPT response, sending fallback message');
        enqueueMessage({
          ...context,
          response: {
            message: 'Извините, сейчас не могу ответить с помощью ИИ. Попробуйте позже.'
          }
        });
      }
    } catch (error) {
      console.error('Error in ChatGPT trigger action:', error);
      // Send fallback message on error
      enqueueMessage({
        ...context,
        response: {
          message: 'Произошла ошибка при обработке запроса. Попробуйте позже.'
        }
      });
    }
  }
};

module.exports = {
  trigger,
  chatGptTriggerKeywords,
  generateChatGptResponse,
  containsChatGptKeywords
};