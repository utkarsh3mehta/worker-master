import * as Bull from "bull";
import * as dotenv from "dotenv";

dotenv.config();

const stopRepeatJobs = async () => {
  const transactions = new Bull(process.env.TRANSACTIONS);
  const repeatJobs = await transactions.getRepeatableJobs();
  console.log("repeat jobs", repeatJobs);
  process.exit(0);
};

stopRepeatJobs();
