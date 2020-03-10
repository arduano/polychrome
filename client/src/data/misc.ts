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

interface EventData {
    timestamp: number;
    event: string;
    data: any;
}

export interface BatchEventData {
    data: EventData;
    reduceLatency: boolean;
}

export interface SendBatchEventData extends BatchEventData {
}

export interface RecieveBatchEventData extends BatchEventData {
    startTime: number;
    endTime: number;
    user: string;
}

export type MainInfoReturn = { defaultRoom: string }