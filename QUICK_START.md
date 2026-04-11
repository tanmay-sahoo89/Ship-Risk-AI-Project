# 🚀 Ship Risk AI - Quick Start (LOCAL TESTING)

## ⚡ 3-Step Launch

### Terminal 1: Start Backend

```bash
cd "c:\Tanmay\Code\NEURALGO\Ship Risk AI\ship\Ship-Risk-AI-Project"
pip install -r requirements.txt
python main_pipeline.py --mode full
python api_server.py
```

✅ Ready at: `http://localhost:8000`

### Terminal 2: Start Frontend

```bash
cd "c:\Tanmay\Code\NEURALGO\Ship Risk AI\ship\Ship-Risk-AI-Project\ship-risk-ai"
npm install
npm run dev
```

✅ Ready at: `http://localhost:5173`

### Step 3: Open Browser

**Dashboard**: http://localhost:5173

---

## 📋 What to Test

- [ ] Dashboard loads
- [ ] 6000+ shipments visible
- [ ] Risk metrics display
- [ ] Charts render
- [ ] No red errors in console
- [ ] Can click Alerts/Recommendations tabs

---

## 🎯 Deployment Status

- ✅ **Code**: Ready (all Python + React verified)
- ✅ **Data**: Ready (6000 shipments loaded)
- ✅ **Testing**: LOCAL ONLY (not deployed yet)
- ❌ **Hosting**: NOT LIVE (waiting for your approval)

---

## ⏸️ When Ready to Deploy

**Tell me**: "Deploy now"

Then I will:

1. Deploy Firestore rules
2. Deploy React app to Firebase
3. Your site goes live at: https://ship-risk-ai.web.app

---

**Test locally first → Then say deploy → Then live on web** ✅
