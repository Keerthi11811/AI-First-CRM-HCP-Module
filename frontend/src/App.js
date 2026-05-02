import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector, Provider } from 'react-redux';
import { configureStore, createSlice } from '@reduxjs/toolkit';

// --- 1. REDUX STATE CONFIGURATION ---
const hcpSlice = createSlice({
  name: 'hcp',
  initialState: { 
    hcp_name: '', 
    interaction_type: '', 
    sentiment: '', 
    topics: '', 
    attendees: '', 
    location: '', 
    materials: '', 
    samples: '', 
    outcomes: '', 
    follow_ups: [] 
  },
  reducers: {
    updateHCP: (state, action) => ({ ...state, ...action.payload }),
    resetForm: () => ({ 
      hcp_name: '', interaction_type: '', sentiment: '', topics: '', 
      attendees: '', location: '', materials: '', samples: '', outcomes: '', follow_ups: [] 
    })
  },
});

const { updateHCP } = hcpSlice.actions;
const store = configureStore({ reducer: { hcp: hcpSlice.reducer } });

// --- 2. MAIN APPLICATION COMPONENT ---
function AppContent() {
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [socket, setSocket] = useState(null);
  const hcpData = useSelector((state) => state.hcp);
  const dispatch = useDispatch();
  
  // Refs for hidden file inputs and chat scrolling
  const materialsInputRef = useRef(null); 
  const samplesInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Initialize WebSocket Connection
  useEffect(() => {
    const ws = new WebSocket('ws://127.0.0.1:8000/ws/chat');
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'AI_UPDATE') {
          dispatch(updateHCP(data.payload));
          setChatHistory(prev => [...prev, { 
            role: 'ai', 
            text: `✅ Data extracted: ${data.payload.hcp_name || 'HCP'} profile updated.` 
          }]);
        }
      } catch (err) {
        console.error("WebSocket Message Error:", err);
      }
    };
    setSocket(ws);
    return () => ws.close();
  }, [dispatch]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSync = () => {
    if (socket?.readyState === WebSocket.OPEN && input.trim()) {
      setChatHistory(prev => [...prev, { role: 'user', text: input }]);
      socket.send(JSON.stringify({ message: input }));
      setInput('');
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Navigation Bar */}
      <header style={styles.header}>
        <h2 style={styles.title}>Log HCP Interaction</h2>
      </header>

      <div style={styles.mainLayout}>
        {/* LEFT PANEL: CRM FORM */}
        <div style={styles.formSection}>
          <div style={styles.card}>
            <h3 style={styles.sectionLabel}>Interaction Details</h3>
            
            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>HCP Name</label>
                <input style={styles.input} value={hcpData.hcp_name} placeholder="Search or select HCP..." readOnly />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Interaction Type</label>
                <select 
                  style={styles.input} 
                  value={hcpData.interaction_type} 
                  onChange={(e) => dispatch(updateHCP({ interaction_type: e.target.value }))}
                >
                  <option value="">Select Type...</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Call">Call</option>
                  <option value="Email">Email</option>
                </select>
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Date</label>
                <input type="date" style={styles.input} defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Time</label>
                <input type="time" style={styles.input} defaultValue={new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} />
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Attendees</label>
                <input style={styles.input} value={hcpData.attendees} placeholder="Names of those present..." readOnly />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Location</label>
                <input style={styles.input} value={hcpData.location} placeholder="Facility/Clinic name..." readOnly />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Topics Discussed</label>
              <textarea 
                style={{...styles.input, height: '60px'}} 
                value={hcpData.topics} 
                placeholder="Key discussion points will appear here..." 
                readOnly 
              />
            </div>

            <div style={styles.subHeader}>Materials Shared / Samples Distributed</div>
            
            <div style={styles.row}>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Materials Shared</label>
                    <div style={styles.readField}>{hcpData.materials || "No materials added."}</div>
                </div>
                <input 
                  type="file" 
                  ref={materialsInputRef} 
                  style={{display:'none'}} 
                  onChange={(e) => dispatch(updateHCP({materials: e.target.files[0].name}))} 
                />
                <button style={styles.iconBtn} onClick={() => materialsInputRef.current.click()}>🔍 Search/Add</button>
            </div>

            <div style={styles.row}>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Samples Distributed</label>
                    <div style={styles.readField}>{hcpData.samples || "No samples added."}</div>
                </div>
                <input 
                  type="file" 
                  ref={samplesInputRef} 
                  style={{display:'none'}} 
                  onChange={(e) => dispatch(updateHCP({samples: e.target.files[0].name}))} 
                />
                <button style={styles.iconBtn} onClick={() => samplesInputRef.current.click()}>+ Add Sample</button>
            </div>

            <label style={styles.label}>Observed/Inferred HCP Sentiment</label>
            <div style={styles.sentimentRow}>
              {['positive', 'neutral', 'negative'].map((s) => (
                <label key={s} style={styles.radioLabel}>
                  <input type="radio" checked={hcpData.sentiment === s} readOnly />
                  <span style={styles.sentimentText}>
                    {s === 'positive' ? '😊 Positive' : s === 'neutral' ? '😐 Neutral' : '☹️ Negative'}
                  </span>
                </label>
              ))}
            </div>

            <div style={{marginTop: '20px'}}>
              <label style={styles.label}>Outcomes</label>
              <textarea 
                style={{...styles.input, height: '60px'}} 
                value={hcpData.outcomes} 
                placeholder="Key outcomes or agreements..." 
                readOnly 
              />
            </div>

            <label style={{...styles.label, color: '#3182ce', marginTop: '20px'}}>AI Suggested Follow-ups:</label>
            <div style={{minHeight: '20px'}}>
              {hcpData.follow_ups.map((f, i) => (
                <div key={i} style={styles.followUpLink}>+ {f}</div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: AI SIDEBAR */}
        <aside style={styles.sidebar}>
          <div style={styles.aiHeader}>
            <div style={{fontWeight: 'bold', fontSize: '15px'}}>🤖 AI Assistant</div>
            <div style={{fontSize: '11px', color: '#718096'}}>Log interaction via chat</div>
          </div>
          
          <div style={styles.chatArea}>
            <div style={styles.aiBubble}>
              Describe your meeting (e.g., "Met Dr. Rossi at City Clinic with Nurse Jo. We discussed oncology trials and she was positive.")
            </div>
            {chatHistory.map((msg, i) => (
              <div key={i} style={msg.role === 'user' ? styles.userBubble : styles.successBubble}>
                {msg.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div style={styles.inputArea}>
            <input 
              style={styles.chatInput} 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Describe interaction..." 
              onKeyPress={(e) => e.key === 'Enter' && handleSync()}
            />
            <button onClick={handleSync} style={styles.logBtn}>▲ Log</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

// --- 3. STYLES DEFINITION ---
const styles = {
  container: { background: '#f7fafc', height: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  header: { background: '#fff', padding: '12px 40px', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' },
  title: { fontSize: '18px', color: '#1a202c', margin: 0, fontWeight: '600' },
  mainLayout: { display: 'flex', height: 'calc(100vh - 55px)' },
  formSection: { flex: 1, padding: '25px 40px', overflowY: 'auto' },
  card: { background: '#fff', padding: '35px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  sectionLabel: { fontSize: '17px', fontWeight: '600', marginBottom: '25px', borderBottom: '1px solid #edf2f7', paddingBottom: '12px', color: '#2d3748' },
  subHeader: { fontSize: '13px', fontWeight: 'bold', color: '#4a5568', margin: '25px 0 15px 0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  row: { display: 'flex', gap: '20px', alignItems: 'flex-end', marginBottom: '20px' },
  inputGroup: { flex: 1 },
  label: { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#718096', marginBottom: '8px' },
  input: { width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', color: '#1a202c', outline: 'none', transition: 'border 0.2s' },
  readField: { padding: '10px', borderBottom: '1px solid #edf2f7', fontSize: '13px', color: '#4a5568', minHeight: '20px', background: '#fcfcfc' },
  iconBtn: { padding: '10px 15px', fontSize: '12px', background: '#fff', border: '1px solid #cbd5e0', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '500' },
  sentimentRow: { display: 'flex', gap: '30px', marginTop: '10px' },
  radioLabel: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  sentimentText: { fontSize: '14px', color: '#4a5568' },
  followUpLink: { color: '#3182ce', fontSize: '13px', marginTop: '10px', fontWeight: '500' },
  sidebar: { width: '380px', background: '#fff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' },
  aiHeader: { padding: '20px', borderBottom: '1px solid #edf2f7', background: '#f8fafc' },
  chatArea: { flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' },
  aiBubble: { background: '#ebf8ff', padding: '15px', borderRadius: '12px', fontSize: '13px', color: '#2c5282', lineHeight: '1.5', border: '1px solid #bee3f8' },
  userBubble: { background: '#f7fafc', padding: '15px', borderRadius: '12px', borderLeft: '5px solid #3182ce', fontSize: '13px', color: '#1a202c', alignSelf: 'flex-start', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  successBubble: { background: '#f0fff4', padding: '15px', borderRadius: '12px', border: '1px solid #c6f6d5', fontSize: '13px', color: '#22543d', fontWeight: '500' },
  inputArea: { padding: '20px', borderTop: '1px solid #edf2f7', display: 'flex', gap: '12px', background: '#fff' },
  chatInput: { flex: 1, padding: '12px', border: '1px solid #cbd5e0', borderRadius: '8px', color: '#000', fontSize: '14px', outline: 'none' },
  logBtn: { background: '#2d3748', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }
};

export default function App() { 
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  ); 
}