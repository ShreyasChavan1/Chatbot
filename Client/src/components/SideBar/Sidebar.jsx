import {React , useState , useEffect} from 'react'
import './Sidebar.css';
import { assets } from '../../assets/assets';
import { auth } from '../../../../Backend/lib/firebase';
import { Context } from '../../../../Backend/context/context';
import { useContext } from 'react';
import { signOut } from 'firebase/auth';


const Sidebar = () => {
    
    const {setPass,setEmail,extended,setExtended,onSent,threads,openThread,createnewThread,deleteThread,loading,setUsername,isDark,setIsDark} = useContext(Context);
    
    const signOutLogic = async() =>{
        await signOut(auth);
        // setUser("");
        setPass("");
        setEmail("");
        setUsername("")
    }
   

  return (
   <div className={isDark ? "dark-sidebar" : "sidebar"}>
        <div className="top">
            {/* <img src={assets.menu_icon} alt=""  className="menu" /> */}
            <span onClick={()=>setExtended(prev=>!prev)} className="material-symbols-outlined menu">menu</span>
              <div onClick={createnewThread} className="new-chat">
                <span className="material-symbols-outlined">add</span>
                {extended?<p>New Chat</p>:null} 
                {/* //sidebar extended or collapsed loggic */}
            </div>
                {extended?
           <div className="recent">
        {threads.length === 0 && <p>No chats yet</p>}

        {threads.map(t => {
  const preview =
    typeof t.lastMessage === "string"
      ? t.lastMessage
      : "";

  return (
    <div
      key={t.id}
      className="recent-entry"
      onClick={() => openThread(t.id)}
    >
      
        <span className="material-symbols-outlined">chat</span>
        <p dangerouslySetInnerHTML={{__html: preview
            ? preview.length > 20
              ? preview.slice(0, 20) + "..."
              : preview
            : "New Chat"}}>
          
        </p>
      
      <span className="material-symbols-outlined" onClick={(e) => {
        e.stopPropagation();   // so you don’t open the chat by accident
        deleteThread(t.id);
      }}>delete</span>
      
    </div>
  );
})}

      </div>
                :null}
        </div>
        <div className="bottom">
            <div onClick={()=>onSent("Please help me with usage of google Gemini")} className="bottom-item recent-entry">
                <span className={`material-symbols-outlined ${loading ? "blinking" : ""}`}>help</span>
                {extended?<p>Help</p>:null}
            </div>
            <div onClick={()=>setIsDark(prev => !prev)} className="bottom-item recent-entry">
                <span className="material-symbols-outlined">{isDark ? "light_mode" :"dark_mode"}</span>
                {extended?<p>{isDark ? "Light" : "Dark"}</p>:null}
            </div>
            <div onClick={signOutLogic} className="bottom-item recent-entry">
                <span className="material-symbols-outlined">logout</span>
                {extended?<p>logout</p>:null}
            </div>
        </div>
   </div>
  )
}

export default Sidebar