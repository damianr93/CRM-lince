import { type ThunkAction, type Action, configureStore } from '@reduxjs/toolkit';
import clientsSlice from './clients/clients';
import analyticsSlice from './analytics/analytics';

export const store = configureStore({
  reducer: {
    clients: clientsSlice.reducer,
    analytics: analyticsSlice.reducer
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;