import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, increment, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. 🔥 FIREBASE CONFIGURATION (Your Provided Data)
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Telegram WebApp Setup
const tg = window.Telegram.WebApp;
const uid = tg.initDataUnsafe?.user?.id?.toString() || "guest_user";
const uName = tg.initDataUnsafe?.user?.first_name || "Guest";

// 2. ⚙️ ADMIN & WALLET SETTINGS
const ADMIN_ID = "8382029741"; // Your Telegram ID
const MY_DEPOSIT_WALLET = "UQCgHCVc-ZZ-L9UjN4-yjUAHn2ydmfqQvPVywZrrQYQP-Qkj"; // Your TON Address
const ADSGRAM_BLOCK_ID = "YOUR_REWARD_BLOCK_ID"; // Put your Adsgram Reward Block ID here

// Adsgram Controller
const AdController = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });

// --- AUTO ADS SYSTEM (Every 2 Minutes) ---
setInterval(() => {
    AdController.show().catch(() => console.log("Auto ad skipped or blocked"));
}, 120000);

// --- INITIALIZE USER ---
async function initUser() {
    tg.expand();
    if(document.getElementById('userName')) {
        document.getElementById('userName').innerText = uName;
    }
    
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    
    if(!snap.exists()) {
        await setDoc(userRef, { 
            points: 0, 
            ton: 0, 
            completed: [], 
            adsWatched: 0 
        });
    }
    updateUI();
    renderTasks();
}

// --- UPDATE DASHBOARD ---
async function updateUI() {
    const snap = await getDoc(doc(db, "users", uid));
    if(snap.exists()) {
        const data = snap.data();
        document.getElementById('ptsBalance').innerText = data.points || 0;
        document.getElementById('tonBalance').innerText = (data.ton || 0).toFixed(2);
        if(document.getElementById('adStatus')) {
            document.getElementById('adStatus').innerText = data.adsWatched || 0;
        }
    }
}

// --- WITHDRAWAL LOGIC (1 TON = 10 Ads Condition) ---
window.requestWithdrawal = async () => {
    const walletAddr = document.getElementById('walletAddr').value;
    const snap = await getDoc(doc(db, "users", uid));
    const d = snap.data();
    
    if(!walletAddr || walletAddr.length < 10) {
        return alert("Enter a valid TON wallet address!");
    }

    const tonAmount = d.ton || 0;
    const requiredAds = Math.ceil(tonAmount) * 10; 
    const currentAds = d.adsWatched || 0;

    // Condition Check
    if (currentAds < requiredAds) {
        alert(`Verification Required! Watch ${requiredAds} ads to withdraw ${tonAmount.toFixed(1)} TON. (Watched: ${currentAds})`);
        
        // Trigger Adsgram Reward Ad
        AdController.show().then(async () => {
            await updateDoc(doc(db, "users", uid), { adsWatched: increment(1) });
            updateUI();
            alert("1 Ad Completed! Keep going.");
        }).catch(() => alert("Ad failed. Please check internet."));
        
        return;
    }

    if (tonAmount >= 1) {
        await addDoc(collection(db, "withdrawals"), { 
            uid: uid, 
            addr: walletAddr, 
            amount: tonAmount, 
            status: "pending",
            timestamp: new Date()
        });
        
        await updateDoc(doc(db, "users", uid), { ton: 0, adsWatched: 0 });
        alert("Success! Admin will pay you soon.");
        updateUI();
    } else {
        alert("Minimum 1.0 TON needed!");
    }
};

// --- EXCHANGE SYSTEM ---
window.exchangePoints = async () => {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if((snap.data().points || 0) < 1000) return alert("Need 1000 PTS!");
    
    await updateDoc(userRef, { points: increment(-1000), ton: increment(1.0) });
    alert("Exchanged 1000 PTS for 1.0 TON!");
    updateUI();
};

// --- TASK SYSTEM ---
window.renderTasks = async () => {
    const list = document.getElementById('taskList');
    if(!list) return;
    const userSnap = await getDoc(doc(db, "users", uid));
    const done = userSnap.data().completed || [];
    const tasks = await getDocs(collection(db, "tasks"));
    list.innerHTML = "";
    tasks.forEach(tDoc => {
        const t = tDoc.data();
        const tid = tDoc.id;
        const isDone = done.includes(tid);
        list.innerHTML += `
            <div class="task-card">
                <b>${t.title} (+${t.reward})</b>
                <button onclick="doTask('${tid}','${t.url}',${t.reward})" ${isDone?'disabled':''}>
                    ${isDone?'Done':'Start'}
                </button>
            </div>`;
    });
};

window.doTask = (id, url, reward) => {
    window.open(url, '_blank');
    setTimeout(async () => {
        await updateDoc(doc(db, "users", uid), { points: increment(reward), completed: arrayUnion(id) });
        updateUI(); renderTasks();
    }, 5000);
};

// --- ADMIN & DEPOSIT HELPER ---
window.checkAdminAccess = () => {
    if(uid === ADMIN_ID) window.location.href = "admin.html";
    else alert("Access Denied!");
};

window.showMyWallet = () => {
    alert("Send TON to this Address: " + MY_DEPOSIT_WALLET);
};

// Navigation
window.changePage = (id, el) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    document.getElementById(id).classList.add('active-page');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
};

initUser();
