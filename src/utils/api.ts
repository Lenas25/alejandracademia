import axios from "axios";
import rutas from "./endpoints";
import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: string;
  exp: number;
  iat: number;
  role: string;
}


const cloudinaryAPI = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}${rutas.images}`
});

const loginAPI = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}${rutas.login}`
});

export const extractImageId = (url: string): string | null => {
  const regex = /\/v\d+\/([^\/]+)\.[a-zA-Z0-9]+$/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export const uploadImage = async (image: File) => {
  const formData = new FormData();
  formData.append("file", image);
  try {
    const response = await cloudinaryAPI.post("/upload", formData);
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export const deleteImage = async (publicId: string) => {
  try {
    const response = await cloudinaryAPI.delete(`/${publicId}`);
    return response.data.deleted;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export const login = async (username: string, password: string) => {
  try {
    const response = await loginAPI.post("/", {
      username,
      password
    })
    const data = response.data.data;
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    return data;
  } catch (error) {
    console.error("Error al refrescar el token:", error);
    if (axios.isAxiosError(error) && error.response) {
      return error.response.data;
    }
    console.error("Unexpected error:", error);
    return null;
  }
};

export const getMe = async (token: string) => {
  try {
    const decoded = decodeToken(token) as JwtPayload;
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}${rutas.users}/${decoded?.id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export const decodeToken = (token: string) => {
  try {
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as { exp: number };
    if (!decoded || !decoded.exp) {
      return true;
    }
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};