// import TreeModel from "tree-model";
import { AxiosError } from "axios";
import * as TreeModel from "tree-model";
import api from "./api";
import * as amqp from "amqplib/callback_api";

interface FlowNode {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: {
    nodeid: string;
    name: string;
    type: string;
    icon: string;
    innerHTML?: {
      __html: string;
    };
    selectedValue?: object;
    sourceHandle?: Array<{
      id: string;
      position: string;
      style: object;
      isConnectable: boolean;
    }>;
    targetHandle?: Array<{
      id: string;
      position: string;
      style: object;
      isConnectable: boolean;
    }>;
  };
}

interface Edge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  type: string;
  data: object;
}

const startJourney = (id: number) => {
  api
    .get(`journey/${id}`)
    .then((res) => {
      let example = JSON.parse(res.data.data.data);
      let connections: Edge[] = <Edge[]>(
        example.elements.filter((e: any) => isNaN(parseInt(e.id)))
      );
      let elements: FlowNode[] = <FlowNode[]>(
        (<unknown[]>example.elements.filter((e: any) => !isNaN(parseInt(e.id))))
      );

      const buildWorkerTree = (node: TreeModel.Node<FlowNode>) => {
        let myid = node.model.id;
        let myelements = elements.filter((e) =>
          connections
            .filter((c) => c.source === myid)
            .map((c) => c.target)
            .includes(e.id)
        );
        myelements.forEach((e) => {
          let thisnode = journey.parse(e);
          node.addChild(thisnode);
          buildWorkerTree(thisnode);
        });
      };

      /**
       * Find the node which is not a target in any connections.
       * This node will be the start of the jounrey. Let's name it 'start'
       *
       * Find all connections where the sourceHandle is matches the end of 'start'.nodeid.
       * .match(/.*type-nodeid^/)
       * These are the starting connections. Let's name them 'starters'
       *
       * We save the sequence of the jounrey till a condition node
       */

      // Find root element
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
            console.error("root element is not empty", e.id);
          } else rootElement = e;
        }
      }

      if (!rootElement.id) {
        console.error("No root element found");
        process.exit(1);
      }

      const journey = new TreeModel();

      const root = journey.parse(rootElement);
      buildWorkerTree(root);

      amqp.connect(
        "amqp://127.0.0.1",
        (err0: any, connection: amqp.Connection) => {
          if (err0) throw err0;

          connection.createChannel((err1: any, channel: amqp.Channel) => {
            if (err1) throw err1;

            let j_queue = "journey_v1";
            channel.assertQueue(j_queue, { durable: false });
            console.log("sending starting message");
            channel.sendToQueue(
              j_queue,
              Buffer.from("Starting walk through root")
            );

            let strategy: TreeModel.StrategyName = "pre"; // possible strategy to be used: breadth & pre
            console.log("strategy", strategy);
            root.walk({ strategy: strategy }, (node) => {
              console.log("node", {
                nodeid: node.model.data.nodeid,
                id: node.model.id,
                type: node.model.type,
              });
              let message = {
                data: {
                  _id: {
                    $oid: "63288006e8ac9ebbf2b5ecff",
                  },
                  transaction_number: 1,
                  price_per_ticket: 55,
                  discount: 0,
                  loyality_earned: 0,
                  taxes: 13.412,
                  service_charge: 0,
                  show_date: "2022-08-18",
                  show_time: "16:00",
                  cinema_name: "Khurais - Al Othaim Mall",
                  movie_name: "Minions: The Rise of Gru",
                  cast_crew_list:
                    "Alan Arkin--Actor,Brad Ableson--Director,Jonathan del Val--Director,Kyle Balda--Director,Pierre Coffin--Actor,Steve Carell--Actor",
                  movie_id: 1,
                  genre_name: "Adventure, Comedy",
                  lang_name: "English",
                  subtitle_1_language: "Arabic",
                  synopsis:
                    "The untold story of one twelve-year-old's dream to become the world's greatest supervillain.",
                  is_voucher_applied: "N",
                  voucher_name: "",
                  seat_type_name: "Standard",
                  seat_name: "D6",
                  movie_format: "2D",
                  cash_card_amount: 0,
                  payment_mode: "Cash",
                  cine_address:
                    "Kharis Branch Rd, Saudi Arabia An Nasim Ash Sharqi, Riyadh 14241",
                  city_name: "ar-Riyad",
                  country_name: "Saudi Arabia",
                  booking_source: "boxoffice",
                  first_name: "",
                  last_name: "",
                  cust_mobile: "",
                  cust_email: "",
                  cust_dob: "",
                  gender: "",
                  guest_first_name: "",
                  guest_last_name: "",
                  guest_mobile: "",
                  guest_email: "",
                  is_refund: "N",
                  refund_amount: 0,
                  refund_reason: "",
                  screen_count: 57,
                  screen_id: 2,
                  screen_name: "Screen 2",
                  booking_date: "2022-08-17",
                  booking_time: "16:08",
                  booking_timestamp: 1660754429,
                  transaction_time: "16:08",
                  transaction_date: "2022-08-17",
                  user_type: "register",
                  actor_list: ["Alan Arkin", "Pierre Coffin", "Steve Carell"],
                  director_list: [
                    "Brad Ableson",
                    "Jonathan del Val",
                    "Kyle Balda",
                  ],
                  actress_list: [""],
                  user_first_name: "",
                  user_last_name: "",
                  user_mobile_number: "",
                  user_email: "",
                  user_gender: "",
                  user_dob: "",
                },
                node: node.model.data.nodeid,
              };
              // console.log("message", message);
              channel.sendToQueue(
                j_queue,
                Buffer.from(JSON.stringify(message))
              );
              // console.log("sent to queue", isSent);
              return true;
            });
            console.log("closing connection");
            connection.close();
            process.exit(0);
          });
        }
      );
    })
    .catch((err: AxiosError) => console.error("error", err.response.data));
};

startJourney(1);
