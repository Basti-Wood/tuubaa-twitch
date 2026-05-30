import { ChatUserstate } from "tmi.js";
import { client } from "../client";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const YOUTUBE_REGEX =
  /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[\w-]+(?:\?[\w=&]*)*/;

// Pulls the 11-char video ID out of any supported YouTube URL form
// (watch?v=, youtu.be/, shorts/). Returns null if none found.
function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/
  );
  return match ? match[1] : null;
}

async function getYouTubeTitle(url: string): Promise<string | null> {
  try {
    const response = await axios.get("https://www.youtube.com/oembed", {
      params: { url, format: "json" },
      timeout: 5000,
    });
    return response.data?.title ?? null;
  } catch {
    return null;
  }
}

// Cache the bot's user ID so we don't hit /helix/users on every redeem.
let cachedBotId: string | null = null;

async function getBotId(token: string, clientId: string): Promise<string> {
  if (cachedBotId) return cachedBotId;
  const userRes = await axios.get("https://api.twitch.tv/helix/users", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Client-Id": clientId,
    },
  });
  const botId = userRes.data?.data?.[0]?.id;
  if (!botId) throw new Error("Could not fetch bot user ID");
  cachedBotId = botId;
  return botId;
}

// Deletes a single chat message via the Twitch Helix API.
// Requires the token to have the `moderator:manage:chat_messages` scope AND
// the bot account to be a moderator in the broadcaster's channel.
async function deleteMessage(broadcasterId: string, messageId: string): Promise<void> {
  const token = process.env.TWITCH_OAUTH_TOKEN?.replace("oauth:", "");
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!token || !clientId) throw new Error("Missing Twitch token or client id");

  const botId = await getBotId(token, clientId);

  await axios.delete("https://api.twitch.tv/helix/moderation/chat", {
    params: {
      broadcaster_id: broadcasterId,
      moderator_id: botId,
      message_id: messageId,
    },
    headers: {
      Authorization: `Bearer ${token}`,
      "Client-Id": clientId,
    },
  });
}

export default {
  name: "message",
  description: "Handles song requests via channel point redemption",
  execute: async (
    channel: string,
    tags: ChatUserstate,
    message: string,
    self: boolean
  ) => {
    if (self) return;

    // Only handle channel point redeems
    if (!tags["custom-reward-id"]) return;

    // Optionally restrict to a specific reward ID via env variable
    const rewardId = process.env.SONG_REQUEST_REWARD_ID;
    if (rewardId && tags["custom-reward-id"] !== rewardId) return;

    const match = message.match(YOUTUBE_REGEX);
    if (!match) return;

    const youtubeUrl = match[0];
    const username = tags["display-name"] || tags.username;

    // Normalize to a clean youtu.be/<id> link with no query string. This
    // matters because the API route stores the URL in a {media:path} segment,
    // which is truncated at "?" — so any ?v=...&... would be lost. Moving the
    // video ID into the path avoids that entirely. Falls back to the raw URL
    // if for some reason no ID could be extracted.
    const videoId = extractVideoId(youtubeUrl);
    const mediaUrl = videoId
      ? `https://youtu.be/${videoId}`
      : youtubeUrl;

	//make the HTTP request to set
	try {
		const owner = process.env.TWITCH_CHANNEL;
		// mediaUrl has no query string, so it sits safely in the {media:path}
		// segment. encodeURIComponent would turn its slashes into %2F and break
		// route matching, so we only encode owner/user and append the link raw.
		const response = await axios.post(
			`https://api.bastiwood.com/setmedia/${encodeURIComponent(
				owner ?? ""
			)}/${encodeURIComponent(username ?? "")}/${mediaUrl}`,
			null,
			{
				headers: {
					"x-api-key": process.env.BASTIAPI,
				},
			}
		);
		console.log(response.data);
	} catch (err) {
		console.error("Failed to send song request to API:", err);
	}

	// Delete the original redeem message via the Twitch Helix API.
	// Needs the `moderator:manage:chat_messages` scope on the token and the bot
	// to be a moderator in the channel.
    if (tags.id && tags["room-id"]) {
      try {
        await deleteMessage(tags["room-id"], tags.id);
      } catch (err: any) {
        // Surface the real reason (e.g. 401 missing scope, 403 not a mod).
        console.error(
          "Failed to delete message:",
          err?.response?.status,
          err?.response?.data ?? err?.message ?? err
        );
      }
    }

    const title = await getYouTubeTitle(mediaUrl);

    if (title) {
      await client.say(channel, `@${username} has submitted: ${title}`);
    } else {
      await client.say(
        channel,
        `@${username} has submitted a song request: ${mediaUrl}`
      );
    }
  },
};