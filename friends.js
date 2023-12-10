const { VK } = require('vk-io');
const token = require('fs').readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

const sourceCommunity = 54530371;

async function getOnlineFollowers(groupId) {
    let response = await vk.api.groups.getMembers({ group_id: groupId,  });
    let friends = await vk.api.friends.get();
    let requests = await vk.api.friends.getRequests({ out: 1 });
    
    console.log(response.items.length);
    console.log(friends.items.length);
    console.log(requests.items.length);

    let onlineFollowers = [], friendIds = [], requestIds = [];

    friends.items.forEach(item => friendIds.push(item));
    requests.items.forEach(item => requestIds.push(item));

    for(let follower of response.items){
        if(!friendIds.includes(follower) && !requestIds.includes(follower)){
            onlineFollowers.push(follower);
        }
    }

    return onlineFollowers;
}

async function sendFriendRequest(userId) {
    return vk.api.friends.add({ user_id: userId });
}

async function main() {
    let onlineFollowers = await getOnlineFollowers(sourceCommunity);

    for(let user of onlineFollowers) {
      console.log(`Friend request will be sent to: ${user}`);
        // sendFriendRequest(user)
        //     .then(response => console.log(`Friend request sent to: ${user}`))
        //     .catch(err => console.log(err));
    }
}

main();