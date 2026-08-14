const firebaseConfig = {
    apiKey: "AIzaSyAmg5AagXdej2DgvdQ-q5Dqddbgc3Fu2oA",
    authDomain: "premium-store-v1.firebaseapp.com",
    projectId: "premium-store-v1",
    storageBucket: "premium-store-v1.firebasestorage.app",
    messagingSenderId: "838970946697",
    appId: "1:838970946697:web:fcaecf864d91c16967c258"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
console.log('✅ Firebase Connected');
