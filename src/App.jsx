import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

// 🌐 आपकी रेंडर वाली लाइव बैकएंड लिंक
const API_BASE_URL = 'https://my-skills-api-p955.onrender.com';

function App() {
  const [skills, setSkills] = useState([]);
  const [skillName, setSkillName] = useState('');
  const [skillStatus, setSkillStatus] = useState('Learning');
  const [skillCategory, setSkillCategory] = useState('Frontend'); // 'Frontend', 'Backend', 'Database'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Learning', 'Upcoming', 'Mastered'
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // 📝 एडिट फीचर के लिए आवश्यक स्टेट्स
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('Learning');
  const [editCategory, setEditCategory] = useState('Frontend');

  // लॉगिन और साइनअप के लिए स्टेट्स
  const [token, setToken] = useState(localStorage.getItem('userToken') || '');
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [profileImage, setProfileImage] = useState(localStorage.getItem('userProfileImage') || '');
  const [uploading, setUploading] = useState(false);

  // 1. डेटाबेस से डेटा लाना (GET)
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
          setIsSignup(false);
        } else {
          localStorage.setItem('userToken', res.data.token);
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

  // 📸 इमेज अपलोड करने का फंक्शन
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
        alert("इमेज अपलोड करने में कुछ गड़बड़ हुई!");
      })
      .finally(() => setUploading(false));
  };

  // 4. नई स्किल जोड़ना (POST)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!skillName) { alert("कृपया स्किल का नाम लिखें!"); return; }
    
    const newSkill = { name: skillName, status: skillStatus, category: skillCategory };
    const savedToken = localStorage.getItem('userToken');
    
    axios.post(`${API_BASE_URL}/api/skills`, newSkill, {
      headers: { Authorization: `Bearer ${savedToken}` }
    })
      .then(() => { 
        setSkillName(''); 
        fetchSkills(); 
      })
      .catch(err => console.error(err));
  };

  // 5. स्टेटस त्वरित बदलना (Mark Mastered / Learn Again)
  const handleUpdateStatus = (id, currentStatus) => {
    const nextStatus = currentStatus === 'Learning' ? 'Mastered' : 'Learning';
    const savedToken = localStorage.getItem('userToken');
    axios.put(`${API_BASE_URL}/api/skills/${id}`, { status: nextStatus }, {
      headers: { Authorization: `Bearer ${savedToken}` }
    })
      .then(() => fetchSkills())
      .catch(err => console.error(err));
  };

  // ✏️ 6. स्किल को एडिट मोड में डालना (फ्रंटएंड पर वैल्यू सेट करना)
  const startEdit = (skill) => {
    setEditingSkillId(skill._id);
    setEditName(skill.name);
    setEditStatus(skill.status || 'Learning');
    setEditCategory(skill.category || 'Frontend');
  };

  // 🔄 7. पूरी तरह एडिटेड स्किल को बैकएंड API पर सेव करना (PUT Call)
  const handleSaveEdit = (id) => {
    if (!editName) { alert("स्किल का नाम खाली नहीं हो सकता!"); return; }

    const updatedSkillData = { name: editName, status: editStatus, category: editCategory };
    const savedToken = localStorage.getItem('userToken');

    axios.put(`${API_BASE_URL}/api/skills/${id}`, updatedSkillData, {
      headers: { Authorization: `Bearer ${savedToken}` }
    })
      .then(() => {
        setEditingSkillId(null); // एडिट मोड बंद करें
        fetchSkills(); // लिस्ट रिफ्रेश करें
      })
      .catch(err => console.error("अपडेट करने में एरर आया:", err));
  };

  // 8. डिलीट करना (DELETE)
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

  // 🔍 सर्च और फ़िल्टर लॉजिक
  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || skill.status === filterStatus;
    return matchesSearch && matchesFilter;
  });   

  const fetchAiSuggestions = async () => {
    setAiLoading(true);
    setAiSuggestion('');
    try {
        const token = localStorage.getItem('userToken'); // यहाँ 'userToken' कर दिया है
        const response = await axios.post('https://my-skills-api-p955.onrender.com/api/ai-suggestions', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setAiSuggestion(response.data.suggestion);
    } catch (error) {
        console.error("AI Error:", error);
        setAiSuggestion("एआई सुझाव लोड करने में विफल। कृपया बाद में प्रयास करें।");
    } finally {
        setAiLoading(false);
    }
};

  // 📊 लाइव स्टेटिस्टिक्स
  const totalSkills = skills.length;
  const masteredCount = skills.filter(s => s.status === 'Mastered').length;
  const learningCount = skills.filter(s => s.status === 'Learning').length;
  const upcomingCount = skills.filter(s => s.status === 'Upcoming').length;

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

  return (
    <div className="app-container">
      
      {/* 📸 प्रोफाइल फोटो सेक्शन */}
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

      {/* 👑 हेडर सेक्शन */}
      <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h1 className="main-title" style={{ fontSize: '1.6rem', margin: 0 }}>नमस्ते आशुतोष! मेरी स्किल्स 🚀</h1>
        <button onClick={handleLogout} className="btn btn-delete" style={{ padding: '6px 12px', fontSize: '14px' }}>
          Logout 🚪
        </button>
      </div>
      
      <p style={{ color: '#64748b', marginBottom: '20px' }}>यह आपका पूरी तरह से सुरक्षित (Authenticated) मर्न डैशबोर्ड है:</p>
      
      {/* 📊 लाइव स्टेटिस्टिक्स */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginBottom: '25px' }}>
        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{totalSkills}</span>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Total Skills</p>
        </div>
        <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #a7f3d0' }}>
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#047857' }}>{masteredCount}</span>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#065f46', fontWeight: '500' }}>Mastered 🏆</p>
        </div>
        <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #bfdbfe' }}>
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#1d4ed8' }}>{learningCount}</span>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#1e40af', fontWeight: '500' }}>Learning ⚡</p>
        </div>
        <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #fde68a' }}>
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#b45309' }}>{upcomingCount}</span>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#92400e', fontWeight: '500' }}>Upcoming ⏳</p>
        </div>
      </div>

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
        <select value={skillCategory} onChange={(e) => setSkillCategory(e.target.value)} className="input-field" style={{ width: '130px' }}>
          <option value="Frontend">Frontend 💻</option>
          <option value="Backend">Backend ⚙️</option>
          <option value="Database">Database 🗄️</option>
        </select>
        <button type="submit" className="btn btn-submit">भेजें</button>
      </form>

      {/* 🔍 सर्च और फ़िल्टर बार */}
      <div style={{ marginBottom: '20px', background: '#f1f5f9', padding: '15px', borderRadius: '12px' }}>
        <input 
          type="text" 
          placeholder="🔍 अपनी स्किल सर्च करें..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field"
          style={{ width: '100%', marginBottom: '10px', padding: '10px' }}
        />
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '5px' }}>
          {['All', 'Learning', 'Upcoming', 'Mastered'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              type="button"
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: 'none',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: '500',
                backgroundColor: filterStatus === status ? '#10b981' : '#e2e8f0',
                color: filterStatus === status ? 'white' : '#475569',
                transition: 'all 0.2s'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

          <div className="ai-container" style={{ margin: '20px 0', padding: '20px', background: '#1e1e1e', borderRadius: '8px', border: '1px solid #ff0055' }}>
    <h3 style={{ color: '#fff', marginBottom: '10px' }}>🤖 AI Career Coach (Gemini 3.5)</h3>
    <button 
        onClick={fetchAiSuggestions} 
        disabled={aiLoading}
        style={{ padding: '10px 20px', background: '#ff0055', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
    >
        {aiLoading ? '🔄 Analyzing Skills...' : '✨ Ask AI for Next Skills'}
    </button>
    
    {aiSuggestion && (
        <div style={{ marginTop: '15px', color: '#ccc', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
            {aiSuggestion}
        </div>
    )}
</div>

          
      {/* Skills List */}
      <div>
        {filteredSkills.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#94a3b8' }}>कोई स्किल नहीं मिली या डेटाबेस खाली है...</p>
        ) : (
          <ul className="skills-list">
            {filteredSkills.map(skill => (
              <li key={skill._id} className="skill-item" style={{ background: editingSkillId === skill._id ? '#f1f5f9' : '' }}>
                
                {/* 📝 अगर यह स्किल एडिट मोड में है तो इनपुट फॉर्म दिखाएं */}
                {editingSkillId === skill._id ? (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', padding: '5px' }}>
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      className="input-field"
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="input-field">
                        <option value="Frontend">Frontend</option>
                        <option value="Backend">Backend</option>
                        <option value="Database">Database</option>
                      </select>
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="input-field">
                        <option value="Learning">Learning</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Mastered">Mastered</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                      <button onClick={() => handleSaveEdit(skill._id)} className="btn btn-submit" style={{ padding: '5px 15px', fontSize: '13px' }}>Save ✅</button>
                      <button onClick={() => setEditingSkillId(null)} className="btn btn-delete" style={{ padding: '5px 15px', fontSize: '13px', backgroundColor: '#64748b' }}>Cancel ❌</button>
                    </div>
                  </div>
                ) : (
                  // ✅ सामान्य रूप से दिखने वाली स्किल आइटम
                  <>
                    <div>
                      <span style={{ fontSize: '18px', fontWeight: '600', marginRight: '10px' }}>{skill.name}</span>
                      <span className={`badge ${skill.status === 'Mastered' ? 'badge-mastered' : 'badge-learning'}`}>{skill.status}</span>
                      <span style={{ fontSize: '12px', background: '#e2e8f0', color: '#475569', padding: '3px 8px', borderRadius: '4px', marginLeft: '5px', fontWeight: '500' }}>{skill.category || 'Frontend'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => startEdit(skill)} className="btn" style={{ padding: '6px 12px', fontSize: '14px', backgroundColor: '#eab308', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleUpdateStatus(skill._id, skill.status)} className="btn btn-mastered" style={{ padding: '6px 12px', fontSize: '14px' }}>
                        {skill.status === 'Learning' ? '⚡ Mark Mastered' : '🔄 Learn Again'}
                      </button>
                      <button onClick={() => handleDelete(skill._id)} className="btn btn-delete" style={{ padding: '6px 12px', fontSize: '14px' }}>Delete</button>
                    </div>
                  </>
                )}

              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;