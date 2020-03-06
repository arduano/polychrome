export type Color = {
    r: number;
    g: number;
    b: number;
}

export interface User {
    id: string;
    name: string;
    pfp: string;
}

export interface Room {
    people: User[];
    displayName: string;
    urlName: string;
    owner: string;
}