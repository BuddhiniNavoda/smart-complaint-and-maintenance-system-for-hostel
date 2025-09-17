// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD5Fmu_LWjiZXR_HdswUUbvW4UOIfQTHJg",
  authDomain: "fixora-be66c.firebaseapp.com",
  projectId: "fixora-be66c",
  storageBucket: "fixora-be66c.firebasestorage.app",
  messagingSenderId: "721607078009",
  appId: "1:721607078009:web:59383bff51a16caa5964a8",
  measurementId: "G-5MFECJ570K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);