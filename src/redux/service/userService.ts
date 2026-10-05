import rutas from "@/utils/endpoints";
import { CreateUser, User } from "@/types/user";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { mapApiError } from "@/utils/extractErrorMessage";

const usersAPI = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BASE_URL}${rutas.users}`,
  headers: {
    'Content-Type': 'application/json'
  },
});

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await usersAPI.get('/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(mapApiError(error));
      }
      return rejectWithValue(mapApiError(error));
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (data: CreateUser, { dispatch }) => {
    try {
      const response = await usersAPI.post('/', data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });
      dispatch(fetchUsers());
      return { message: response.data.message, data: response.data.data };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return { message: "Error al crear el usuario", error: mapApiError(error) };
      }
      return { message: "Ocurrió un error inesperado", error: mapApiError(error) };
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ userId, data }: { userId: string | undefined, data: User }, { dispatch }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, sections, ...rest } = data
      const response = await usersAPI.patch(`${userId}/`, rest, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });
      dispatch(fetchUsers());
      return { message: response.data.message, data: response.data.data };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return { message: "Error al editar el usuario", error: mapApiError(error) };
      }
      return { message: "Ocurrió un error inesperado", error: mapApiError(error) };
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (userId: string, { dispatch }) => {
    try {
      const response = await usersAPI.delete(`${userId}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });
      dispatch(fetchUsers());
      return { message: response.data.message, data: response.data.data };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return { message: "Error al eliminar el usuario", error: mapApiError(error) };
      }
      return { message: "Ocurrió un error inesperado", error: mapApiError(error) };
    }
  }
);