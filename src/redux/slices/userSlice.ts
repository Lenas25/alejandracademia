
import rutas from "@/utils/endpoints";
import { CreateUser, User } from "@/types/user";
import { createSlice } from "@reduxjs/toolkit";
import { createUser, fetchUsers } from "../service/userService";
import { deleteUser } from "../service/userService";
import { updateUser } from "../service/userService";

const userSlice = createSlice({
  name: "users",
  initialState: 
    {
      userLogin: null as User | null,
      users:  [] as User[] ,
      message: null as string | null,
      status: 'idle',
    },
  reducers: {
    setUser (state, action) {
      state.userLogin = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
    .addCase(fetchUsers.pending, (state) => {
      state.status = 'loading';
    })
    .addCase(fetchUsers.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.users = action.payload;
    })
    builder.addCase(createUser.fulfilled, (state, action) => {
      state.message = action.payload.message;
    });
    builder.addCase(updateUser.fulfilled, (state, action) => {
      state.message = action.payload.message;
    });
    builder.addCase(deleteUser.fulfilled, (state, action) => {
      state.message = action.payload.message;
    });
  }
});

export const userSliceReducer = userSlice.reducer;

export const { setUser } = userSlice.actions;
