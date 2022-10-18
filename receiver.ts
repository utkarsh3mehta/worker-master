import * as Bull from "bull";
import { transactions } from "./api";
import { AxiosError } from "axios";
import * as dotenv from 'dotenv'

dotenv.config();
/**
 * steps:
 * create a queue
 * every 5 minutes, add 'make API calls' to queue
 * 
 *
 */
const onAllProcess = (job: Bull.Job, done: Bull.DoneCallback) => {
  // let now = new Date();
  // let then = new Date(now);
  // then.setMinutes(then.getMinutes() - 5);
  console.log('added all transactions API')
  done();
  // transactions
  //   .get("/api/marketing/external/get-all-transactions")
  //   .then((res) => {})
  //   .catch((err) => {});
};
const onFnbProcess = (job: Bull.Job, done: Bull.DoneCallback) => {
  // let now = new Date();
  // let then = new Date(now);
  // then.setMinutes(then.getMinutes() - 5);
  console.log('added fnb transactions API');
  done();
  // transactions
  //   .get("/api/marketing/external/get-all-fnb-transactions")
  //   .then((res) => {})
  //   .catch((err) => {});
};
function onActive(job: Bull.Job, jobPromise: Bull.JobPromise) {
  console.log("activating", job.queue.name, job.id);
}
function onWaiting(jobId: Bull.JobId) {
  console.log("waiting for", jobId);
}
function onCleaned(jobs: Bull.Job[], status: Bull.JobStatusClean) {
  console.log(
    "cleaned job ids",
    jobs.map((j) => (j.id, j.queue)),
    status
  );
}
function onCompleted(job: Bull.Job, result: any) {
  console.log("completed", job.queue.name, job.id, "result", result);
}
function onDrained() {
  console.log("drained");
}
function onError(err: Error) {
  console.log("error", err);
}
function onFailed(job: Bull.Job, err: Error) {
  console.log("failed", job.queue.name, job.id, "error", err);
}
function onPaused() {
  console.log("paused");
}
function onProgress() {
  console.log("progress updated");
}
function onRemoved(job: Bull.Job) {
  console.log("removed", job.queue.name, job.id);
}
function onResumed() {
  console.log("resumed");
}
function onStalled(job: Bull.Job) {
  console.log("stalled", job.queue.name, job.id);
}

const receiverApiCalls = () => {
  const transactions = new Bull(process.env.TRANSACTIONS);
  transactions.on("active", onActive);
  transactions.on("cleaned", onCleaned);
  transactions.on("completed", onCompleted);
  transactions.on("drained", onDrained);
  transactions.on("error", onError);
  transactions.on("failed", onFailed);
  transactions.on("paused", onPaused);
  transactions.on("progress", onProgress);
  transactions.on("removed", onRemoved);
  transactions.on("resumed", onResumed);
  transactions.on("stalled", onStalled);
  transactions.on("waiting", onWaiting);
  transactions.process("all", onAllProcess);
  transactions.process("fnb", onFnbProcess);
};

receiverApiCalls();
