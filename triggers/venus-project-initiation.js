const { getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');

// Patterns that might indicate someone is open to discussion or starting a conversation
const conversationStartRegex = /^[^\p{L}]*(что[^\p{L}]+делаешь|чем[^\p{L}]+занимаешься|что[^\p{L}]+нового|расскажи[^\p{L}]+о[^\p{L}]+себе|о[^\p{L}]+чём[^\p{L}]+поговорим|во[^\p{L}]+что|ну[^\p{L}]+рассказывай|что[^\p{L}]+интересного|какие[^\p{L}]+планы|что[^\p{L}]+думаешь|какое[^\p{L}]+мнение|интересно)[^\p{L}]*$/ui;

// Alternative patterns for different conversation openers
const generalQuestionRegex = /^[^\p{L}]*(что[^\p{L}]+знаешь[^\p{L}]+о|слышал[^\p{L}]+ли|известно[^\p{L}]+ли[^\p{L}]+тебе|что[^\p{L}]+скажешь[^\p{L}]+о|как[^\p{L}]+относишься[^\p{L}]+к|мнение[^\p{L}]+о)[^\p{L}]*$/ui;

const questions = [
  "Слышал ли ты о Проекте Венера или Жака Фреско?",
  "Знаешь что-нибудь о Проекте Венера?",
  "А ты слышал о Жаке Фреско и его идеях?",
  "Интересно, знаком ли ты с Проектом Венера?",
  "Что думаешь о Проекте Венера Жака Фреско?",
  "Слышал ли ты о ресурсо-ориентированной экономике?",
];

const trigger = {
  name: "VenusProjectInitiationTrigger",
  condition: (context) => {
    if (!context?.request?.isFromUser) {
      return false;
    }

    // Don't trigger on outgoing messages
    if (context?.request?.isOutbox) {
      return false;
    }

    // Check if we haven't triggered this for this user recently
    const now = new Date();
    const lastTriggered = context?.state?.triggers?.[trigger.name]?.lastTriggered;

    // Only trigger once per day per user
    if (lastTriggered) {
      const daysSinceTriggered = (now - new Date(lastTriggered)) / (1000 * 60 * 60 * 24);
      if (daysSinceTriggered < 1) {
        return false;
      }
    }

    // Check if the conversation history suggests this is a good time to introduce the topic
    const history = context?.state?.history;

    // Trigger conditions:
    // 1. If it's early in the conversation (2-5 messages total)
    // 2. If the user asks a general question or starts a topic
    // 3. If there's a natural conversation flow

    if (history && history.length >= 2 && history.length <= 5) {
      const lastMessage = history[0]?.text || '';

      // Check if the last message is asking what the bot does or general conversation
      if (conversationStartRegex.test(lastMessage) || generalQuestionRegex.test(lastMessage)) {
        return true;
      }

      // Also trigger on general conversational openings after greetings
      const hasRecentGreeting = history.slice(0, 3).some(msg =>
        msg?.text && /привет|здравствуй|добр|салют|ку|хай/ui.test(msg.text)
      );

      if (hasRecentGreeting && lastMessage.length > 10) {
        return true;
      }
    }

    return false;
  },
  action: async (context) => {
    // Mark that we've triggered for this user
    if (!context.state.triggers) {
      context.state.triggers = {};
    }
    if (!context.state.triggers[trigger.name]) {
      context.state.triggers[trigger.name] = {};
    }
    context.state.triggers[trigger.name].lastTriggered = new Date().toISOString();

    enqueueMessage({
      ...context,
      response: {
        message: getRandomElement(questions)
      }
    });
  }
};

module.exports = {
  trigger,
  questions
};