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

const makeApiCalls = () => {
  const transactions = new Bull(process.env.TRANSACTIONS);
  transactions.add("all", {}, { repeat: { every: 300000, limit: 3 } });
  transactions.add("fnb", {}, { repeat: { every: 300000, limit: 3 } });
  // process.exit(0)
};

makeApiCalls();
