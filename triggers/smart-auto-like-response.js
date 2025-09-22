const { hasSticker, getRandomElement } = require('../utils');
const { enqueueMessage } = require('../outgoing-messages');

// Regular expressions for detecting like/dislike patterns
const likePatterns = [
  /(мне\s+)?нравится/ui,
  /лайк/ui,
  /круто/ui,
  /супер/ui,
  /класс/ui,
  /отлично/ui,
  /прикольно/ui,
  /зачёт/ui,
  /зачет/ui,
  /кул/ui,
  /cool/ui,
  /(мне\s+)?like/ui,
  /клёво/ui,
  /клево/ui,
  /четко/ui,
  /лойс/ui,
];

const dislikePatterns = [
  /(мне\s+)?не\s+нравится/ui,
  /отстой/ui,
  /плохо/ui,
  /ужасно/ui,
  /дизлайк/ui,
  /диззлайк/ui,
  /негодно/ui,
  /отстойно/ui,
  /фу/ui,
  /бред/ui,
];

// Sticker IDs for positive responses to likes
const positiveResponseStickers = [
  81983, // positive response
  73607, // agree sticker
  60265, // thumbs up
  94465, // cool
];

// Sticker IDs for empathetic responses to dislikes
const empatheticResponseStickers = [
  60308, // understanding
  70,    // sympathy
  60786, // empathy
  73089, // supportive
];

// Sticker IDs for asking questions about likes
const questionResponseStickers = [
  72330, // curious
  89307, // questioning
  66071, // interested
];

// Text responses for likes
const likeResponses = [
  "Да, согласен!",
  "Мне тоже нравится!",
  "Отличный выбор!",
  "Я тебя понимаю)",
  "Классная штука!",
  "Супер!",
];

// Text responses for dislikes
const dislikeResponses = [
  "Понимаю твои чувства",
  "Да, бывает",
  "Не всё может нравиться",
  "У каждого свой вкус",
  "Понятно",
];

// Function to analyze conversation context for smarter responses
function analyzeContext(context) {
  const history = context?.state?.history || [];
  const recentMessages = history.slice(0, 5); // Last 5 messages

  // Count recent bot messages to avoid spam
  const recentBotMessages = recentMessages.filter(msg => msg.out === 1);
  const shouldBeQuiet = recentBotMessages.length >= 2;

  // Check if user seems to be in a negative mood
  const negativeWords = recentMessages.some(msg =>
    msg.text && (
      /плохо|грустно|устал|злой|бесит/ui.test(msg.text)
    )
  );

  // Check if this is about music/media (to be more contextual)
  const isAboutMedia = context?.request?.text && (
    /музык|песн|трек|фильм|видео|фото|картинк/ui.test(context.request.text)
  );

  return {
    shouldBeQuiet,
    negativeWords,
    isAboutMedia,
    recentMessagesCount: recentMessages.length
  };
}

// Function to determine response type based on context
function getSmartResponse(isLike, contextAnalysis) {
  const { shouldBeQuiet, negativeWords, isAboutMedia } = contextAnalysis;

  // If bot has been talking too much recently, be quiet
  if (shouldBeQuiet) {
    return null;
  }

  // If user seems negative and this is a like, be more enthusiastic
  if (isLike && negativeWords) {
    return {
      type: 'text',
      content: getRandomElement(["Здорово, что тебе что-то нравится!", "Отлично!", "Классно!"]),
    };
  }

  // If it's about media, ask follow-up questions sometimes
  if (isAboutMedia && Math.random() < 0.3) {
    if (isLike) {
      return {
        type: 'text',
        content: getRandomElement(["Что именно понравилось?", "Расскажи подробнее!", "Интересно!"]),
      };
    } else {
      return {
        type: 'text',
        content: getRandomElement(["Что не понравилось?", "Почему?", "Понятно"]),
      };
    }
  }

  // Default smart response: mix of stickers and text
  const shouldUseSticker = Math.random() < 0.7; // 70% chance for sticker

  if (shouldUseSticker) {
    return {
      type: 'sticker',
      content: isLike ?
        getRandomElement(positiveResponseStickers) :
        getRandomElement(empatheticResponseStickers),
    };
  } else {
    return {
      type: 'text',
      content: isLike ?
        getRandomElement(likeResponses) :
        getRandomElement(dislikeResponses),
    };
  }
}

const trigger = {
  name: "SmartAutoLikeResponse",
  condition: (context) => {
    if (!context?.request?.isFromUser || context?.request?.isOutbox) {
      return false;
    }

    const text = context?.request?.text;
    if (!text) {
      return false;
    }

    // Check if message contains like or dislike patterns
    const hasLikePattern = likePatterns.some(pattern => pattern.test(text));
    const hasDislikePattern = dislikePatterns.some(pattern => pattern.test(text));

    return hasLikePattern || hasDislikePattern;
  },

  action: (context) => {
    const text = context?.request?.text || '';

    // Determine if it's a like or dislike
    const isLike = likePatterns.some(pattern => pattern.test(text));
    const isDislike = dislikePatterns.some(pattern => pattern.test(text));

    // Analyze conversation context for smarter responses
    const contextAnalysis = analyzeContext(context);

    // If the message has both like and dislike patterns, choose based on order
    let responseType = isLike;
    if (isLike && isDislike) {
      // Find which pattern appears first
      const likeIndex = Math.min(...likePatterns.map(p => {
        const match = text.match(p);
        return match ? match.index : Infinity;
      }).filter(i => i !== Infinity));

      const dislikeIndex = Math.min(...dislikePatterns.map(p => {
        const match = text.match(p);
        return match ? match.index : Infinity;
      }).filter(i => i !== Infinity));

      responseType = likeIndex < dislikeIndex;
    }

    // Get smart response based on context
    const response = getSmartResponse(responseType, contextAnalysis);

    if (!response) {
      return; // Bot decides to stay quiet
    }

    // Enqueue the response
    if (response.type === 'sticker') {
      enqueueMessage({
        ...context,
        response: {
          sticker_id: response.content,
        }
      });
    } else {
      enqueueMessage({
        ...context,
        response: {
          message: response.content,
        }
      });
    }
  }
};

module.exports = {
  trigger,
  likePatterns,
  dislikePatterns,
  positiveResponseStickers,
  empatheticResponseStickers,
};