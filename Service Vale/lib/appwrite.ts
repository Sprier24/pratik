import { Client, Account, Databases } from "react-native-appwrite";

const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("6824720f00331dede626")
  .setPlatform("com.servicevale.servicevale");

export const account = new Account(client);
export const databases = new Databases(client);
