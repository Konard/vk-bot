[![Gitpod](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/konard/vk-bot)

# vk-bot
vk-bot

PLEASE DO NOT TRUST THIS SOFTWARE: READ THE CODE

## Install dependencies

```bash
npm ci
```

## Token

To make bot work you should get Kate Mobile token like this:

https://oauth.vk.com/authorize?client_id=2685278&scope=1073737727&redirect_uri=https://oauth.vk.com/blank.html&display=page&response_type=token&revoke=1

And put the token or link (after redirect) into `token` file near `index.js` file.

## CLI Usage

The bot now includes a command-line interface for easy access to all functionality:

### Install globally

```bash
npm install -g .
```

Then you can use the `vk-bot` command from anywhere.

### Available Commands

- `vk-bot start` - Start the VK bot listener
- `vk-bot greet-friends <count>` - Greet friends with automatic messages
- `vk-bot accept-suggestions <count>` - Accept friend suggestions automatically
- `vk-bot delete-requests <count>` - Delete outgoing friend requests
- `vk-bot add-friends <count>` - Add friends from community members
- `vk-bot convert-messages <friend-id>` - Convert messages to markdown format
- `vk-bot load-messages <friend-id>` - Load messages for a specific friend
- `vk-bot ask-links <count>` - Ask friends about links theory
- `vk-bot ask-music <count>` - Ask friends about music preferences
- `vk-bot help-friends <count>` - Ask friends how you can help them
- `vk-bot reject-deactivated` - Reject friend requests from deactivated accounts
- `vk-bot send-invitations` - Send invitation posts

### Cache Management

- `vk-bot cache friends` - Update friends cache
- `vk-bot cache conversations` - Update friends conversations cache
- `vk-bot cache count` - Update friends count cache
- `vk-bot cache messages` - Update messages cache
- `vk-bot cache functions` - Update functions cache

### Sticker Management

- `vk-bot stickers filter` - Filter stickers
- `vk-bot stickers load` - Load usable sticker packs
- `vk-bot stickers list` - List stickers

### Examples

```bash
# Greet up to 5 friends ordered by total friends count
vk-bot greet-friends 5 --order-by total-friends

# Accept up to 10 friend suggestions
vk-bot accept-suggestions 10

# Convert messages for a specific friend to markdown
vk-bot convert-messages 12345678

# Update friends cache
vk-bot cache friends
```

### Local Development

You can also run commands locally without global installation:

```bash
node bin/cli.js <command>
```

## Run

```bash
node index.js 2>&1 | tee log.txt
```

Or using the CLI:

```bash
vk-bot start 2>&1 | tee log.txt
```

## Check logs for errors

```bash
grep -Ei 'error|fail' log.txt
```

```bash
grep -Ei -B10 -A30 'error|fail' log.txt
```


