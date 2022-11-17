import * as sendgrid from "@sendgrid/mail";
import * as dotenv from "dotenv";
import api from "../../api";

import { iEmailCompaign, MessageData } from "../../types";

dotenv.config();

export const sendEmail = async (data: MessageData) => {
  let campaignId = data.node.data.selectedValue["send-email"];
  let emailResponse = await api.get(`emailCompaign/${campaignId}`);
  if (!emailResponse) throw new Error("Error getting email campaign details");
  let campaignData: iEmailCompaign = emailResponse.data;
  let token = process.env.SENDGRID_TOKEN;
  let from = campaignData.from_email || "vpsparsarmabihar@gmail.com";
  sendgrid.setApiKey(token);
  let msg: sendgrid.MailDataRequired = {
    to: data.data.user_email || data.data.guest_email,
    from: from,
    subject: campaignData.subject,
    html: !!campaignData.rich_text
      ? campaignData.rich_text
      : !!campaignData.emailMaster?.html
      ? campaignData.emailMaster?.html
      : "",
  };
  let [message, err] = await sendgrid.send(msg);
  if (err) throw new Error(JSON.stringify(err));
  console.log("message", message.statusCode);
};
