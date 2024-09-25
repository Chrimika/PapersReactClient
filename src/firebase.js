import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "@firebase/auth";
import { getFirestore } from "@firebase/firestore";

const configurationFirebase = {
  apiKey: "AIzaSyADLk-YUqWpKbyCSsXxk-W5RKl0_pKDy_A",
  authDomain: "paper-d9ad5.firebaseapp.com",
  projectId: "paper-d9ad5",
  storageBucket: "paper-d9ad5.appspot.com",
  messagingSenderId: "966837266031",
  appId: "1:966837266031:web:cacecb421f912557210f9a",
  measurementId: "G-6NYLXR467G"
};

const app = initializeApp(configurationFirebase); 
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);