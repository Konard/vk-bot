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

## Check logs for errors

```bash
grep -Ei 'error|fail' log.txt
```

```bash
grep -Ei -B10 -A30 'error|fail' log.txt
```


