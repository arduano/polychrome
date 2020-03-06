import axios from "axios";
import { MainInfoReturn } from "../data/misc";

const baseUrl = 'http://localhost:8080';

export class WebApi {
    static async getMainInfo() {
        let data = await axios.get(`${baseUrl}/api/info`);
        return data.data as MainInfoReturn;
    }

    static getAudioUrl(key: number) {
        return `${baseUrl}/api/audio/${key}`;
    }
}