const { VK } = require('vk-io');
const token = require('fs').readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

const sourceCommunity = 54530371;

const sex = {
  male: 2
};

async function getOnlineFollowers(groupId) {
    let response = await vk.api.groups.getMembers({ group_id: groupId, sort: "id_desc", fields: ["online", "can_send_friend_request", "can_write_private_message", "can_see_all_posts", "is_friend", "sex", "has_photo", "language", "city"] });
    // let friends = await vk.api.friends.get();
    let requests = await vk.api.friends.getRequests({ out: 1 });
    
    console.log('response.items.length', response.items.length);
    console.log('response.items[0]', response.items[0]);
    // console.log('friends.items.length', friends.items.length);
    console.log('requests.items.length', requests.items.length);

    let onlineFollowers = [], friendIds = [], requestIds = [];

    // friends.items.forEach(item => friendIds.push(item));
    requests.items.forEach(item => requestIds.push(item));

    // {
    //   id: 154,
    //   has_photo: 1,
    //   is_friend: 0,
    //   can_see_all_posts: 0,
    //   can_write_private_message: 0,
    //   can_send_friend_request: 0,
    //   sex: 2,
    //   online: 0,
    //   first_name: 'Elisey',
    //   last_name: 'Zamakhov',
    //   can_access_closed: false,
    //   is_closed: true
    // }

    for(let follower of response.items){
      if (!follower.online) {
        continue;
      }
      if (follower.sex != sex.male) {
        continue;
      }
      if (follower.is_friend) {
        continue;
      }
      if (!follower.has_photo) {
        continue;
      }
      if (!follower.can_see_all_posts) {
        continue;
      }
      if (!follower.can_write_private_message) {
        continue;
      }
      if (!follower.can_send_friend_request) {
        continue;
      }

      console.log('follower', follower);

      // if(!friendIds.includes(follower) && !requestIds.includes(follower)){
      if(!requestIds.includes(follower)) {
          onlineFollowers.push(follower.id);
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
        sendFriendRequest(user)
            .then(response => console.log(`Friend request sent to: ${user}`))
            .catch(err => console.log(err));
    }
}

main();