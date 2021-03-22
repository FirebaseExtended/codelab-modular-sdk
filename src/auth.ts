import { firebaseAuth } from './firebase';
import firebase from 'firebase/app';


export function signInWithEmailPassword(email: string, pwd: string) {
    return firebaseAuth.signInWithEmailAndPassword(email, pwd);
}

export function signInAnonymously() {
    return firebaseAuth.signInAnonymously();
}

export function signOut() {
    return firebaseAuth.signOut();
}

export type User = firebase.User;
