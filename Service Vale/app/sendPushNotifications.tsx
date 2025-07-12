const { Client, Databases } = require("node-appwrite");
const axios = require("axios");

const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1") // Appwrite endpoint
  .setProject("<681c428b00159abb5e8b>")
  .setKey("<standard_e4e27b4659389650897b9dcf7046c9757f97a776039dbeb2571d5a187ddb42951222f68c6a84313b319d58394e6ec166ec9a2431d5e0f74866bcf892ea42e04f58ea165fb09e3ce548774d2bb40d25752ace9382cdfb1d8c53f4a61d11da77eb2fe45ab1136f8f048fb660b673ac83a8c1972118067fece0d2df2d455bdbd9ca>");

const databases = new Databases(client);

async function sendPushNotifications() {
  // 1. Fetch notifications
  const response = await databases.listDocuments('<681c428b00159abb5e8b>', '<admin_id>');

  const notifications = response.documents;

  // 2. Loop through notifications and send FCM push
  for (let notif of notifications) {
    const fcmToken = notif.deviceToken; // assume deviceToken is saved
    const message = {
      to: fcmToken,
      notification: {
        title: notif.title,
        body: notif.message
      }
    };

    await axios.post('https://fcm.googleapis.com/fcm/send', message, {
      headers: {
        Authorization: 'key=<BKcunHh2x9fgnziAXW86j84EUQA19ur7t1yHX0JspMgPn8CHxjtQfXEvvAGpsuIw3H6YaPU1nYl6Kqo-_ys8ljg>',
        'Content-Type': 'application/json'
      }
    });

    console.log("Push sent to:", fcmToken);
  }
}

sendPushNotifications();
