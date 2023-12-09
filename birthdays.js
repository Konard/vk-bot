const { VK } = require('vk-io');
const token = require('fs').readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

async function congratulateFriendsWithBD() {
    const { items } = await vk.api.friends.get({
        fields: ['bdate']
    });

    console.log(items.length);

    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth() + 1;
    
    items.forEach(async (friend) => {
        if (friend.id == 356592893){
          console.log('friend', JSON.stringify(friend, null, 2));
        }
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
    });
}

congratulateFriendsWithBD().catch(console.error);