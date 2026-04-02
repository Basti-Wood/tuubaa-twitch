import { ChatUserstate } from "tmi.js";
import { client } from "../client";

export default {
  name: "subgift",
  description: "Handles subscription gifts",
  execute: (
    channel: string,
    username: string,
    streakMonths: number,
    recipient: string,
    methods: any,
    userstate: ChatUserstate,
  ) => {
    const senderDispName = userstate["display-name"] || username;
    const gifted = userstate["msg-param-sender-count"] || 1;
    client.say(channel, `${senderDispName} hat ${recipient} einen Sub geschenkt! (${gifted} insgesamt) Du stinker :)`);
  },
};