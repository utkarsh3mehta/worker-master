import * as Bull from "bull";
import * as dotenv from "dotenv";

dotenv.config();
/**
 * steps:
 * create a queue
 * every 5 minutes, add 'make API calls' to queue
 *
 *
 */

const makeApiCalls = async () => {
  const transactions = new Bull(process.env.TRANSACTIONS);
  await transactions.add("all", {}, { repeat: { every: 120000 } });
  await transactions.add("fnb", {}, { repeat: { every: 120000 } });
  process.exit(0);
};

makeApiCalls();
