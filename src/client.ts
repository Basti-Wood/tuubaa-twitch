import tmi from "tmi.js";
import dotenv from "dotenv";

dotenv.config();

const { TWITCH_USERNAME, TWITCH_OAUTH_TOKEN, TWITCH_CHANNEL } = process.env;

if (!TWITCH_USERNAME || !TWITCH_OAUTH_TOKEN || !TWITCH_CHANNEL) {
  throw new Error("Missing required environment variables");
}

export const client = new tmi.Client({
  options: { debug: true },
  identity: {
    username: TWITCH_USERNAME,
    password: TWITCH_OAUTH_TOKEN,
  },
  channels: [TWITCH_CHANNEL],
});

client.on("message", (channel, tags, message, self) => {
  if (self) return;

  console.log(`${tags["display-name"]}: ${message}`);
});

client.on("connected", (addr, port) => {
  console.log(`Connected to ${addr}:${port}`);
});

export const connectClient = async (): Promise<void> => {
  try {
    await client.connect();
    console.log("Connected to Twitch chat");
  } catch (error) {
    console.error("Connection error:", error);
    throw error;
  }
};