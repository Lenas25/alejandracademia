import axios from "axios";
import rutas from "./endpoints";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL
});

export async function loginUser({username, password}:{username:string; password:string}) {
  try {
    const response = await api.post(rutas.login, {username, password});
    return {data: response.data.data, status: response.data.message};
  } catch (error) {
    return error;
  }
}
