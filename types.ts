import Bull = require("bull");

export interface Queues {
  [name: string]: {
    Q?: Bull.Queue;
    // status?: Bull.JobStatus;
  };
}

enum JOURNEY_STATUS {
  STARTED = "STARTED",
  STOPPED = "STOPPED"
}

interface HandleInterface {
  id: string;
  position: string;
  style: object;
  isConnectable: boolean;
}

export interface FlowData {
  elements: []
}

export interface FlowNode {
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
    selectedValue?: {
      "send-email"?: "";
      "send-sms"?: "";
      "send-push-notification"?: "";
      "add-to-segment"?: "";
      "is-in-segment"?: "";
      "event-occured"?: "";
      "has-user-attribute"?: "";
      "wait-date"?: "";
      "wait-time"?: "";
    };
    sourceHandle?: Array<HandleInterface>;
    targetHandle?: Array<HandleInterface>;
  };
}

export interface iJourneyMaster {
  id: number;
  name: string;
  status: JOURNEY_STATUS;
  userId: number
  data: string;
  triggerType?: string;
}

export interface Edge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  type: string;
  data: object;
}

export interface Data {
  _id: {
    $oid: string;
  };
  transaction_number: number;
  price_per_ticket: number;
  discount: number;
  loyality_earned: number;
  taxes: number;
  service_charge: number;
  show_date: Date | string;
  show_time: string;
  cinema_name: string;
  movie_name: string;
  cast_crew_list: string;
  movie_id: number;
  genre_name: string;
  lang_name: string;
  subtitle_1_language: string;
  synopsis: string;
  is_voucher_applied: string;
  voucher_name: string;
  seat_type_name: string;
  seat_name: string;
  movie_format: string;
  cash_card_amount: number;
  payment_mode: string;
  cine_address: string;
  city_name: string;
  country_name: string;
  booking_source: string;
  first_name: string;
  last_name: string;
  cust_mobile: string;
  cust_email: string;
  cust_dob: string;
  gender: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_mobile: string;
  guest_email: string;
  is_refund: string;
  refund_amount: number;
  refund_reason: string;
  screen_count: number;
  screen_id: number;
  screen_name: string;
  booking_date: string;
  booking_time: string;
  booking_timestamp: number;
  transaction_time: string;
  transaction_date: string;
  user_type: string;
  actor_list: Array<string>;
  director_list: Array<string>;
  actress_list: Array<string>;
  user_first_name: string;
  user_last_name: string;
  user_mobile_number: string;
  user_email: string;
  user_gender: string;
  user_dob: string;
}

export interface MessageData {
  data: Data;
  node: FlowNode;
}
