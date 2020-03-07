import axios from "axios";
import { MainInfoReturn, User } from "../data/misc";

const baseUrl = 'http://localhost:8080';

export class WebApi {
    static async getMainInfo() {
        let data = await axios.get(`${baseUrl}/api/info`);
        return data.data as MainInfoReturn;
    }

    static async getGuestAccount(name: string) {
        let data = await axios.post(`${baseUrl}/api/accounts/guest`, { name });
        return data.data as User & { token: string };
    }

    static async getTemporaryToken(token: string) {
        let data = await axios.post(`${baseUrl}/api/accounts/temporary`, { token });
        return data.data.token as string;
    }

    static getAudioUrl(key: number) {
        return `${baseUrl}/api/audio/${key}`;
    }
}