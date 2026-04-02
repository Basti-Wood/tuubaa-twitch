import { client } from "../client";

export default {
  name: "subscription",
  description: "Handles new subscriptions",
  execute: (
    channel: string,
    username: string,
    methods: any,
    message: string,
    userstate: any,
  ) => {
    const plan = methods.plan || "1000";
    let tierName = "Tier 1";

    if (plan === "2000") tierName = "Tier 2";
    if (plan === "3000") tierName = "Tier 3";

    const isPrime = methods.prime;
    const subType = isPrime ? "Prime" : tierName;

    let response = `EYYO ein ${subType} Sub, von ${username}!YAY`;

    if (userstate["msg-param-cumulative-months"] > 1) {
      const months = userstate["msg-param-cumulative-months"];
      response = `DANKE FÜR ${months} Monate SUPPORT MIT EINEM ${subType} SUB, ${username}! crazzyyyy`;
    }

    client.say(channel, response);
  },
};
