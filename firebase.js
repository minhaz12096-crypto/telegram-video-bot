import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDYaSQbU380U6hcUmBgkDr4WAEmEu45X_U",
  authDomain: "tonnow-pro.firebaseapp.com",
  databaseURL: "https://tonnow-pro-default-rtdb.firebaseio.com",
  projectId: "tonnow-pro",
  storageBucket: "tonnow-pro.firebasestorage.app",
  messagingSenderId: "585362095075",
  appId: "1:585362095075:web:a94096a650ab74f3e03ed6",
  measurementId: "G-SS1QH64NRJ"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const MY_ADMIN_ID = "8382029741"; 
