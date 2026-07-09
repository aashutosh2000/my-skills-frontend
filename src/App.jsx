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

  const [profileImage, setProfileImage] = useState(localStorage.getItem('userProfileImage') || '');
  const [uploading, setUploading] = useState(false);

  // 1. डेटाबेस से डेटा लाना (GET) - अब टोकन के साथ
  const fetchSkills = () => {
    const savedToken = localStorage.getItem('userToken');
    axios.get(`${API_BASE_URL}/api/skills`, {
      headers: { Authorization: `Bearer ${savedToken}` }
    })
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
          localStorage.setItem('userProfileImage', res.data.profileImage || '');
          setProfileImage(res.data.profileImage || '');
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
    localStorage.removeItem('userProfileImage');
    setProfileImage('');
  };

  // 📸 इमेज अपलोड करने का फंक्शन (API Call)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    const savedToken = localStorage.getItem('userToken');

    axios.post(`${API_BASE_URL}/api/user/upload-profile`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${savedToken}` 
      }
    })
      .then(res => {
        alert(res.data.message);
        setProfileImage(res.data.profileImage);
        localStorage.setItem('userProfileImage', res.data.profileImage);
      })
      .catch(err => {
        console.error(err);
        alert("इमेज अपलोड करने में कुछ गड़बड़ हुई!");
      })
      .finally(() => setUploading(false));
  };

  // 4. नई स्किल जोड़ना (POST) - अब टोकन के साथ
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!skillName) { alert("कृपया स्किल का नाम लिखें!"); return; }
    const newSkill = { name: skillName, status: skillStatus };
    const savedToken = localStorage.getItem('userToken');
    
    axios.post(`${API_BASE_URL}/api/skills`, newSkill, {
      headers: { Authorization: `Bearer ${savedToken}` }
    })
      .then(() => { setSkillName(''); fetchSkills(); })
      .catch(err => console.error(err));
  };

  // 5. स्टेटस बदलना (PUT) - अब टोकन के साथ
  const handleUpdateStatus = (id, currentStatus) => {
    const nextStatus = currentStatus === 'Learning' ? 'Mastered' : 'Learning';
    const savedToken = localStorage.getItem('userToken');
    axios.put(`${API_BASE_URL}/api/skills/${id}`, { status: nextStatus }, {
      headers: { Authorization: `Bearer ${savedToken}` }
    })
      .then(() => fetchSkills())
      .catch(err => console.error(err));
  };

  // 6. डिलीट करना (DELETE) - अब टोकन के साथ
  const handleDelete = (id) => {
    if (window.confirm("क्या आप वाकई इसे डिलीट करना चाहते हैं?")) {
      const savedToken = localStorage.getItem('userToken');
      axios.delete(`${API_BASE_URL}/api/skills/${id}`, {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
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
  // ✅ लॉगिन होने के बाद असली स्किल्स डैशबोर्ड दिखेगा
  return (
    <div className="app-container">
      
      {/* 📸 प्रोफाइल फोटो अपलोड और डिस्प्ले सेक्शन (अब यह सबसे ऊपर रहेगा) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
        <div style={{ width: '70px', height: '70px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #10b981' }}>
          {profileImage ? (
            <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '30px' }}>👤</span>
          )}
        </div>
        <div>
          <label style={{ background: '#10b981', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>
            {uploading ? 'अपलोड हो रहा है...' : '📸 फोटो बदलें'}
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* 👑 हेडर सेक्शन जिसमें टाइटल और लॉगआउट बटन है */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h1 className="main-title" style={{ fontSize: '1.6rem', margin: 0 }}>नमस्ते आशुतोष! मेरी स्किल्स 🚀</h1>
        <button onClick={handleLogout} className="btn btn-delete" style={{ padding: '6px 12px', fontSize: '14px' }}>
          Logout 🚪
        </button>
      </div>
      
      <p style={{ color: '#64748b', marginBottom: '20px' }}>यह आपका पूरी तरह से सुरक्षित (Authenticated) मर्न डैशबोर्ड है:</p>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="form-box">
        <h3>➕ नई स्किल जोड़ें</h3>
        <input 
          type="text" 
          placeholder="स्किल का name" 
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