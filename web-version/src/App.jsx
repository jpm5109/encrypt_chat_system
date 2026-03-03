import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  updateDoc, 
  arrayUnion, 
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import { 
  Send, 
  UserPlus, 
  Users, 
  MessageSquare, 
  LogOut, 
  Check, 
  X, 
  ShieldCheck, 
  Search, 
  User, 
  Copy, 
  ShieldAlert,
  Clock,
  ArrowLeft
} from 'lucide-react';

// --- Firebase Initialization ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'vault-chat-v5';

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchId, setSearchId] = useState('');
  const [inputText, setInputText] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [view, setView] = useState('chats'); // 'chats' | 'friends'
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ msg: '', type: 'info' });
  const scrollRef = useRef(null);

  // Helper for notifications
  const showStatus = (msg, type = 'info') => {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: '', type: 'info' }), 4000);
  };

  // 1. Auth & Initial Connection
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Connection Error:", err);
        showStatus("Connection failed. Check network.", "error");
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setLoading(false);
        setProfile(null);
      }
    });
    return () => unsub();
  }, []);

  // 2. Data Listeners (Profile, Friends, Requests)
  useEffect(() => {
    if (!user) return;

    const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    const requestsColl = collection(db, 'artifacts', appId, 'users', user.uid, 'requests');

    // Profile listener
    const unsubProfile = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        setFriends(data.friends || []);
      }
      setLoading(false);
    }, (err) => console.error("Profile Error:", err));

    // Friend Requests listener
    const unsubRequests = onSnapshot(requestsColl, (snap) => {
      setPendingRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Requests Error:", err));

    return () => {
      unsubProfile();
      unsubRequests();
    };
  }, [user]);

  // 3. Messaging Listener
  useEffect(() => {
    if (!user || !activeChat) {
      setMessages([]);
      return;
    }

    const chatId = [user.uid, activeChat.uid].sort().join('_');
    const msgColl = collection(db, 'artifacts', appId, 'public', 'data', `chat_${chatId}`);
    
    const unsubMsgs = onSnapshot(msgColl, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort manually as complex queries (orderBy) are restricted
      setMessages(msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)));
    }, (err) => console.error("Message Error:", err));

    return () => unsubMsgs();
  }, [user, activeChat]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Handlers ---

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!nicknameInput.trim() || !user) return;

    try {
      setLoading(true);
      const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
      const discoveryRef = doc(db, 'artifacts', appId, 'public', 'data', 'discovery', user.uid);

      const profileData = {
        uid: user.uid,
        nickname: nicknameInput.trim(),
        friends: [],
        createdAt: Date.now()
      };

      await setDoc(profileRef, profileData);
      await setDoc(discoveryRef, { uid: user.uid, nickname: profileData.nickname });
      showStatus("Account secured.", "success");
    } catch (err) {
      console.error(err);
      showStatus("Account creation failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchId || searchId === user.uid) return;
    if (friends.some(f => f.uid === searchId)) {
      showStatus("Already friends.", "info");
      return;
    }

    try {
      const targetDiscRef = doc(db, 'artifacts', appId, 'public', 'data', 'discovery', searchId);
      const targetSnap = await getDoc(targetDiscRef);
      
      if (!targetSnap.exists()) {
        showStatus("User ID not found.", "error");
        return;
      }

      const targetReqRef = doc(db, 'artifacts', appId, 'users', searchId, 'requests', user.uid);
      await setDoc(targetReqRef, {
        fromUid: user.uid,
        fromNickname: profile.nickname,
        timestamp: Date.now()
      });
      
      showStatus("Request sent!");
      setSearchId('');
    } catch (err) {
      console.error(err);
      showStatus("Request failed.", "error");
    }
  };

  const handleAcceptRequest = async (req) => {
    const myRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
    const theirRef = doc(db, 'artifacts', appId, 'users', req.fromUid, 'profile', 'data');
    const myReqDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'requests', req.fromUid);

    try {
      await updateDoc(myRef, { friends: arrayUnion({ uid: req.fromUid, nickname: req.fromNickname }) });
      await updateDoc(theirRef, { friends: arrayUnion({ uid: user.uid, nickname: profile.nickname }) });
      await deleteDoc(myReqDoc);
      showStatus(`Connected with ${req.fromNickname}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const chatId = [user.uid, activeChat.uid].sort().join('_');
    const msgColl = collection(db, 'artifacts', appId, 'public', 'data', `chat_${chatId}`);

    try {
      await addDoc(msgColl, {
        sender: user.uid,
        text: inputText,
        timestamp: Date.now()
      });
      setInputText('');
    } catch (err) {
      console.error(err);
    }
  };

  const copyMyId = () => {
    const textarea = document.createElement('textarea');
    textarea.value = user.uid;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showStatus("ID Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-400">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] tracking-widest uppercase font-bold text-cyan-500">Vault Session Starting...</p>
      </div>
    );
  }

  // Onboarding Screen
  if (!user || !profile) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
              <ShieldCheck className="text-cyan-400 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Initialize Account</h2>
            <p className="text-slate-400 text-sm">Create a secure nickname to join the network.</p>
          </div>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Secure Nickname</label>
              <input 
                type="text"
                placeholder="e.g. ShadowWalker"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all text-white"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-cyan-900/20 active:scale-[0.98]"
            >
              Enter Vault
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <div className={`fixed inset-0 z-20 md:relative md:flex w-full md:w-80 flex-col border-r border-slate-800 bg-slate-950 transition-transform ${activeChat ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
        <div className="p-5 flex items-center justify-between border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-cyan-400 w-5 h-5" />
            <h1 className="text-sm font-black uppercase tracking-tighter">VaultChat</h1>
          </div>
          <div className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono">v1.0.2</div>
        </div>

        {/* Identity Section */}
        <div className="p-4 m-3 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Your Security ID</p>
          <div className="flex gap-2 items-center bg-black/40 p-3 rounded-xl border border-slate-700/50 group">
            <code className="text-[10px] text-cyan-300 truncate flex-1 font-mono">{user.uid}</code>
            <button onClick={copyMyId} className="text-slate-500 hover:text-cyan-400 transition-colors">
              <Copy size={14} />
            </button>
          </div>
        </div>

        {status.msg && (
          <div className={`mx-4 mb-3 p-2 text-[10px] rounded-lg border flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
            status.type === 'error' ? 'bg-red-900/20 text-red-400 border-red-800/50' : 'bg-cyan-900/20 text-cyan-300 border-cyan-800/50'
          }`}>
            <Clock size={12} /> {status.msg}
          </div>
        )}

        <nav className="flex gap-1 px-4 mb-4">
          <button 
            onClick={() => setView('chats')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${view === 'chats' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:bg-slate-800'}`}
          >
            <MessageSquare size={14} /> CHATS
          </button>
          <button 
            onClick={() => setView('friends')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${view === 'friends' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:bg-slate-800'}`}
          >
            <Users size={14} /> SOCIAL
          </button>
        </nav>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {view === 'chats' ? (
            <div className="space-y-1">
              {friends.length === 0 && (
                <div className="py-20 text-center space-y-2 opacity-30">
                  <MessageSquare className="mx-auto" />
                  <p className="text-xs">No connections found</p>
                </div>
              )}
              {friends.map(f => (
                <button
                  key={f.uid}
                  onClick={() => setActiveChat(f)}
                  className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${activeChat?.uid === f.uid ? 'bg-slate-800 shadow-xl' : 'hover:bg-slate-900/50'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center font-bold text-cyan-400 shadow-sm">
                    {f.nickname[0].toUpperCase()}
                  </div>
                  <div className="flex-1 text-left truncate">
                    <p className="text-sm font-bold text-slate-200">{f.nickname}</p>
                    <p className="text-[10px] text-green-500 font-medium">Session Active</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-8 py-2">
              <div className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Connect New Peer</h3>
                <div className="space-y-2">
                  <input 
                    type="text"
                    placeholder="Paste Peer ID..."
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs focus:ring-1 focus:ring-cyan-500 outline-none text-white font-mono"
                  />
                  <button 
                    onClick={handleSendRequest}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-900/20 active:scale-95"
                  >
                    <UserPlus size={14} /> SEND REQUEST
                  </button>
                </div>
              </div>

              {pendingRequests.length > 0 && (
                <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Inbox</h3>
                  {pendingRequests.map(r => (
                    <div key={r.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center justify-between shadow-lg">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-200">{r.fromNickname}</span>
                        <span className="text-[9px] text-slate-500 font-mono">wants to connect</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAcceptRequest(r)}
                          className="p-2 bg-green-600/20 text-green-500 rounded-lg hover:bg-green-600 hover:text-white transition-all"
                        >
                          <Check size={16} />
                        </button>
                        <button className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:bg-red-600/20 hover:text-red-500 transition-all">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/30 flex items-center justify-between">
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
              <User size={14} className="text-cyan-400" />
            </div>
            <span className="text-xs font-bold text-slate-400 truncate tracking-tight">{profile.nickname}</span>
          </div>
          <button onClick={() => window.location.reload()} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-slate-900 shadow-2xl relative">
        {activeChat ? (
          <>
            <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/40 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2 text-slate-400">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-9 h-9 rounded-xl bg-cyan-600 flex items-center justify-center font-black text-sm shadow-lg shadow-cyan-900/40">
                  {activeChat.nickname[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">{activeChat.nickname}</h2>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] text-slate-500 font-medium">E2E Encrypted</span>
                  </div>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-800/20 via-transparent to-transparent">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                  <ShieldCheck size={64} />
                  <p className="text-xs font-mono">SECURE CHANNEL OPENED</p>
                </div>
              )}
              {messages.map((m, idx) => (
                <div key={m.id || idx} className={`flex ${m.sender === user.uid ? 'justify-end' : 'justify-start'} animate-in fade-in zoom-in-95 duration-300`}>
                  <div className={`max-w-[80%] md:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.sender === user.uid 
                    ? 'bg-cyan-600 text-white rounded-br-none shadow-lg shadow-cyan-900/20' 
                    : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50'
                  }`}>
                    {m.text}
                    <div className={`text-[9px] mt-1 opacity-50 text-right ${m.sender === user.uid ? 'text-cyan-100' : 'text-slate-400'}`}>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-5 bg-slate-950/60 border-t border-slate-800/50 backdrop-blur-xl">
              <div className="max-w-4xl mx-auto flex gap-3">
                <input 
                  type="text"
                  placeholder="Message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-slate-900/80 border border-slate-700 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-white placeholder-slate-600"
                />
                <button 
                  type="submit" 
                  disabled={!inputText.trim()}
                  className="w-12 h-12 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:grayscale text-white flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-cyan-900/20"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-8 p-12">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-10 animate-pulse"></div>
              <div className="p-10 rounded-[2.5rem] bg-slate-800/20 border border-slate-800 shadow-2xl relative z-10">
                <ShieldCheck size={80} className="text-slate-700" />
              </div>
            </div>
            <div className="text-center max-w-sm space-y-3">
              <h3 className="text-2xl font-black text-slate-200 tracking-tight">Private Secure Messaging</h3>
              <p className="text-sm leading-relaxed text-slate-500">All communication is decentralized and secured with one-time session IDs. Share your ID to start a connection.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}