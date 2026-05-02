import { configureStore, createSlice } from '@reduxjs/toolkit';

const hcpSlice = createSlice({
  name: 'hcp',
  initialState: { hcp_name: '', sentiment: '', topics: '' },
  reducers: {
    updateHCP: (state, action) => {
      // This merges the AI-extracted data into the Redux state
      return { ...state, ...action.payload };
    },
  },
});

export const { updateHCP } = hcpSlice.actions;
export const store = configureStore({
  reducer: {
    hcp: hcpSlice.reducer,
  },
});