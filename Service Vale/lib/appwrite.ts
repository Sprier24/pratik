import { Client, Account, Databases, Storage } from 'react-native-appwrite';

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('685520ca0036a8808244')

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

