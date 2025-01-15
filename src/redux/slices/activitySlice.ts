
import rutas from "@/utils/endpoints";
import { CreateUser, User } from "@/types/user";
import { createSlice } from "@reduxjs/toolkit";
import { createUser, fetchUsers } from "../service/userService";
import { deleteUser } from "../service/userService";
import { updateUser } from "../service/userService";
import { fetchActivity } from "../service/activityService";
import { Activity } from "@/types/activity";

const activitySlice = createSlice({
  name: "activity",
  initialState: 
    {
      activities:  [] as Activity[] ,
      message: null as string | null,
      status: 'idle',
    },
  reducers: {
  },
  extraReducers: (builder) => {
    builder
    .addCase(fetchActivity.pending, (state) => {
      state.status = 'loading';
    })
    .addCase(fetchActivity.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.activities = action.payload.data;
    });
  }
});

export const activitySliceReducer = activitySlice.reducer;
