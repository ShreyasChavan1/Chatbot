import { createContext, useState, useEffect } from "react";

import { onAuthStateChanged } from 'firebase/auth'
import { auth } from "../lib/firebase";
import { doc, deleteDoc, getDocs, setDoc, onSnapshot, collection, serverTimestamp, addDoc, orderBy, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import {  query } from "firebase/firestore";


export const Context = createContext();

const ContextProvider = (props) => {
  const [extended, setExtended] = useState(false)
  //theme change
  const [isDark,setIsDark] = useState(false)
  //for generative Ai
  const [input, setInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("")
  //for login
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  //saving login cred
  const [user, setUser] = useState(false);
  //conversation
  const [threads, setThreads] = useState([]);       // sidebar
  const [conversation, setConversation] = useState([]); // full chat
  const [activeThreadId, setActiveThreadId] = useState(null);
//for changes in login logout
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
       if (!user) {
      // User logged out — nuke all chat memory
      setConversation([]);
      setActiveThreadId(null);
      setShowResult(false);
    }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  //changes in chats per login
  useEffect(() => {
    if (!user) return;
    const threadsRef = collection(db, "userChats", user.uid, "threads");
    const unsub = onSnapshot(threadsRef, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setThreads(list)
    })
    return () => unsub();
  }, [user])

  //for keeping the username
  useEffect(() => {
  if (!user) return;

  const loadProfile = async () => {
    const ref = doc(db, "user", user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      setUsername(snap.data().username || "");
    }
  };

  loadProfile();
}, [user]);

  const createnewThread = async () => {
    setActiveThreadId(null);
    setShowResult(false)
    setConversation([]);
  }

const deleteThread = async (threadId) => {
  try {
    const messagesRef = collection(
      db,
      "userChats",
      user.uid,
      "threads",
      threadId,
      "messages"
    );
    const snap = await getDocs(messagesRef);
    // delete all messages first
    const deletes = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletes);
    // now delete the thread itself
    const threadRef = doc(
      db,
      "userChats",
      user.uid,
      "threads",
      threadId
    );
    await deleteDoc(threadRef);
    // clean your local UI
    setActiveThreadId(null);
    setConversation([]);
    setShowResult(false);

  } catch (err) {
    console.error("Delete failed:", err);
  }
};

  const openThread = async (threadId) => {
    setActiveThreadId(threadId);
    setShowResult(true);

    const msgref = collection(db, "userChats", user.uid, "threads", threadId, "messages");
    const q = query(msgref, orderBy("createdAt", "asc"))

    const snap = await getDocs(q);
    const msgs = snap.docs
      .map(d => d.data())
      .filter(m => typeof m.text === "string");
    setConversation(msgs)
  }

  const onSent = async (prompt) => {
    const message = prompt || input;
    if (!message.trim()) {
      return;
    }
    setLoading(true);
    setShowResult(true)
    let threadId = activeThreadId;

    const geminiHistory = (conversation || [])
      .filter(m => typeof m.text === "string")   // kill bad messages
      .map(m => ({
        role: m.role,
        parts: [{ text: m.text || "" }]
      }));

    const res = await fetch(
      "https://prompt-gpt.vercel.app/api/ask-gemini",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: message || "",
          history: geminiHistory
        })
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini API failed:", err);
      setLoading(false);
      return;
    }
    if (!threadId) {
      // Create thread ONLY when user actually sends a message
      const threadsRef = doc(
        collection(db, "userChats", user.uid, "threads")
      );
      await setDoc(threadsRef, {
        title: "New Chat",
        lastMessage: "",
        updatedAt: serverTimestamp()
      });

      threadId = threadsRef.id;
      setActiveThreadId(threadId);
    }
    const response = await res.json();
    const rawReply = response?.response || "Sorry, Gemini failed to answer.";
    
const normalizeText = (text) => {
  if (!text) return "";

  let lines = text.split("\n");
  let html = "";
  let inList = false;

  lines.forEach(line => {
    line = line.trim();
    if (!line) {
      html += "<br>";
      return;
    }
    // Headings: ### Title → <h3>Title</h3>
    if (line.startsWith("###")) {
      const heading = line.replace(/^#{1,6}\s*/, "");
      html += `<h3>${heading}</h3>`;
      return;
    }
    // Bold: **text** → <b>text</b>
    line = line.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    // Bullet points: * item → <li>item</li>
    if (line.startsWith("*") || line.startsWith("•")) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      const item = line.replace(/^[*•]\s*/, "");
      html += `<li>${item}</li>`;
      return;
    }
    // If we were in a list and hit a normal line, close list
    if (inList) {
      html += "</ul>";
      inList = false;
    }
    // Normal paragraph
    html += `<p>${line}</p>`;
  });
  if (inList) html += "</ul>";
  return html;
};

    // collapse big gaps
   const reply = normalizeText(rawReply);
    const usermsg = {
      role: "user",
      text: message || "",
      createdAt: serverTimestamp()
    }

    const modelmsg = {
      role: "model",
      text: reply || "",
      createdAt: serverTimestamp()
    }

    const msgRef = collection(db, "userChats", user.uid, "threads", threadId, "messages");
    await addDoc(msgRef, usermsg);
    await addDoc(msgRef, modelmsg)

    const threadRef = doc(db, "userChats", user.uid, "threads", threadId);
    await setDoc(
      threadRef,
      {
        lastMessage: reply || "",
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    setConversation(prev => [...prev, usermsg, modelmsg]);
    setInput("");
    setLoading(false);

  }


  const contextValue = {
    extended,
    setExtended,
    loading,
    setShowResult,
    showResult,
    onSent,
    input,
    setInput,
    username,
    setUsername,
    user,
    setUser,
    email,
    setEmail,
    pass,
    setPass,
    deleteThread,
    threads,
    conversation,
    activeThreadId,
    createnewThread,
    openThread,
    isDark,
    setIsDark
  }

  return (
    <Context.Provider value={contextValue}>
      {props.children}
    </Context.Provider>

  )
}
export default ContextProvider;