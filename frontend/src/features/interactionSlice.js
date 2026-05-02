import { createSlice } from '@reduxjs/toolkit';

const interactionSlice = createSlice({
  name: 'interaction',
  initialState: {
    hcp_name: '',
    sentiment: '',
    topics: '',
    isLoading: false
  },
  reducers: {
    syncWithAI: (state, action) => {
      return { ...state, ...action.payload, isLoading: false };
    },
    setLoading: (state) => { state.isLoading = true; }
  }
});

export const { syncWithAI, setLoading } = interactionSlice.actions;
export default interactionSlice.reducer;