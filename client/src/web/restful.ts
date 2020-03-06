import axios from "axios";

const baseUrl = 'http://localhost:8080';

export type MainInfoReturn = { defaultRoom: string }

export class WebApi {
    static async getMainInfo() {
        let data = await axios.get(`${baseUrl}/api/info`);
        return data.data as MainInfoReturn;
    }

    static getAudioUrl(key: number) {
        return `${baseUrl}/api/audio/${key}`;
    }
}