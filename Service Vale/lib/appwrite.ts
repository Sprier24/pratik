import { Client, Account, Databases, Storage, Teams } from 'react-native-appwrite';

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('servicevale-id')
    .setPlatform('com.spriers.servicevale');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const teams = new Teams(client); // ✅ Add this

