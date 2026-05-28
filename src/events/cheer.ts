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

    let response = [
		`Nom nom danke für ${bits} Bits, ${username}, wird mein döner geld!`,
		`Danke für ${bits} Bits, ${username}!`,
		`${bits} Bits sind viel, Danke ${username}!`,
	];

    switch (true) {
      case bits >= 10000:
        response = [
			`WOW! DANKE FÜR DIE ${bits} Bits, ${username}! `,
			`Danke für ${bits} Bits, ${username}! Das ist krass!`,
			`${username}, du bist der Wahnsinn mit ${bits} Bits! Danke!`,
		];
        break;
      case bits >= 5000:
        response = [
			`YOOO ${bits} Bits, ${username}! `,
			`Yoooo ${bits} Bits ist heftig ${username}! Danke!`,
			`Holy Moly ${username}, ${bits} Bits! Danke dir!`,
		];
        break;
      case bits >= 1000:
        response = [
			`Dankeee für die ${bits} Bits, ${username}!`,
			`Jooo danke für die ${bits} Bits, ${username}!`,
			`${username}, du bist der Hammer mit ${bits} Bits! Danke!`,
		];
        break;
    }

    client.say(channel, response[Math.floor(Math.random() * response.length)]);
  },
};
