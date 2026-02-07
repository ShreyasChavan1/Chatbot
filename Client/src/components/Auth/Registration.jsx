import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../../../Backend/lib/firebase";

export default function RegisterForm({ email, setEmail, pass, setPass, username, setUsername, load, setLoad }) {

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      alert("Enter a username");
      return;
    }

    try {
      setLoad(true);

      const res = await createUserWithEmailAndPassword(auth, email, pass);
      await sendEmailVerification(res.user);
alert("Check your inbox and verify your email.");

      await setDoc(doc(db, "user", res.user.uid), {
        username: username.trim(),
        email,
        id: res.user.uid,
        verified: false
      });

      await setDoc(doc(db, "userChats", res.user.uid), { chats: {} });
      await auth.signOut(); 
      setEmail("");
      setPass("")
      setUsername("")
    } catch (err) {
      alert(err.message);
    } finally {
      setLoad(false);
    }
  };

  return (
    <div className="auth-box">
      <h2>Register</h2>

      <input
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={pass}
        onChange={e => setPass(e.target.value)}
      />

      <button disabled={load} onClick={handleRegister}>
        {load ? "Creating account..." : "Register"}
      </button>
    </div>
  );
}
