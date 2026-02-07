import { useState } from "react";
import LoginForm from "./login";
import RegisterForm from "./Registration";
import { useContext } from "react";
import { Context } from "../../../../Backend/context/context";
import "./auth.css";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [load, setLoad] = useState(false);

  const { email, setEmail, pass, setPass, username, setUsername} =
    useContext(Context);

  return (
    <div className="auth-container">


      {isLogin ? (
        <LoginForm
          email={email}
          setEmail={setEmail}
          pass={pass}
          setPass={setPass}
          load={load}
          setLoad={setLoad}
          setUsername={setUsername}
        />
      ) : (
        <RegisterForm
          email={email}
          setEmail={setEmail}
          pass={pass}
          setPass={setPass}
          username={username}
          setUsername={setUsername}
          load={load}
          setLoad={setLoad}
        />
        
      )}
      <div className="auth-toggle" onClick={()=>setIsLogin(prev => !prev)}>
        {/* <button onClick={() => setIsLogin(true)}>Login</button> */}
        {isLogin ? "New User ?" : "Login"}
      </div>
    </div>
  );
}
