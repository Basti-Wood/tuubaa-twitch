import { client } from "../client";
import dotenv from "dotenv";
dotenv.config();

const { TWITCH_OAUTH_TOKEN, TWITCH_CLIENT_ID } = process.env;

let broadcasterId: string | null = null;

async function resolveBroadcasterId(): Promise<string | null> {
  if (broadcasterId) return broadcasterId;

  const response = await fetch("https://api.twitch.tv/helix/users", {
    headers: {
      "Authorization": `Bearer ${TWITCH_OAUTH_TOKEN}`,
      "Client-Id": TWITCH_CLIENT_ID!,
    },
  });

  if (!response.ok) {
    console.error("Failed to resolve broadcaster ID:", await response.json());
    return null;
  }

  const data = await response.json();
  broadcasterId = data.data?.[0]?.id ?? null;
  console.log(`Resolved broadcaster ID: ${broadcasterId}`);
  return broadcasterId;
}

async function getUserId(username: string): Promise<string | null> {
  const response = await fetch(
    `https://api.twitch.tv/helix/users?login=${username}`,
    {
      headers: {
        "Authorization": `Bearer ${TWITCH_OAUTH_TOKEN}`,
        "Client-Id": TWITCH_CLIENT_ID!,
      },
    }
  );
  if (!response.ok) return null;
  const data = await response.json();
  return data.data?.[0]?.id ?? null;
}

async function sendNativeShoutout(toBroadcasterId: string): Promise<void> {
  const fromId = await resolveBroadcasterId();
  if (!fromId) throw new Error("Could not resolve broadcaster ID from token");

  const response = await fetch(`https://api.twitch.tv/helix/chat/shoutouts`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TWITCH_OAUTH_TOKEN}`,
      "Client-Id": TWITCH_CLIENT_ID!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from_broadcaster_id: fromId,
      to_broadcaster_id: toBroadcasterId,
      moderator_id: fromId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Shoutout failed: ${JSON.stringify(error)}`);
  }
}

export default {
  name: "raided",
  description: "Handles incoming raids",
  execute: async (channel: string, username: string, viewers: number) => {
    const response =
      viewers > 1
        ? `Dankeee für den Raid mit ${viewers} Zuschauern, ${username}!`
        : `Danke für den raid!, ${username}!`;

    client.say(channel, response);

    try {
      const raiderId = await getUserId(username);
      if (!raiderId) {
        console.error(`Could not find user ID for ${username}`);
        return;
      }
      await sendNativeShoutout(raiderId);
      console.log(`Native shoutout sent to ${username}`);
    } catch (error) {
      console.error("Failed to send native shoutout:", error);
    }
  },
};