import rutas from "@/utils/endpoints";
import { CreateUser, UpdateUser, User } from "@/types/user";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

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
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (data: CreateUser, { dispatch, rejectWithValue }) => {
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
        return { message: "Error al crear el usuario", error: error.response.data.error };
      }
      return { message: "An unexpected error occurred", error: "Unexpected error" };
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ userId, data }: { userId: number | undefined, data: User }, { dispatch, rejectWithValue }) => {
    try {
      const { createdAt, updatedAt, id, ...rest } = data
      const response = await usersAPI.patch(`${userId}/`, rest, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });
      dispatch(fetchUsers());
      return { message: response.data.message, data: response.data.data };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return { message: "Error al editar el usuario", error: error.response.data.error };
      }
      return { message: "An unexpected error occurred", error: "Unexpected error" };
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (userId: number, { dispatch, rejectWithValue }) => {
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
        return { message: "Error al eliminar el usuario", error: error.response.data.error };
      }
      return { message: 'An unknown error occurred' };
    }
  }
);