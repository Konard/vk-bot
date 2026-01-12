const { trigger: askAboutHPMORTrigger } = require('../../triggers/ask-about-hpmor');

const triggerDescription = 'ask about HPMOR trigger';

describe(triggerDescription, () => {
  test('trigger should be properly defined', () => {
    expect(askAboutHPMORTrigger).toBeDefined();
    expect(askAboutHPMORTrigger.name).toBe('AskAboutHPMOR');
    expect(typeof askAboutHPMORTrigger.action).toBe('function');
  });

  test('trigger should have correct name', () => {
    expect(askAboutHPMORTrigger.name).toBe('AskAboutHPMOR');
  });

  test('trigger action should be a function', () => {
    expect(typeof askAboutHPMORTrigger.action).toBe('function');
  });
});