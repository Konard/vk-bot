const { trigger: greetingTrigger } = require('../triggers/greeting');

async function debugGreetingTest() {
  console.log('Testing greeting trigger behavior...\n');

  const context = {
    request: {
      peerType: 'user',
      isFromUser: true,
      text: 'Привет',
      isOutbox: false
    }
  };

  console.log('Context:', JSON.stringify(context, null, 2));

  console.log('\nTesting condition...');
  const conditionResult = greetingTrigger.condition(context);
  console.log('Condition result:', conditionResult);

  if (conditionResult) {
    console.log('\nTesting action...');
    try {
      const actionResult = await greetingTrigger.action(context);
      console.log('Action completed, result:', actionResult);
    } catch (error) {
      console.log('Action error:', error.message);
    }
  } else {
    console.log('Condition failed, action not called');
  }
}

debugGreetingTest().catch(console.error);