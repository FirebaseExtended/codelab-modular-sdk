import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

firebase.initializeApp({
    apiKey: "AIzaSyBnRKitQGBX0u8k4COtDTILYxCJuMf7xzE",
    authDomain: "exchange-rates-adcf6.firebaseapp.com",
    databaseURL: "https://exchange-rates-adcf6.firebaseio.com",
    projectId: "exchange-rates-adcf6",
    storageBucket: "exchange-rates-adcf6.appspot.com",
    messagingSenderId: "875614679042",
    appId: "1:875614679042:web:5813c3e70a33e91ba0371b"
});

export const firebaseAuth = firebase.auth();

export const firestore = firebase.firestore();

export const FirestoreFieldValue = firebase.firestore.FieldValue;

export const FirestoreFieldPath = firebase.firestore.FieldPath;

export type Snapshot = firebase.firestore.QuerySnapshot;