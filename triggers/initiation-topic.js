const { getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');
const { DateTime } = require('luxon');

const initiationTopicQuestions = [
  "Do you have a dream?",
  "У тебя есть мечта?",
];

const trigger = {
  name: "InitiationTopicTrigger",
  condition: (context) => {
    // Only trigger for user conversations, not groups
    if (context.request.peerType !== "user") {
      return false;
    }

    // Don't trigger on outgoing messages
    if (context?.request?.isOutbox) {
      return false;
    }

    const now = DateTime.now();
    const lastTriggered = context?.state?.triggers?.[trigger.name]?.lastTriggered;

    // Calculate how many days since this trigger was last executed for this peer
    const lastTriggeredDiff = lastTriggered ? now.diff(lastTriggered, 'days').days : Number.MAX_SAFE_INTEGER;

    // Only trigger once per week (7 days) per user to avoid being too pushy
    if (lastTriggeredDiff < 7) {
      return false;
    }

    // Check if we have enough conversation history to determine if this is appropriate
    const history = context?.state?.history || [];

    // Only trigger if we have had some previous conversation (at least 5 messages exchanged)
    if (history.length < 5) {
      return false;
    }

    // Count recent messages (last 3 days) to see if conversation is active
    const threeDaysAgo = now.minus({ days: 3 });
    const recentMessages = history.filter(msg => {
      const msgDate = DateTime.fromSeconds(msg.date);
      return msgDate > threeDaysAgo;
    });

    // Only trigger if there has been some recent activity (at least 2 messages in last 3 days)
    // but not too much (less than 10 messages to avoid interrupting active conversation)
    const recentMessageCount = recentMessages.length;
    if (recentMessageCount < 2 || recentMessageCount > 10) {
      return false;
    }

    // Check if we recently asked about dreams or similar topics
    const dreamRelatedKeywords = ['мечта', 'dream', 'цель', 'goal', 'желание', 'wish', 'хочу', 'want'];
    const recentText = recentMessages
      .map(msg => msg.text || '')
      .join(' ')
      .toLowerCase();

    const hasDreamTopic = dreamRelatedKeywords.some(keyword => recentText.includes(keyword));
    if (hasDreamTopic) {
      return false;
    }

    // Random chance to trigger (30% chance when all conditions are met)
    // This prevents the bot from being too predictable
    return Math.random() < 0.3;
  },
  action: async (context) => {
    return enqueueMessage({
      ...context,
      response: {
        message: getRandomElement(initiationTopicQuestions)
      }
    });
  }
};

module.exports = {
  trigger,
  initiationTopicQuestions
};