const { VK } = require('vk-io');
const token = require('fs').readFileSync('token', 'utf-8').trim();
const vk = new VK({ token });

const requestsLimit = 10000; // Maximum number of requests you expect
const requestsSegmentSize = 1000; // Number of requests fetched per segment

async function fetchRequests(segment, offset) {
  const req = await vk.api.friends.getRequests({ out: 1, count: segment, offset: offset});
  return req || [];
}

async function fetchAllRequests() {
  let requests = [];
  for (let offset = 0; offset < requestsLimit; offset += requestsSegmentSize) {
    const segment = await fetchRequests(requestsSegmentSize, offset);
    requests = requests.concat(segment.items);
    if (segment.items.length < requestsSegmentSize) {
      // Early exit if we fetched less requests than requested: end of data.
      break;
    }
  }
  return requests;
}

fetchAllRequests().then(requests => {
  console.log('Total requests: ', requests.length);
  console.log('Total requests: ', requests);
  //do something with all the requests
});