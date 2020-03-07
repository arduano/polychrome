import jwt from 'jsonwebtoken';
import nanoid from 'nanoid';
import { User } from 'data/misc';
import { guestPfpUrl } from './users';

let secret = 'temporary-jwt-secret'

interface Token {
    exp?: number;
    id: string;
}

export interface GuestToken extends Token {
    t: 'g';
    name: string;
}

export interface UserToken extends Token {
    t: 'u';
}

export function makeGuestAccountAuth(name: string) {
    let t: GuestToken = {
        t: 'g',
        name,
        id: nanoid()
    }
    return { id: t.id, token: jwt.sign(t, secret) }
}

export function makeGuestAccount(name: string) {
    let { id, token } = makeGuestAccountAuth(name);
    let u: User & { token: string } = {
        id,
        name,
        pfp: guestPfpUrl,
        token
    };
    return u;
}

export function makeTemporaryToken(token: string, secondsLife: number) {
    try {
        let data = jwt.verify(token, secret) as Token;
        data.exp = Date.now() + secondsLife * 1000;
        return jwt.sign(data, secret);
    }
    catch{
        return undefined;
    }
}

export function verifyToken(token: string): GuestToken | UserToken {
    try {
        let data = jwt.verify(token, secret) as GuestToken | UserToken;
        if (data.exp) {
            if (data.exp < Date.now()) return undefined;
        }
        return data;
    }
    catch{
        return undefined;
    }
}