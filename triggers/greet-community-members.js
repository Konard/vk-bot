const { sleep, second, ms } = require('../utils');
const { trigger: greetingTrigger } = require('./greeting');

const sourceCommunityId = 54530371;

async function getCommunityMembers(context, groupId) {
  const response = await context.vk.api.groups.getMembers({
    group_id: groupId,
    sort: "id_desc",
    fields: ["online", "can_send_friend_request", "can_write_private_message", "can_see_all_posts", "is_friend", "sex", "has_photo", "language", "city"],
    offset: 0,
    count: 1000
  });

  return response.items.filter(member =>
    member.can_write_private_message &&
    !member.is_friend &&
    !member.is_closed &&
    member.can_access_closed !== false
  );
}

async function greetCommunityMembers(context) {
  let greetedMembers = 0;
  const maxGreetings = context?.options?.maxGreetings || 50;

  console.log(`Starting to greet community members from community ${sourceCommunityId}`);

  try {
    const communityMembers = await getCommunityMembers(context, sourceCommunityId);
    console.log(`Found ${communityMembers.length} community members that can receive messages`);

    for (const member of communityMembers) {
      if (greetedMembers >= maxGreetings) {
        console.log(`Greeting limit reached: ${maxGreetings}`);
        break;
      }

      try {
        await greetingTrigger.action({
          vk: context.vk,
          response: {
            user_id: member.id,
          }
        });

        greetedMembers++;
        console.log(`Greeting ${greetedMembers}/${maxGreetings} sent to community member ${member.id}`);

        // Sleep between messages to avoid rate limiting
        await sleep((30 * second) / ms);

      } catch (error) {
        console.error(`Failed to send greeting to member ${member.id}:`, error);
        continue;
      }
    }

    console.log(`Completed greeting ${greetedMembers} community members`);

  } catch (error) {
    console.error('Error getting community members:', error);
  }
}

const trigger = {
  name: "GreetCommunityMembers",
  action: async (context) => {
    return await greetCommunityMembers(context);
  }
};

module.exports = {
  trigger
};