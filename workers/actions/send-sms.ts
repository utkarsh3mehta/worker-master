import { Data, iSmsCampaign, MessageData } from "../../types";
import * as Twilio from "twilio";
import api from "../../api";

export const sendSMS = async (data: MessageData) => {
  try {
    let campaignId = data.node.data.selectedValue["send-sms"];
    let messageResposne = await api.get(`smsCampaign/${campaignId}`);
    if (!messageResposne) throw new Error("Error getting SMS campaign details");
    let campaignData: iSmsCampaign = messageResposne.data;
    const client = new Twilio.Twilio(data.sid, data.token);
    const message = await client.messages.create({
      from: campaignData.from_phone,
      to: data.data.user_mobile_number,
      body: campaignData.text,
    });
    if (message) {
      console.log("Message sent successfully.");
    } else {
      console.log("error occured while sending message");
    }
  } catch (error) {
    console.log(error);
  }
};
