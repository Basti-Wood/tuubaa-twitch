import { ChatUserstate } from "tmi.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const AUTH_URL = process.env.AUTH_URL
const TOKENS_FILE = path.join(__dirname, "../../tokens.json");

interface TokenData {
  [channelName: string]: {
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
  };
}

function isBroadcaster(channel: string, tags: ChatUserstate): boolean {
  const channelName = channel.replace("#", "").toLowerCase();
  return (
    tags.username?.toLowerCase() === channelName ||
    tags.badges?.broadcaster === "1"
  );
}

function loadChannelTokens(): TokenData {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const data = fs.readFileSync(TOKENS_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading tokens file:", error);
  }
  return {};
}

function saveChannelToken(channelName: string, token: string): void {
  try {
    const tokens = loadChannelTokens();
    tokens[channelName] = { access_token: token };
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
  } catch (error) {
    console.error("Error saving token:", error);
  }
}

export default {
  name: "token",
  description:
    "Speichert den Twitch-Token für den Kanal (nur für den Streamer)",
  userLevel: "tuubaa only",
  execute: async (channel: string, tags: ChatUserstate, args: string[]) => {
    const channelName = channel.replace("#", "");

    if (tags.username?.toLowerCase() !== channelName) {
      return `@${tags["display-name"]} Nur der Streamer kann seinen eigenen Token setzen.`;
    }

    if (args.length < 1) {
      const authUrl = `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${TWITCH_CLIENT_ID}&redirect_uri=${AUTH_URL}&scope=channel:manage:broadcast&state=${channelName}`;
      return `@${tags["display-name"]} Bitte besuche ${authUrl} und autorisiere die App. Dann nutze: !token DEIN_TOKEN NICHT EMPFOHLEN!!!!! Mach es lieber Manuell`;
    }

    const token = args[0];
    saveChannelToken(channelName, token);
    return `@${tags["display-name"]} Token für deinen Kanal wurde erfolgreich gespeichert. Du kannst jetzt alle Commands nutzen.`;
  },
};
