import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { setDoc, doc,getDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../../../../Backend/lib/firebase";

export default function LoginForm({ email, setEmail, pass, setPass, load, setLoad ,setUsername}) {

  const googleLogin = async () => {
    try {
      setLoad(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoad(false);
    }
  };

  return (
    <div className="auth-box">
      <h2>Login</h2>

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

      <button disabled={load} onClick={async (e) => {
        e.preventDefault();
        setLoad(true);
        const res = await signInWithEmailAndPassword(auth, email, pass);
        console.log(res)
        res.user.reload();
        if (res.user.emailVerified) {
          await setDoc(
            doc(db, "user", res.user.uid),
            { verified: true },
            { merge: true }
          );
          setEmail("");
          setPass("");
          const userRef = doc(db, "user", res.user.uid);
const snap = await getDoc(userRef);

if (snap.exists()) {
  setUsername(snap.data().username || "");
}

         
        }else{
         await deleteDoc(doc(db, "user", res.user.uid));
        await res.user.delete(); 
        }
        setLoad(false);
      }}>
        {load ? "Loading..." : "Login"}
      </button>

      <div className="social-login">
        <button onClick={googleLogin}>Continue with Google</button>
      </div>
    </div>
  );
}
