// Import the functions you need from the SDKs you need
import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";
import "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBC7ivjaL0eQ5jpzwRAXFsLC54zD7deqDY",
  authDomain: "findrental-30230.firebaseapp.com",
  projectId: "findrental-30230",
  storageBucket: "findrental-30230.appspot.com",
  messagingSenderId: "787454179881",
  appId: "1:787454179881:web:542741e382d7a1bfd53a38",
  measurementId: "G-68PB8BVWWD"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = firebase.firestore();
export const storage = firebase.storage();
export const storageRef = storage.ref();
export const auth = firebase.auth();