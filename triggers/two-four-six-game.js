const { enqueueMessage } = require('../outgoing-messages');

// Regex to detect game start commands in Russian and English
const startGameRegex = /^[^\p{L}]*(играть|игра|сыграем|давай[^\p{L}]+игра|play|game|let'?s[^\p{L}]+play)[^\p{L}]*(2[^\p{L}]*4[^\p{L}]*6|246)?[^\p{L}]*$/ui;

// Regex to detect number triples (three numbers separated by spaces, commas, or other non-letter characters)
const tripleRegex = /^[^\p{L}\d-]*(-?\d+(?:\.\d+)?)[^\p{L}\d-]+(-?\d+(?:\.\d+)?)[^\p{L}\d-]+(-?\d+(?:\.\d+)?)[^\p{L}\d-]*$/u;

// Regex to detect rule guesses - phrases indicating the user is guessing the rule
const ruleGuessRegex = /^[^\p{L}]*(правило|правила|я[^\p{L}]+знаю|понял|понятно|rule|i[^\p{L}]+know|got[^\p{L}]+it|understand)[^\p{L}]*[:;]?[^\p{L}]*/ui;

/**
 * The actual rule for the 2-4-6 game: numbers must be in ascending order
 */
function checkRule(a, b, c) {
  return a < b && b < c;
}

/**
 * Trigger for starting a new 2-4-6 game
 */
const startGameTrigger = {
  name: "TwoFourSixGameStartTrigger",
  condition: (context) => {
    if (context.request.peerType !== "user") {
      return false;
    }
    if (context?.request?.isOutbox) {
      return false;
    }

    // Check if user wants to start the game
    const text = context.request.text || '';
    return startGameRegex.test(text);
  },
  action: async (context) => {
    // Initialize game state
    if (!context.state) {
      context.state = {};
    }
    if (!context.state.games) {
      context.state.games = {};
    }

    context.state.games.twoFourSixGame = {
      active: true,
      guesses: [],
      ruleGuessesCount: 0,
      lastRuleGuessDate: null,
    };

    const welcomeMessages = [
      {
        ru: "Давайте сыграем в игру 2-4-6! 🎮\n\nПравила:\n• Я загадал правило для троек чисел\n• Тройка 2, 4, 6 подходит под это правило\n• Предлагайте свои тройки чисел, я скажу, подходят ли они\n• Когда будете уверены, что знаете правило — напишите его\n• У вас есть одна попытка угадать правило в день\n\nПредложите первую тройку чисел!",
        en: "Let's play the 2-4-6 game! 🎮\n\nRules:\n• I have a secret rule for number triples\n• The triple 2, 4, 6 follows this rule\n• Suggest your triples, I'll tell you if they fit\n• When you're confident you know the rule — write it\n• You have one rule guess per day\n\nSuggest your first triple!"
      }
    ];

    // Use Russian for this bot
    const message = welcomeMessages[0].ru;

    enqueueMessage({
      ...context,
      response: {
        message: message
      }
    });
  }
};

/**
 * Trigger for handling number triple guesses during an active game
 */
const handleTripleGuessTrigger = {
  name: "TwoFourSixGameTripleGuessTrigger",
  condition: (context) => {
    if (context.request.peerType !== "user") {
      return false;
    }
    if (context?.request?.isOutbox) {
      return false;
    }

    // Check if game is active
    const gameState = context?.state?.games?.twoFourSixGame;
    if (!gameState || !gameState.active) {
      return false;
    }

    // Check if message contains a triple
    const text = context.request.text || '';
    return tripleRegex.test(text);
  },
  action: async (context) => {
    const text = context.request.text || '';
    const match = text.match(tripleRegex);

    if (!match) {
      return;
    }

    const a = parseFloat(match[1]);
    const b = parseFloat(match[2]);
    const c = parseFloat(match[3]);

    // Check if the triple follows the rule
    const followsRule = checkRule(a, b, c);

    // Store the guess
    const gameState = context.state.games.twoFourSixGame;
    gameState.guesses.push({
      triple: [a, b, c],
      followsRule: followsRule,
      timestamp: new Date()
    });

    // Generate response
    let response;
    if (followsRule) {
      const positiveResponses = [
        `✅ Да! Тройка ${a}, ${b}, ${c} подходит под правило.`,
        `✅ Верно! ${a}, ${b}, ${c} следует правилу.`,
        `✅ Правильно! Эта тройка подходит.`,
      ];
      response = positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
    } else {
      const negativeResponses = [
        `❌ Нет. Тройка ${a}, ${b}, ${c} не подходит под правило.`,
        `❌ К сожалению, ${a}, ${b}, ${c} не следует правилу.`,
        `❌ Неверно. Эта тройка не подходит.`,
      ];
      response = negativeResponses[Math.floor(Math.random() * negativeResponses.length)];
    }

    response += '\n\nПродолжайте предлагать тройки или попробуйте угадать правило!';

    enqueueMessage({
      ...context,
      response: {
        message: response
      }
    });
  }
};

/**
 * Trigger for handling rule guesses
 */
const handleRuleGuessTrigger = {
  name: "TwoFourSixGameRuleGuessTrigger",
  condition: (context) => {
    if (context.request.peerType !== "user") {
      return false;
    }
    if (context?.request?.isOutbox) {
      return false;
    }

    // Check if game is active
    const gameState = context?.state?.games?.twoFourSixGame;
    if (!gameState || !gameState.active) {
      return false;
    }

    // Check if message looks like a rule guess (not just a triple)
    const text = context.request.text || '';

    // If it's a triple, let the triple handler deal with it
    if (tripleRegex.test(text)) {
      return false;
    }

    // Check if it contains rule-related keywords or is a longer message (likely explaining a rule)
    return ruleGuessRegex.test(text) || text.length > 30;
  },
  action: async (context) => {
    const gameState = context.state.games.twoFourSixGame;
    const now = new Date();

    // Check if user already guessed today
    if (gameState.lastRuleGuessDate) {
      const lastGuessDate = new Date(gameState.lastRuleGuessDate);
      const hoursSinceLastGuess = (now - lastGuessDate) / (1000 * 60 * 60);

      if (hoursSinceLastGuess < 24) {
        const hoursRemaining = Math.ceil(24 - hoursSinceLastGuess);
        enqueueMessage({
          ...context,
          response: {
            message: `⏰ Вы уже пытались угадать правило сегодня!\n\nСледующая попытка будет доступна через ${hoursRemaining} ч.\n\nА пока продолжайте проверять тройки чисел, чтобы лучше понять закономерность! 🔍`
          }
        });
        return;
      }
    }

    // User is allowed to guess
    gameState.ruleGuessesCount++;
    gameState.lastRuleGuessDate = now;

    const text = context.request.text || '';
    const textLower = text.toLowerCase();

    // Check if the guess is correct (look for keywords related to ascending order)
    const correctKeywords = [
      'возраст', 'больше', 'увеличени', 'порядк', 'рост',
      'ascend', 'increas', 'order', 'grow', 'greater', 'bigger', 'larger',
      'меньше', 'средн', 'больш', // smaller, middle, bigger
      'a < b', 'b < c', 'a<b', 'b<c',
    ];

    const hasCorrectKeyword = correctKeywords.some(keyword => textLower.includes(keyword));

    if (hasCorrectKeyword) {
      // Correct guess!
      gameState.active = false;
      enqueueMessage({
        ...context,
        response: {
          message: `🎉 Поздравляю! Вы угадали правило!\n\n✨ Правило: числа должны идти в возрастающем порядке (a < b < c)\n\nЭто означает, что:\n• 2, 4, 6 подходит ✅\n• 8, 10, 12 подходит ✅\n• -1, 121, 130.5 подходит ✅\n• 2, 2, 3 НЕ подходит ❌\n• 3, 2, 1 НЕ подходит ❌\n\nЭта игра учит важному уроку: чтобы по-настоящему понять правило, нужно проверять не только примеры, которые ему следуют, но и те, которые могут его нарушить! 🧠\n\nХотите сыграть еще раз? Просто напишите "играть 246"!`
        }
      });
    } else {
      // Incorrect guess
      enqueueMessage({
        ...context,
        response: {
          message: `❌ К сожалению, это не то правило, которое я загадал.\n\nВы использовали свою попытку на сегодня. Следующую попытку угадать правило можно будет сделать завтра.\n\nНо вы можете продолжать проверять тройки чисел, чтобы лучше понять закономерность! Попробуйте проверить тройки, которые НЕ следуют очевидным паттернам. 🤔`
        }
      });
    }
  }
};

module.exports = {
  startGameTrigger,
  handleTripleGuessTrigger,
  handleRuleGuessTrigger,
  startGameRegex,
  tripleRegex,
  ruleGuessRegex,
  checkRule,
};
