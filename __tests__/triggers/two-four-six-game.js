const {
  startGameTrigger,
  handleTripleGuessTrigger,
  handleRuleGuessTrigger,
  checkRule,
} = require('../../triggers/two-four-six-game');
const { enqueueMessage } = require('../../outgoing-messages');
jest.mock('../../outgoing-messages');

describe('2-4-6 game triggers', () => {
  beforeEach(() => {
    enqueueMessage.mockClear();
  });

  describe('startGameTrigger', () => {
    test.each([
      ['играть 246'],
      ['играть'],
      ['игра 2 4 6'],
      ['давай игра'],
      ['play 246'],
      ["let's play"],
      ['сыграем'],
    ])('"%s" message starts the game', (incomingMessage) => {
      const context = {
        request: { peerType: 'user', text: incomingMessage },
        state: {}
      };
      expect(startGameTrigger.condition(context)).toBe(true);
      startGameTrigger.action(context);
      expect(enqueueMessage).toHaveBeenCalled();
      expect(context.state.games.twoFourSixGame.active).toBe(true);
    });

    test.each([
      ['привет'],
      ['2 4 6'],
      ['как дела?'],
    ])('"%s" message does not start the game', (incomingMessage) => {
      const context = {
        request: { peerType: 'user', text: incomingMessage },
        state: {}
      };
      expect(startGameTrigger.condition(context)).toBe(false);
    });

    test('does not trigger for outgoing messages', () => {
      const context = {
        request: { peerType: 'user', text: 'играть', isOutbox: true },
        state: {}
      };
      expect(startGameTrigger.condition(context)).toBe(false);
    });
  });

  describe('handleTripleGuessTrigger', () => {
    test.each([
      ['2 4 6', [2, 4, 6], true],
      ['8, 10, 12', [8, 10, 12], true],
      ['-1, 121, 130.5', [-1, 121, 130.5], true],
      ['100 200 300', [100, 200, 300], true],
      ['2 2 3', [2, 2, 3], false],
      ['3 2 1', [3, 2, 1], false],
    ])('"%s" triple is processed correctly', (incomingMessage, triple, shouldMatch) => {
      const context = {
        request: { peerType: 'user', text: incomingMessage },
        state: {
          games: {
            twoFourSixGame: {
              active: true,
              guesses: []
            }
          }
        }
      };
      expect(handleTripleGuessTrigger.condition(context)).toBe(true);
      handleTripleGuessTrigger.action(context);
      expect(enqueueMessage).toHaveBeenCalled();
      const callArg = enqueueMessage.mock.calls[0][0];
      expect(callArg.response.message).toContain(shouldMatch ? '✅' : '❌');
      expect(context.state.games.twoFourSixGame.guesses.length).toBe(1);
      expect(context.state.games.twoFourSixGame.guesses[0].triple).toEqual(triple);
    });

    test('does not trigger when game is not active', () => {
      const context = {
        request: { peerType: 'user', text: '2 4 6' },
        state: {
          games: {
            twoFourSixGame: {
              active: false
            }
          }
        }
      };
      expect(handleTripleGuessTrigger.condition(context)).toBe(false);
    });
  });

  describe('handleRuleGuessTrigger', () => {
    test('accepts correct rule guess with ascending keywords', () => {
      const context = {
        request: { peerType: 'user', text: 'правило: числа в порядке возрастания' },
        state: {
          games: {
            twoFourSixGame: {
              active: true,
              guesses: [],
              ruleGuessesCount: 0
            }
          }
        }
      };
      expect(handleRuleGuessTrigger.condition(context)).toBe(true);
      handleRuleGuessTrigger.action(context);
      expect(enqueueMessage).toHaveBeenCalled();
      const callArg = enqueueMessage.mock.calls[0][0];
      expect(callArg.response.message).toContain('🎉');
      expect(context.state.games.twoFourSixGame.active).toBe(false);
    });

    test('rejects incorrect rule guess', () => {
      const context = {
        request: { peerType: 'user', text: 'правило: четные числа' },
        state: {
          games: {
            twoFourSixGame: {
              active: true,
              guesses: [],
              ruleGuessesCount: 0
            }
          }
        }
      };
      expect(handleRuleGuessTrigger.condition(context)).toBe(true);
      handleRuleGuessTrigger.action(context);
      expect(enqueueMessage).toHaveBeenCalled();
      const callArg = enqueueMessage.mock.calls[0][0];
      expect(callArg.response.message).toContain('❌');
      expect(context.state.games.twoFourSixGame.active).toBe(true);
    });

    test('prevents multiple rule guesses per day', () => {
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 12);

      const context = {
        request: { peerType: 'user', text: 'правило: числа больше' },
        state: {
          games: {
            twoFourSixGame: {
              active: true,
              guesses: [],
              ruleGuessesCount: 1,
              lastRuleGuessDate: yesterday
            }
          }
        }
      };
      expect(handleRuleGuessTrigger.condition(context)).toBe(true);
      handleRuleGuessTrigger.action(context);
      expect(enqueueMessage).toHaveBeenCalled();
      const callArg = enqueueMessage.mock.calls[0][0];
      expect(callArg.response.message).toContain('⏰');
    });

    test('does not trigger for triple guesses', () => {
      const context = {
        request: { peerType: 'user', text: '2 4 6' },
        state: {
          games: {
            twoFourSixGame: {
              active: true,
              guesses: []
            }
          }
        }
      };
      expect(handleRuleGuessTrigger.condition(context)).toBe(false);
    });
  });

  describe('checkRule', () => {
    test.each([
      [2, 4, 6, true],
      [8, 10, 12, true],
      [-1, 121, 130.5, true],
      [1, 2, 3, true],
      [0, 0.5, 1, true],
      [2, 2, 3, false],
      [3, 2, 1, false],
      [6, 4, 2, false],
      [1, 1, 1, false],
      [5, 3, 7, false],
    ])('checkRule(%d, %d, %d) returns %s', (a, b, c, expected) => {
      expect(checkRule(a, b, c)).toBe(expected);
    });
  });
});
