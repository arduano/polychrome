import jwt from 'jsonwebtoken';
import nanoid from 'nanoid';
import { User } from 'data/misc';

let secret = 'temporary-jwt-secret'

interface Token {
    id: string;
}

interface GuestToken extends Token {
    t: 'g';
    name: string;
}

function makeGuestAccountAuth(name: string) {
    let t: GuestToken = {
        t: 'g',
        name,
        id: nanoid()
    }
    return { id: t.id, token: jwt.sign(t, secret) }
}

function makeGuestAccount(name: string) {
    let { id, token } = makeGuestAccountAuth(name);
    let u: User = {
        id,
        name,
        pfp: 'https://i.imgur.com/2ZipxzK.png'
    };
}