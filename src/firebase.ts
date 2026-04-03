import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, getDocFromServer, getDocFromCache, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Validate Connection to Firestore
async function testConnection() {
  try {
    // Attempt to get a non-existent doc to test connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log('Firestore connection verified successfully.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('CRITICAL: Firestore connection failed. The client is offline. Please check your Firebase configuration in firebase-applet-config.json.');
    } else {
      // Other errors (like permission denied) are expected if the doc doesn't exist or rules are strict
      console.log('Firestore connectivity check completed.');
    }
  }
}

testConnection();

export { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocFromServer,
  getDocFromCache,
  setDoc,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
};
