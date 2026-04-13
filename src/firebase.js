import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// TODO: reemplazar con las credenciales reales de sigmc-5fae5
// Firebase Console → Project Settings → Your apps → SDK setup
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "sigmc-5fae5.firebaseapp.com",
  projectId: "sigmc-5fae5",
  storageBucket: "sigmc-5fae5.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ hd: 'valdishopper.com' })
