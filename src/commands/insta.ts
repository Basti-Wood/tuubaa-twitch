import { ChatUserstate } from "tmi.js";
import dotenv from "dotenv";

dotenv.config();

const INSTA_LINK = "https://www.instagram.com/1tuubaa_/";

export default {
  name: "instagram",
  description: "Zeigt den Link zu dem Instagram Kanal",
  aliases: ["ig", "insta"],

  userLevel: "Jeder",
  execute: (channel: string, tags: ChatUserstate, args: string[]) => {
    const username = tags["display-name"] || tags.username;

    const channelName = channel.replace("#", "");

    let response = `Hey ${username}! Ihr insta findest du hier: ${INSTA_LINK}`;

    return response;
  },
};
