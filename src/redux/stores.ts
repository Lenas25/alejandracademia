


import {configureStore} from '@reduxjs/toolkit';
import { userSliceReducer } from './slices/userSlice';
import { TypedUseSelectorHook, useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { courseSliceReducer } from './slices/courseSlice';
import { enrollmentSliceReducer } from './slices/enrollmentSlice';
import { activitySliceReducer } from './slices/activitySlice';
import { gradeSliceReducer } from './slices/gradeSlice';


export const globalStore = configureStore({
    reducer: {
      user : userSliceReducer,
      course: courseSliceReducer,
      enrollment: enrollmentSliceReducer,
      activity: activitySliceReducer,
      grade: gradeSliceReducer,
    }
})

export type RootState = ReturnType<typeof globalStore.getState>;
export type AppDispatch = typeof globalStore.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;