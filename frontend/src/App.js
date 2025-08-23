import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [originalRequests, setOriginalRequests] = useState([]);
  const [rankedRequests, setRankedRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const API_SECRET = 'aidranker_secure';

  const sampleData = [
    {
      "school": "مدرسة دمشق الإعدادية النموذجية",
      "requested_by": "أحمد العلي",
      "description": "سقط سقف الصف العلوي جزئياً بعد عاصفة الأمس، مما أدى لتسرب الماء على المقاعد والسبورة، ونحتاج إلى إصلاحات هيكلية عاجلة قبل استئناف الفصول الدراسية.",
      "percent_done": 0.1
    },
    {
      "school": "مدرسة حلب الثانوية النموذجية",
      "requested_by": "سارة خليل",
      "description": "نظراً لزيادة عدد الطلاب في الصف الثالث، نواجه نقصاً حاداً في الكراسي والطاولات؛ حالياً يجلس بعضهم على الأرض، ونطلب توفير 25 طاولة و75 كرسي حتى نهاية الشهر.",
      "percent_done": 0.7
    },
    {
      "school": "مدرسة حمص العلمية الإعدادية",
      "requested_by": "علي حمود",
      "description": "Our science lab's main compound microscope suffered irreparable damage last week during an experiment; without it, students لا يستطيعون إجراء أي تحاليل، so we urgently need to purchase a replacement with at least 1000× magnification.",
      "percent_done": 0.3
    },
    {
      "school": "مدرسة اللاذقية المتوسطة النموذجية",
      "requested_by": "ليندا سليم",
      "description": "مكتبة المدرسة تحتوي على أقل من 50 كتاب إنجليزي لتغطية مقررات الفصل الأول للفرقة الثانية، مما يضطر الطلاب للاستعارة من المنزل، ونحتاج تمويلاً لشراء 200 عنوان جديد في أقرب فرصة.",
      "percent_done": 0.5
    },
    {
      "school": "مدرسة حماة الأساسية للبنين",
      "requested_by": "عمر ناصيف",
      "description": "طلبنا اليوم توفير وجبات غداء ساخنة يومية لـ120 طالباً من الأسر ذات الدخل المحدود؛ بدون هذه الوجبات، يعاني الطلاب من الجوع خلال اليوم الدراسي ويؤثر ذلك على تحصيلهم الأكاديمي.",
      "percent_done": 0.0
    }
  ];

  const rankRequests = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${apiUrl}/rank`, {
        requests: sampleData,
        auth_token: API_SECRET
      });
      
      setOriginalRequests(sampleData);
      setRankedRequests(response.data.ranked_requests);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to backend');
      console.error('Error:', err);
    }
    
    setLoading(false);
  };

  const getUrgencyColor = (label) => {
    switch (label) {
      case 'High urgency': return '#ff6b6b';
      case 'Medium urgency': return '#ffa726';
      case 'Low urgency': return '#66bb6a';
      default: return '#757575';
    }
  };

  const RequestCard = ({ request, index, isRanked = false }) => (
    <div className="request-card" style={{ borderLeft: `4px solid ${getUrgencyColor(request.urgency_label)}` }}>
      <div className="card-header">
        <div className="rank-badge">#{index + 1}</div>
        <div className="school-name">{request.school}</div>
      </div>
      
      <div className="card-content">
        <div className="description">{request.description}</div>
        
        <div className="card-footer">
          <div className="metadata">
            <span><strong>الطالب:</strong> {request.requested_by}</span>
            <span><strong>التقدم:</strong> {Math.round(request.percent_done * 100)}%</span>
          </div>
          
          {isRanked && (
            <div className="urgency-info">
              <div className="urgency-badge" style={{ backgroundColor: getUrgencyColor(request.urgency_label) }}>
                {request.urgency_label}
              </div>
              <div className="scores">
                <span>Model: {request.urgency_score_model?.toFixed(3)}</span>
                <span>Aggressive: {request.urgency_score_aggressive?.toFixed(3)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${request.percent_done * 100}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="App">
      <header className="app-header">
        <h1>AidRanker Demo</h1>
        <button 
          onClick={rankRequests} 
          disabled={loading}
          className="rank-button"
        >
          {loading ? 'Ranking...' : 'Rank Requests'}
        </button>
      </header>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {originalRequests.length > 0 && (
        <div className="comparison-container">
          <div className="column">
            <h2>Original Order</h2>
            <div className="requests-list">
              {originalRequests.map((request, index) => (
                <RequestCard 
                  key={index} 
                  request={request} 
                  index={index} 
                  isRanked={false}
                />
              ))}
            </div>
          </div>

          <div className="column">
            <h2>AI-Ranked by Urgency</h2>
            <div className="requests-list">
              {rankedRequests.map((request, index) => (
                <RequestCard 
                  key={index} 
                  request={request} 
                  index={index} 
                  isRanked={true}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
