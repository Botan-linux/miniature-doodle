# Terminal Chat

## Render.com Deploy

Build Command: `npm run build`
Start Command: `npm start`

## URLs

- `/` - 404 (hidden)
- `/c/app` - Chat interface
- `/c/users` - User list
- `/api/x` - API endpoint

## curl Usage

```bash
# Who am I?
curl SITE/api/x?action=whoami

# Send message
curl -X POST SITE/api/x -H "Content-Type: application/json" -d '{"content":"hello"}'

# Get messages
curl SITE/api/x?action=messages

# Get users
curl SITE/api/x?action=users
```

## Features

- IP-based permanent username
- No duplicate usernames
- 500 message history
- Real-time polling
