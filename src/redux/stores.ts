


import {configureStore} from '@reduxjs/toolkit';
import { userSliceReducer } from './slices/userSlice';
import { TypedUseSelectorHook, useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { courseSliceReducer } from './slices/courseSlice';
import { sectionSliceReducer } from './slices/sectionSlice';
import { enrollmentSliceReducer } from './slices/enrollmentSlice';
import { activitySliceReducer } from './slices/activitySlice';
import { gradeSliceReducer } from './slices/gradeSlice';
import { paymentSliceReducer } from './slices/paymentSlice';
import { attendanceSliceReducer } from './slices/attendanceSlice';
import { reportSliceReducer } from './slices/reportSlice';
import { institutionConfigSliceReducer } from './slices/institutionConfigSlice';


export const globalStore = configureStore({
    reducer: {
      user : userSliceReducer,
      course: courseSliceReducer,
      section: sectionSliceReducer,
      enrollment: enrollmentSliceReducer,
      activity: activitySliceReducer,
      grade: gradeSliceReducer,
      payment: paymentSliceReducer,
      attendance: attendanceSliceReducer,
      report: reportSliceReducer,
      institutionConfig: institutionConfigSliceReducer,
    }
})

export type RootState = ReturnType<typeof globalStore.getState>;
export type AppDispatch = typeof globalStore.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;