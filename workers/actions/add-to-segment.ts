import { Data, MessageData } from "../../types";
import api from "../../api";

export const addToSegment = async (data: MessageData) => {
  try {
    let segmentId = parseInt(data.node.data.selectedValue["add-to-segment"]);
    let payload = {
      segmentId: segmentId,
      contactId: data.data.user_id,
    };
    const response = await api.post(`segment/customer/seg/${segmentId}`, payload);
    if (!response) {
      console.error('error adding user to segment');
    }
  } catch (e) {}
};
