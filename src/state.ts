import { User } from './auth';
import { AppState } from './models';

const STATE: AppState = {
    user: null,
    userPageCreated: false
};

export function getState() {
    return STATE;
}

export function setUser(user: User | null) {
    STATE.user = user;
}

export function setUserPageCreated(created: boolean) {
    STATE.userPageCreated = created;
}