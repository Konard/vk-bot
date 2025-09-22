# Neural Network Page Posting Feature

This feature allows the VK bot to automatically post content to VK communities focused on neural networks, AI, and language models.

## Configuration

To use this feature, edit the `neural-network-communities.json` file:

```json
{
  "communities": [
    {
      "id": 123456789,
      "name": "AI Community",
      "description": "Community about artificial intelligence",
      "enabled": true
    },
    {
      "id": 987654321,
      "name": "Neural Networks Group",
      "description": "Group for neural network enthusiasts",
      "enabled": true
    }
  ]
}
```

## How to find VK Community IDs

1. Go to the VK community page
2. Look at the URL: `https://vk.com/club123456789` or `https://vk.com/public123456789`
3. The number after `club` or `public` is the community ID

## Post Content

The bot will randomly select from AI/ML-focused messages that include:
- Information about neural networks and language models
- Links to GPT bot services
- Invitations for collaboration in AI field
- Contact information for discussions

## Posting Schedule

- Posts are sent every 15 minutes (configurable in `index.js`)
- The bot checks for existing posts to avoid duplicates
- Previous posts are automatically cleaned up

## Error Handling

The bot handles various VK API errors:
- Access denied (community walls disabled)
- Rate limiting (automatic delays)
- Captcha requirements
- Advertisement posting limits

Communities that encounter errors are temporarily disabled and retried after 24 hours.

## Testing

Run the tests with:
```bash
npm test __tests__/triggers/neural-network-page-posts.test.js
```

## Manual Configuration

If you need to add communities manually, edit the `neuralNetworkCommunities` array in `triggers/neural-network-page-posts.js`.