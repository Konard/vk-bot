async function setOnlineStatus({ vk }) {
  try {
    await vk.api.account.setOnline();
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