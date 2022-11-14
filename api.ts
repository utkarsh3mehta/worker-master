import axios from "axios";
import * as dotenv from 'dotenv'

dotenv.config();

const api = axios.create({
  baseURL: process.env.BACKEND_URL,
});

export default api;

export const transactions = axios.create({
  baseURL: "https://brij-api-v1.empirecinemas.com",
  headers: {
    Authorization:
      `Bearer ${process.env.AUTH_TOKEN}`,
  },
});