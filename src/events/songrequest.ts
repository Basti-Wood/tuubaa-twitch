import { ChatUserstate } from "tmi.js";
import { client } from "../client";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const YOUTUBE_REGEX =
  /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[\w-]+(?:\?[\w=&]*)*/;

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

	//make the HTTP request to set
	const response = await axios.post("https://api.bastiwood.com/set_api", {
		headers: {
		"owner": process.env.TWITCH_CHANNEL,
		"user": username,
		"media": youtubeUrl,
		"x-api-key": process.env.BASTIAPI
	}
	});
	console.log(response.data);

    // Delete the original redeem message
    if (tags.id) {
      try {
        await client.deletemessage(channel, tags.id);
      } catch (err) {
        console.error("Failed to delete message:", err);
      }
    }

    const title = await getYouTubeTitle(youtubeUrl);

    if (title) {
      await client.say(channel, `@${username} has submitted: ${title}`);
    } else {
      await client.say(
        channel,
        `@${username} has submitted a song request: ${youtubeUrl}`
      );
    }
  },
};