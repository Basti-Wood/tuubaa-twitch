import { ChatUserstate } from "tmi.js";
import { client } from "../client";

export default {
  name: "cheer",
  description: "Handles bits cheering in the chat",
  execute: (channel: string, userstate: ChatUserstate, message: string) => {
    console.log(`Cheer event triggered:`, userstate, message);
    
    if (!userstate.bits) return;

    const bits = parseInt(userstate.bits);
    const username = userstate["display-name"] || userstate.username;

    let response = `Nom nom danke für ${bits} Bits, ${username}, wird mein döner geld!`;

    switch (true) {
      case bits >= 10000:
        response = `WOW! DANKE FÜR DIE ${bits} Bits, ${username}! `;
        break;
      case bits >= 5000:
        response = `YOOO ${bits} Bits, ${username}! `;
        break;
      case bits >= 1000:
        response = `Dankeee für die ${bits} Bits, ${username}!`;
        break;
    }

    client.say(channel, response);
  },
};
