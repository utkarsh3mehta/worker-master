import * as Bull from "bull";
import api, { transactions } from "./api";
import { AxiosError } from "axios";
import * as dotenv from "dotenv";
import { AllData, FnBData, iJourneyMaster, MessageData } from "./types";
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

let transactionIds: number[] = [];
let transactionsFnbIds: number[] = [];
let bookedJourneys: iJourneyMaster[] = [];
let fnbJourneys: iJourneyMaster[] = [];

const onAllProcess = (job: Bull.Job, done: Bull.DoneCallback) => {
  console.log("processing all", job.queue.name, job.id);
  api
    .post("journey/trigger-type/get", { triggerType: "booked-ticket" })
    .then((res) => {
      bookedJourneys = res.data.data;
      // console.log("booked journeys", bookedJourneys);
      let now = new Date();
      let then = new Date(now);
      then.setDate(then.getDate() - 1);
      transactions
        .get(
          `/api/marketing/external/get-all-transactions?fromDate=${then.getFullYear()}-${
            then.getMonth() + 1
          }-${then.getDate()}&toDate=${now.getFullYear()}-${
            now.getMonth() + 1
          }-${now.getDate()}`
        )
        .then(async (res) => {
          // console.log("all transactions response", res.data);
          let transactions: AllData[] = res.data;
          let ids = transactions.map((t) => t.transaction_number);
          console.log("transactions", ids);
          let newids: number[] = [];
          for (let id of ids) {
            if (!transactionIds.includes(id)) {
              newids.push(id);
            }
          }
          console.log("new ids", newids);
          if (transactionIds.length >= 20) {
            for (let i = 0; i < newids.length; i++) {
              transactionIds.shift();
            }
          }
          console.log("existing transactions ids", transactionIds);
          transactionIds.push(...newids);
          for (const id of newids) {
            let transaction = transactions.find(
              (t) => t.transaction_number === id
            );
            for (const j of bookedJourneys) {
              console.log("starting journey", j.name, "for id", id);
              await startJourney(j, transaction);
            }
          }
          done();
        })
        .catch((err: AxiosError) => {
          console.log("err", JSON.stringify(err));
          done(err);
        });
    })
    .catch((err) => {
      done(new Error("Error getting journeys"), err);
    });
};
const onFnbProcess = (job: Bull.Job, done: Bull.DoneCallback) => {
  console.log("processing fnb", job.queue.name, job.id);
  api
    .post("journey/trigger-type/get", { triggerType: "ordered-f-and-b" })
    .then((res) => {
      fnbJourneys = res.data.data;
      // console.log("fnb journeys", fnbJourneys);
      let now = new Date();
      let then = new Date(now);
      then.setDate(then.getDate() - 1);
      transactions
        .get(
          `/api/marketing/external/get-all-fnb-transactions?fromDate=${then.getFullYear()}-${
            then.getMonth() + 1
          }-${then.getDate()}&toDate=${now.getFullYear()}-${
            now.getMonth() + 1
          }-${now.getDate()}`
        )
        .then(async (res) => {
          console.log("fnb transactions response", res.data);
          let transactions: FnBData[] = res.data.Records.data;
          let ids = transactions.map((t) => t.transaction_number);
          console.log("fnb ids", ids);
          let newids: number[] = [];
          for (let id of ids) {
            if (!transactionsFnbIds.includes(id)) {
              newids.push(id);
            }
          }
          console.log("new fnb ids", newids);
          if (transactionsFnbIds.length >= 20) {
            for (let i = 0; i < newids.length; i++) {
              transactionsFnbIds.shift();
            }
          }
          console.log("existing fnb transaction ids", transactionsFnbIds);
          transactionsFnbIds.push(...newids);
          for (const id of newids) {
            // console.log("newid", id);
            let transaction = transactions.find(
              (t) => t.transaction_number === id
            );
            // for (const j of fnbJourneys) {
            //   console.log("journey", j.name);
            //   console.log(
            //     "starting journey",
            //     j.name,
            //     "for data number",
            //     transaction.transaction_number
            //   );
            // }
            for (const j of fnbJourneys) await startJourney(j, transaction);
          }
          done(null);
        })
        .catch((err) => {
          done(new Error("Error getting transactions"), err);
        });
    })
    .catch((err) => {
      done(new Error("Error getting journeys"), err);
    });
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
