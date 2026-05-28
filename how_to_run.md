# How to Run tuubaa-twitch Bot in Docker

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed
- A Twitch account for the bot
- The bot must be a **moderator** in your channel (required to delete messages)

---

## 1. Create your `.env` file

Copy `.env.template` to `.env` in the project root and fill in the values:

```env
TWITCH_USERNAME=your_bot_username
TWITCH_OAUTH_TOKEN=oauth:your_oauth_token
TWITCH_CHANNEL=your_channel_name

# Optional: restrict song requests to a specific channel point reward
SONG_REQUEST_REWARD_ID=your_reward_id_here

# External API
BASTIAPI=your_basti_api_key

# Optional: port for the API server (default: 4000)
PORT=4000
```

### Getting your OAuth token
Go to [https://twitchapps.com/tmi/](https://twitchapps.com/tmi/) and authorize with your **bot account**. Copy the token (it starts with `oauth:`).

---

## 2. Build and run with Docker Compose

```bash
docker compose up --build -d
```

This will:
- Build the image from the `DOCKERFILE`
- Start the bot container named `tuubaa-twitch-bot`
- Automatically restart the container unless manually stopped

### Useful commands

| Command | Description |
|---|---|
| `docker compose up --build -d` | Build and start in background |
| `docker compose down` | Stop and remove the container |
| `docker compose logs -f` | Follow live logs |
| `docker compose restart` | Restart the container |

---

## 3. Song Request Redeem — Setting up the Reward ID

The bot listens to all channel point redeems, but uses `SONG_REQUEST_REWARD_ID` in your `.env` to filter for only the "songrequests" reward.

### How to find your Reward ID

1. Go to your Twitch channel and create a channel point reward called **"songrequests"** (set it to require viewers to enter text).
2. Temporarily leave `SONG_REQUEST_REWARD_ID` blank in your `.env` — the bot will then respond to **all** redeems that contain a YouTube link.
3. Watch the bot logs (`docker compose logs -f`) and redeem the reward. You'll see the reward ID printed.
4. Copy that ID into your `.env`:
   ```env
   SONG_REQUEST_REWARD_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```
5. Restart the bot:
   ```bash
   docker compose restart
   ```

> Without `SONG_REQUEST_REWARD_ID` set, the bot will respond to **any** channel point redeem that contains a YouTube link.

---

## 4. Required Bot Permissions

Make your bot account a moderator in your channel by running this in Twitch chat:

```
/mod your_bot_username
```

This is required so the bot can delete the original redeem message after processing it.

---

## 5. How the Song Request Flow Works

1. A viewer redeems the "songrequests" channel point reward and pastes a YouTube link.
2. The bot detects the redeem via the `custom-reward-id` on the chat message.
3. If the reward ID matches (or no ID is set), the bot:
   - Sends the link to the external Basti API (`set_api`) to queue the song.
   - Fetches the YouTube video title via the YouTube oEmbed API.
   - Deletes the viewer's original redeem message.
   - Posts in chat: `@username has submitted: Video Title`
