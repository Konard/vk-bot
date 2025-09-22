async function withRetry(apiCall, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      // Check if this is a VK API error code 10 (Internal server error)
      const isRetriableError = error.code === 10;

      if (!isRetriableError || attempt === maxRetries) {
        throw error;
      }

      // Calculate exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`API call failed with error code ${error.code} (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${Math.round(delay)}ms...`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function setOnlineStatus({ vk }) {
  try {
    await withRetry(async () => {
      await vk.api.account.setOnline();
    });
    console.log('Online status is set');
  } catch (error) {
    console.log('Could not set online status', error);
  }
}

const trigger = {
  name: "SetOnlineStatus",
  action: async (context) => {
    return await setOnlineStatus(context);
  }
};

module.exports = {
  trigger
};