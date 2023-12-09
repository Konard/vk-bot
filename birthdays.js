const { VK } = require('vk-io');
const token = require('fs').readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

async function congratulateFriendsWithBD() {
  let offset = 0;
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.getMonth() + 1;

  while (true) {
      if (offset >= 10000) {
        break;
      }

      const response = await vk.api.friends.get({
          fields: ['bdate'],
          count: 5000,
          offset,
      });

      console.log('response.items.length', response.items.length);

      if (response.items.length === 0) {
          break;
      }

      for (const friend of response.items) {
          if (friend.bdate) {
              const [day, month] = friend.bdate.split('.');
              if (day == currentDay && month == currentMonth) {
                  console.log('friend.id', friend.id)
                  // await vk.api.messages.send({
                  //     userId: friend.id,
                  //     message: `Happy Birthday, ${friend.first_name}! 🥳`
                  // });
              }
          }
      }

      offset += 5000;
  }
}

congratulateFriendsWithBD().catch(console.error);