const { DateTime } = require('luxon');
const { executeTrigger, second, minute, ms } = require('./utils');

class GlobalScheduler {
  constructor() {
    this.scheduledActions = [];
    this.intervals = new Map();
    this.executionStats = new Map();
  }

  addScheduledAction(name, trigger, interval, options = {}) {
    const action = {
      name,
      trigger,
      interval,
      options,
      lastExecuted: null,
      executionCount: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0
    };

    this.scheduledActions.push(action);
    this.executionStats.set(name, action);

    console.log(`Scheduled action '${name}' added with interval ${interval}ms`);
    return action;
  }

  start(context) {
    console.log('Starting Global Scheduler with', this.scheduledActions.length, 'scheduled actions');

    for (const action of this.scheduledActions) {
      this.startAction(action, context);
    }
  }

  startAction(action, context) {
    const intervalId = setInterval(async () => {
      await this.executeAction(action, context);
    }, action.interval);

    this.intervals.set(action.name, intervalId);
    console.log(`Started '${action.name}' with interval ${action.interval}ms`);
  }

  async executeAction(action, context) {
    const startTime = DateTime.now();
    const startMs = new Date();

    console.log(`[GlobalScheduler] Executing '${action.name}'...`);

    try {
      const actionContext = { ...context, ...action.options };

      if (action.options?.customAction) {
        await action.options.customAction();
      } else if (action.trigger) {
        await executeTrigger(action.trigger, actionContext);
      } else {
        console.warn(`No trigger or custom action defined for action '${action.name}'`);
        return;
      }

      const executionTime = new Date() - startMs;
      action.lastExecuted = startTime;
      action.executionCount++;
      action.totalExecutionTime += executionTime;
      action.averageExecutionTime = action.totalExecutionTime / action.executionCount;

      console.log(`[GlobalScheduler] '${action.name}' completed in ${executionTime}ms (avg: ${action.averageExecutionTime.toFixed(2)}ms, count: ${action.executionCount})`);

    } catch (error) {
      console.error(`[GlobalScheduler] Error executing '${action.name}':`, error);
    }
  }

  stop() {
    console.log('Stopping Global Scheduler...');

    for (const [actionName, intervalId] of this.intervals) {
      clearInterval(intervalId);
      console.log(`Stopped '${actionName}'`);
    }

    this.intervals.clear();
  }

  getStats() {
    const stats = [];
    for (const [name, action] of this.executionStats) {
      stats.push({
        name: action.name,
        interval: action.interval,
        executionCount: action.executionCount,
        totalExecutionTime: action.totalExecutionTime,
        averageExecutionTime: action.averageExecutionTime,
        lastExecuted: action.lastExecuted?.toISO() || 'Never'
      });
    }
    return stats;
  }

  printStats() {
    console.log('\n=== Global Scheduler Statistics ===');
    const stats = this.getStats();

    for (const stat of stats) {
      console.log(`${stat.name}:`);
      console.log(`  Interval: ${stat.interval}ms`);
      console.log(`  Executions: ${stat.executionCount}`);
      console.log(`  Total time: ${stat.totalExecutionTime}ms`);
      console.log(`  Average time: ${stat.averageExecutionTime.toFixed(2)}ms`);
      console.log(`  Last executed: ${stat.lastExecuted}`);
      console.log('');
    }
  }
}

module.exports = { GlobalScheduler };