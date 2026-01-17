// firebaseAdmin.js

import admin from "firebase-admin";
import FirebaseToken from "../models/FirebaseToken.js";

// 🔐 Load Firebase Service Account from environment variable
let serviceAccount = {};

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG || "{}");

  // Fix escaped newlines in private key
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
} catch (err) {
}

// 🚀 Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialized with Hotel Buddha credentials");
  } catch (err) {
  }
}

// 📲 Push Notification Sender
export const sendPushNotification = async (token, payload) => {
  try {
    const response = await admin.messaging().send({
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {}, // Optional additional data
    });

  } catch (err) {
    // 🗑️ Clean up invalid tokens
    if (err.code === "messaging/registration-token-not-registered") {
      await FirebaseToken.deleteOne({ token });
    }  else if (err.message.includes("SenderId mismatch")) {
      await FirebaseToken.deleteOne({ token });
    } else {
    }
  }
};
