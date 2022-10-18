import axios from "axios";
import * as dotenv from 'dotenv'

dotenv.config();

const api = axios.create({
  baseURL: "http://localhost:8001/api/v1/",
});

export default api;

export const transactions = axios.create({
  baseURL: "https://brij-api-v1.empirecinemas.com",
  headers: {
    Authorization:
      `Bearer ${process.env.AUTH_TOKEN}`,
  },
});