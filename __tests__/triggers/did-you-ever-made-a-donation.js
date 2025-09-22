const { trigger: didYouEverMadeADonationTrigger } = require('../../triggers/did-you-ever-made-a-donation');

const triggerDescription = 'did you ever made a donation trigger';

describe(triggerDescription, () => {
  test('trigger has correct name', () => {
    expect(didYouEverMadeADonationTrigger.name).toBe('DidYouEverMadeADonation');
  });

  test('trigger has action function', () => {
    expect(typeof didYouEverMadeADonationTrigger.action).toBe('function');
  });

  test('trigger action function is async', () => {
    expect(didYouEverMadeADonationTrigger.action.constructor.name).toBe('AsyncFunction');
  });
});