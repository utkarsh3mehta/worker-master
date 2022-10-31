import * as redis from "redis";
import * as dotenv from "dotenv";

dotenv.config();

const logger = async () => {
  const client = redis.createClient();
  client.on("error", (err) => console.log("Redis Client Error", err));
  await client.connect();
  await client.subscribe(process.env.LOGGER_CHANNEL, (message) => {
    console.log(message);
  });
};

logger();
