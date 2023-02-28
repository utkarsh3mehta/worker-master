import * as Bull from "bull";
import api from "./api";
import {
  AllData,
  Edge,
  FlowData,
  FlowNode,
  FnBData,
  iJourneyMaster,
  MessageData,
  Queues,
} from "./types";
import * as TreeModel from "tree-model";
import * as dotenv from "dotenv";
import {
  addToSegment,
  sendEmail,
  sendPushNotification,
  sendSMS,
} from "./workers";

dotenv.config();

const oneMinute = 60 * 1000;
const oneDay = oneMinute * 60 * 24;

const AllQueues: Queues = {};

async function onProcess(job: Bull.Job, done: Bull.DoneCallback) {
  // console.log("processing", job.queue.name, job.id);
  let data: MessageData = job.data;
  let nodeid = data.node.data.nodeid;
  // console.log("nodeid", nodeid);
  if (nodeid === "send-email") {
    console.log("sending email");
    // await sendEmail(data);
  }
  // else if (nodeid === "send-push-notification")
  //   await sendPushNotification(data.data);
  else if (nodeid === "send-sms") {
    console.log("sending sms");
    // await sendSMS(data);
  } else if (nodeid === "add-to-segment") {
    console.log("adding to segment");
    // await addToSegment(data);
  }
  return done(null, { nodeid });
}
function onActive(job: Bull.Job, jobPromise: Bull.JobPromise) {
  // console.log("activating", job.queue.name, job.id);
  let data = job.data;
  let nodeid = data.node.data.nodeid;
  if (
    [
      "send-email",
      // "send-push-notification",
      "send-sms",
      "add-to-segment",
    ].includes(nodeid)
  ) {
  } else {
    // console.log("canceling job", nodeid);
    jobPromise.cancel;
  }
}
function onWaiting(jobId: Bull.JobId) {
  // console.log("waiting for", jobId);
}
function onCleaned(jobs: Bull.Job[], status: Bull.JobStatusClean) {
  // console.log(
  //   "cleaned job ids",
  //   jobs.map((j) => (j.id, j.queue)),
  //   status
  // );
}
function onCompleted(job: Bull.Job, result: any) {
  // console.log("completed", job.queue.name, job.id, "result", result);
}
function onDrained() {
  // console.log("drained");
}
function onError(err: Error) {
  // console.log("error", err);
}
function onFailed(job: Bull.Job, err: Error) {
  // console.log("failed", job.queue.name, job.id, "error", err);
}
function onPaused() {
  // console.log("paused");
}
function onProgress() {
  // console.log("progress updated");
}
function onRemoved(job: Bull.Job) {
  // console.log("removed", job.queue.name, job.id);
}
function onResumed() {
  // console.log("resumed");
}
function onStalled(job: Bull.Job) {
  // console.log("stalled", job.queue.name, job.id);
}

