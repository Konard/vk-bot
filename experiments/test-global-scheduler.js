const { GlobalScheduler } = require('../global-scheduler');

const mockTrigger = {
  name: "TestTrigger",
  action: async (context) => {
    console.log('Mock trigger executed with context:', context.testData);
  }
};

const scheduler = new GlobalScheduler();

scheduler.addScheduledAction('TestAction', mockTrigger, 2000, { testData: 'Hello World' });

console.log('Starting scheduler for 10 seconds...');
scheduler.start({ testContext: true });

setTimeout(() => {
  console.log('\nStopping scheduler...');
  scheduler.stop();
  scheduler.printStats();
}, 10000);