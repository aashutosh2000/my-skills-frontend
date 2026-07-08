import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

// 🌐 आपकी रेंडर वाली लाइव बैकएंड लिंक यहाँ सेट कर दी है
const API_BASE_URL = 'https://my-skills-api-p955.onrender.com';

function App() {
  const [skills, setSkills] = useState([]);
  const [skillName, setSkillName] = useState('');
  const [skillStatus, setSkillStatus] = useState('Learning');

  // लॉगिन और साइनअप के लिए स्टेट्स
  const [token, setToken] = useState(localStorage.getItem('userToken') || '');
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 1. डेटाबेस से डेटा लाना (GET)
  const fetchSkills = () => {
    axios.get(`${API_BASE_URL}/api/skills`)
      .then(res => setSkills(res.data))
      .catch(err => console.error("डेटा लाने में एरर:", err));
  };

  useEffect(() => {
    if (token) {
      fetchSkills();
    }
  }, [token]);

  // 2. लॉगिन और साइनअप हैंडलर
  const handleAuth = (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("कृपया दोनों फ़ील्ड्स भरें!");
      return;
    }

    const endpoint = isSignup ? 'signup' : 'login';
    
    axios.post(`${API_BASE_URL}/api/${endpoint}`, { email, password })
      .then(res => {
        if (isSignup) {
          alert(res.data.message);
          setIsSignup(false); // साइनअप के बाद लॉगिन स्क्रीन पर भेजें
        } else {
          localStorage.setItem('userToken', res.data.token); // ब्राउज़र में चाबी सेव करें
          setToken(res.data.token);
        }
        setEmail('');
        setPassword('');
      })
      .catch(err => {
        alert(err.response?.data?.error || "कुछ गड़बड़ हुई!");
      });
  };

  // 3. लॉगआउट हैंडलर
  const handleLogout = () => {
    localStorage.removeItem('userToken');
    setToken('');
    setSkills([]);
  };

  // 4. नई स्किल जोड़ना (POST)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!skillName) { alert("कृपया स्किल का नाम लिखें!"); return; }
    const newSkill = { name: skillName, status: skillStatus };
    axios.post(`${API_BASE_URL}/api/skills`, newSkill)
      .then(() => { setSkillName(''); fetchSkills(); })
      .catch(err => console.error(err));
  };

  // 5. स्टेटस बदलना (PUT)
  const handleUpdateStatus = (id, currentStatus) => {
    const nextStatus = currentStatus === 'Learning' ? 'Mastered' : 'Learning';
    axios.put(`${API_BASE_URL}/api/skills/${id}`, { status: nextStatus })
      .then(() => fetchSkills())
      .catch(err => console.error(err));
  };

  // 6. डिलीट करना (DELETE)
  const handleDelete = (id) => {
    if (window.confirm("क्या आप वाकई इसे डिलीट करना चाहते हैं?")) {
      axios.delete(`${API_BASE_URL}/api/skills/${id}`)
        .then(() => fetchSkills())
        .catch(err => console.error(err));
    }
  };

  // 🔒 अगर यूजर लॉगिन नहीं है, तो उसे सिर्फ लॉगिन/साइनअप स्क्रीन दिखाएं
  if (!token) {
    return (
      <div className="auth-container">
        <h2 style={{ color: '#10b981' }}>{isSignup ? "🔒 नया अकाउंट बनाएं" : "🔑 लॉगिन करें"}</h2>
        <form onSubmit={handleAuth}>
          <input 
            type="email" 
            placeholder="अपनी ईमेल लिखें" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            style={{ width: '100%' }}
          />
          <input 
            type="password" 
            placeholder="पासवर्ड डालें" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            style={{ width: '100%' }}
          />
          <button type="submit" className="auth-btn">
            {isSignup ? "अकाउंट बनाएं" : "डैशबोर्ड खोलें"}
          </button>
        </form>
        <p className="toggle-text" onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? "पहले से अकाउंट है? " : "नया यूजर? "} 
          <span>{isSignup ? "लॉगिन करें" : "अकाउंट बनाएं"}</span>
        </p>
      </div>
    );
  }

  // ✅ लॉगिन होने के बाद असली स्किल्स डैशबोर्ड दिखेगा
  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="main-title" style={{ fontSize: '1.6rem' }}>नमस्ते आशुतोष! मेरी स्किल्स 🚀</h1>
        <button onClick={handleLogout} className="btn btn-delete" style={{ padding: '6px 12px', fontSize: '14px' }}>
          Logout 🚪
        </button>
      </div>
      <p style={{ color: '#64748b' }}>यह आपका पूरी तरह से सुरक्षित (Authenticated) मर्न डैशबोर्ड है:</p>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="form-box">
        <h3>➕ नई स्किल जोड़ें</h3>
        <input 
          type="text" 
          placeholder="स्किल का नाम" 
          value={skillName}
          onChange={(e) => setSkillName(e.target.value)}
          className="input-field"
        />
        <select value={skillStatus} onChange={(e) => setSkillStatus(e.target.value)} className="input-field" style={{ width: '130px' }}>
          <option value="Learning">Learning</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Mastered">Mastered</option>
        </select>
        <button type="submit" className="btn btn-submit">भेजें</button>
      </form>

      {/* Skills List */}
      <div>
        {skills.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8' }}>डेटाबेस खाली है या लोड हो रहा है...</p>
        ) : (
          <ul className="skills-list">
            {skills.map(skill => (
              <li key={skill._id} className="skill-item">
                <div>
                  <span style={{ fontSize: '18px', fontWeight: '600', marginRight: '10px' }}>{skill.name}</span>
                  <span className={`badge ${skill.status === 'Mastered' ? 'badge-mastered' : 'badge-learning'}`}>{skill.status}</span>
                </div>
                <div>
                  <button onClick={() => handleUpdateStatus(skill._id, skill.status)} className="btn btn-mastered" style={{ padding: '6px 12px', fontSize: '14px' }}>
                    {skill.status === 'Learning' ? '⚡ Mark Mastered' : '🔄 Learn Again'}
                  </button>
                  <button onClick={() => handleDelete(skill._id)} className="btn btn-delete" style={{ padding: '6px 12px', fontSize: '14px' }}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;