import * as Bull from "bull";
import api, { transactions } from "./api";
import { AxiosError } from "axios";
import * as dotenv from "dotenv";
import { Data, iJourneyMaster } from "./types";
import { startJourney } from "./main";

dotenv.config();
/**
 * steps:
 * make API call for the last 5 minutes
 * create an array of last 20 transactions id
 * push new transaction ids and shift() the same number of ids from array
 * ignore transactions that already exist in the list of array
 * for new transactions IDs, get journeys who's trigger type is Booked or "Order F&B"
 * start journey for each
 */

let transactionIds: String[] = [];
let transactionsFnbIds: String[] = [];
let bookedJourneys: iJourneyMaster[] = [];
let fnbJourneys: iJourneyMaster[] = [];

const onAllProcess = (job: Bull.Job, done: Bull.DoneCallback) => {
  // let now = new Date();
  // let then = new Date(now);
  // then.setMinutes(then.getMinutes() - 5);
  // console.log("added all transactions API");
  transactions
    .get("/api/marketing/external/get-all-transactions")
    .then((res) => {
      let transactions: Data[] = res.data;
      let ids = transactions.map((t) => t._id.$oid);
      let newids: String[] = [];
      for (let id of ids) {
        if (!transactionIds.includes(id)) {
          newids.push(id);
        }
      }
      if (transactionIds.length >= 20) {
        for (let i = 0; i < newids.length; i++) {
          transactionIds.shift();
        }
      }
      transactionIds.push(...newids);
      newids.forEach((id) => {
        let transaction = transactions.find((t) => t._id.$oid === id);
        bookedJourneys.forEach((j) => {
          startJourney(j, transaction);
        });
      });
      done();
    })
    .catch((err: AxiosError) => {});
};
const onFnbProcess = (job: Bull.Job, done: Bull.DoneCallback) => {
  // let now = new Date();
  // let then = new Date(now);
  // then.setMinutes(then.getMinutes() - 5);
  // console.log("added fnb transactions API");
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
  api
    .post("journey/trigger-type/get", { triggerType: "booked-ticket" })
    .then((res) => {
      let data: iJourneyMaster[] = res.data;
      bookedJourneys = data;
    })
    .catch((err) => {});
  api
    .post("journey/trigger-type/get", { triggerType: "ordered-fnb" })
    .then((res) => {
      let data: iJourneyMaster[] = res.data;
      fnbJourneys = data;
    })
    .catch((err) => {});
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
