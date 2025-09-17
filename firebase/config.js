import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyD5Fmu_LWjiZXR_HdswUUbvW4UOIfQTHJg",
    authDomain: "fixora-be66c.firebaseapp.com",
    databaseURL: "https://fixora-be66c-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "fixora-be66c",
    storageBucket: "fixora-be66c.firebasestorage.app",
    messagingSenderId: "721607078009",
    appId: "1:721607078009:web:59383bff51a16caa5964a8",
    measurementId: "G-5MFECJ570K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
