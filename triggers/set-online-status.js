async function setOnlineStatus({ vk }) {
  try {
    await vk.api.account.setOnline();
    console.log('Online status is set');
  } catch (error) {
    if (error.name === 'AbortError' || error.type === 'aborted') {
      console.log('Could not set online status: Request timed out (AbortError). This is usually temporary and will retry on next interval.');
    } else {
      console.error('Could not set online status:', error);
    }
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