export const startJourney = async (
  journeyData: iJourneyMaster,
  data: AllData | FnBData
) => {
  let now = new Date().getTime();
  let queue_name = `_${journeyData.id}-${now}`;
  AllQueues[queue_name] = {};
  AllQueues[queue_name].Q = new Bull(queue_name);
  AllQueues[queue_name].Q.process(onProcess);
  AllQueues[queue_name].Q.on("active", onActive);
  AllQueues[queue_name].Q.on("cleaned", onCleaned);
  AllQueues[queue_name].Q.on("completed", onCompleted);
  AllQueues[queue_name].Q.on("drained", onDrained);
  AllQueues[queue_name].Q.on("error", onError);
  AllQueues[queue_name].Q.on("failed", onFailed);
  AllQueues[queue_name].Q.on("paused", onPaused);
  AllQueues[queue_name].Q.on("progress", onProgress);
  AllQueues[queue_name].Q.on("removed", onRemoved);
  AllQueues[queue_name].Q.on("resumed", onResumed);
  AllQueues[queue_name].Q.on("stalled", onStalled);
  AllQueues[queue_name].Q.on("waiting", onWaiting);
  let flowData: FlowData = JSON.parse(journeyData.data);
  let connections: Edge[] = <Edge[]>(
    flowData.elements.filter((e: any) => isNaN(parseInt(e.id)))
  );
  let elements: FlowNode[] = <FlowNode[]>(
    (<unknown[]>flowData.elements.filter((e: any) => !isNaN(parseInt(e.id))))
  );

  const buildWorkerTree = async (node: TreeModel.Node<FlowNode>) => {
    let myid = node.model.id;
    let type = node.model.type;
    let mynodeid = node.model.data.nodeid;
    let myelements: FlowNode[] = [];
    // console.log("node id", node.model.data.nodeid);
    if (type === "condition") {
      let condition: boolean;
      let m = Math.round(Math.random());
      console.log("true or false", !!m);
      if (mynodeid === "is-in-segment") {
        try {
          let is_in_segment_response = await api.post(
            `segment/${node.model.data.selectedValue["is-in-segment"]}/customer`,
            {
              emailId: data.cust_email || data.guest_email || undefined,
            }
          );
          if (
            !is_in_segment_response ||
            is_in_segment_response.data.type === "error"
          ) {
            condition = false;
          } else {
            condition = true;
          }
        } catch {
          condition = false;
        }
      } else if (mynodeid === "has-user-attribute") {
        condition = !!m;
      }
      // else if (mynodeid === 'event-occured') {}
      if (condition) {
        myelements = elements.filter((e) =>
          connections
            .filter((c) => c.source === myid)
            .filter((c) => c.sourceHandle.startsWith("true"))
            .map((c) => c.target)
            .includes(e.id)
        );
      } else {
        myelements = elements.filter((e) =>
          connections
            .filter((c) => c.source === myid)
            .filter((c) => c.sourceHandle.startsWith("false"))
            .map((c) => c.target)
            .includes(e.id)
        );
      }
    } else {
      myelements = elements.filter((e) =>
        connections
          .filter((c) => c.source === myid)
          .map((c) => c.target)
          .includes(e.id)
      );
    }
    for (const e of myelements) {
      let thisnode = journey.parse(e);
      node.addChild(thisnode);
      await buildWorkerTree(thisnode);
    }
  };

  let rootElement: FlowNode = {
    id: "",
    type: "",
    position: { x: 0, y: 0 },
    data: { nodeid: "", type: "", icon: "", name: "" },
  };

  for (let e of elements) {
    let conn = connections.filter((c) => c.target === e.id);
    if (conn.length > 0) {
      continue;
    } else {
      if (rootElement.id) {
      } else rootElement = e;
    }
  }

  if (!rootElement.id) {
    throw new Error("No root element found");
  }

  const journey = new TreeModel();

  const root = journey.parse(rootElement);
  await buildWorkerTree(root);

  let strategy: TreeModel.StrategyName = "pre"; // possible strategy to be used: breadth & pre
  let nodes: MessageData[] = [];
  // console.log("walking tree");
  root.walk({ strategy }, (node) => {
    // console.log("node", node.model.data.nodeid);
    let message = {
      data,
      node: node.model,
    };
    nodes.push(message);
    return true;
  });
  let delay = 0;
  for (const n of nodes) {
    // console.log("adding to queue", n.node.data.nodeid);
    if (
      n.node.data.nodeid === "wait-date" ||
      n.node.data.nodeid === "wait-time" ||
      n.node.data.nodeid === "wait-days" ||
      n.node.data.nodeid === "wait-minutes"
    ) {
      if (n.node.data.nodeid === "wait-date") {
        let date = new Date(n.node.data.selectedValue["wait-date"]);
        let diff = now - date.getTime();
        if (diff > 0) delay += diff;
      } else if (n.node.data.nodeid === "wait-time") {
        let time = new Date();
        let selectedTime = n.node.data.selectedValue["wait-time"]
          .split(":")
          .map((v) => parseInt(v));
        time.setHours(selectedTime[0]);
        time.setMinutes(selectedTime[1]);
        let diff = now - time.getTime();
        if (diff > 0) delay += diff;
      } else if (n.node.data.nodeid === "wait-days") {
        let selectedDays = parseInt(n.node.data.selectedValue["wait-days"]);
        delay += selectedDays * oneDay;
      } else if (n.node.data.nodeid === "wait-minutes") {
        let selectedMinutes = parseInt(
          n.node.data.selectedValue["wait-minutes"]
        );
        delay += selectedMinutes * oneMinute;
      }
    } else {
      console.log("delay", delay);
      await AllQueues[queue_name].Q.add(n, { delay });
    }
    // console.log("delay", delay);
  }
  // add end queue tasks to delete queue from redis
  // await AllQueues[queue_name].Q.add()
  // end the function after delay
  // setTimeout(() => {
  //   process.exit(0);
  // }, delay)
};
