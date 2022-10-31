import { iSmsCampaign, MessageData } from "../../types";
import * as Twilio from "twilio";
import api from "../../api";
import * as dotenv from 'dotenv'

dotenv.config();

export const sendSMS = async (data: MessageData) => {
  try {
    let campaignId = data.node.data.selectedValue["send-sms"];
    let messageResposne = await api.get(`smsCampaign/${campaignId}`);
    if (!messageResposne) throw new Error("Error getting SMS campaign details");
    let campaignData: iSmsCampaign = messageResposne.data;
    const client = new Twilio.Twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_TOKEN
    );
    const message = await client.messages.create({
      from: campaignData.from_phone || process.env.TWILIO_PHONE_NUMBER,
      to: data.data.user_mobile_number || data.data.guest_mobile.toString(),
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
