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

## Run

```bash
node index.js 2>&1 | tee log.txt
```

## Docker (Recommended for Production)

### Prerequisites
- Docker
- Docker Compose

### Setup
1. Get your VK token as described in the [Token](#token) section
2. Put the token in a `token` file in the project root

### Run with Docker Compose
```bash
# Build and start the bot
docker-compose up -d

# View logs
docker-compose logs -f vk-bot

# Stop the bot
docker-compose down
```

### Run with Docker (Manual)
```bash
# Build the image
docker build -t vk-bot .

# Create logs directory
mkdir -p logs

# Run the container
docker run -d \
  --name vk-bot \
  --restart unless-stopped \
  -v $(pwd)/token:/usr/src/app/token:ro \
  -v $(pwd)/logs:/usr/src/app/logs \
  vk-bot
```

### Docker Benefits
- **Automatic restarts**: The bot will automatically restart if it crashes or if there's a hardware restart
- **Resource limits**: Prevents excessive memory usage
- **Health checks**: Monitors the bot's status
- **Isolated environment**: Runs in a contained environment for better security

## Manual Installation (Development)

### Install dependencies

```bash
npm ci
```

### Run

```bash
node index.js 2>&1 | tee log.txt
```

## Check logs for errors

```bash
grep -Ei 'error|fail' log.txt
```

```bash
grep -Ei -B10 -A30 'error|fail' log.txt
```


