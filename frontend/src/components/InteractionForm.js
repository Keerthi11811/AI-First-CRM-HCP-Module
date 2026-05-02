import React from 'react';
import { useSelector } from 'react-redux';

const InteractionForm = () => {
  const data = useSelector((state) => state.interaction);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', marginTop: '20px' }}>
      <h3>HCP Form (AI-Synced)</h3>
      <div><strong>Name:</strong> {data.hcp_name}</div>
      <div><strong>Sentiment:</strong> {data.sentiment}</div>
      <div><strong>Summary:</strong> {data.topics}</div>
      {data.isLoading && <p>AI is thinking...</p>}
    </div>
  );
};

export default InteractionForm;