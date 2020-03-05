import { link } from "fs";
import axios from 'axios';

export type KeyAudio = {
    player: AudioPlayer;
    key: number;
    velocity: number;
    volume: number;
    fade: number;
    fadeStart?: number;
    instrument: string;
}

export type AudioPlayer = {
    player: HTMLAudioElement;
    playing: KeyAudio | null;
}

let fadeTime = 0.3;

let urls: string[] = []
let names = ['c', 'cs', 'd', 'ds', 'e', 'f', 'fs', 'g', 'gs', 'a', 'as', 'b']
for (let i = 21; i < 109; i++) {
    urls.push(`http://www.multiplayerpiano.com/sounds/mppclassic/${names[i % 12]}${Math.floor(i / 12) - 2}.mp3`)
}

let audioPlayerBatch: AudioPlayer[][] = [];
let audioPlayerBatchPos: number[] = [];

urls.forEach(async url => {
    let buffers: AudioPlayer[] = [];
    let data = await axios.get(url)
    console.log(data);
    // for(let i = 0; i < 20; i++){
    //     buffers.push({
    //         player: new Audio(url),
    //         playing: null
    //     })
    // }
    // audioPlayerBatch.push(buffers);
    // audioPlayerBatchPos.push(0);
});

export class KeyAudioPlayer {
    keyPlayers: KeyAudio[] = [];

    loopRunning: boolean = false;

    constructor() {

    }

    startUpdateLoop() {
        this.loopRunning = true;
        this.updateLoop();
    }

    stopUpdateLoop() {
        this.loopRunning = false;
    }

    async updateLoop() {
        while (this.loopRunning) {
            let time = Date.now();
            for (let i = 0; i < this.keyPlayers.length; i++) {
                let player = this.keyPlayers[i];
                if (player.fadeStart) {
                    let fade = 1 - (time - player.fadeStart) / 1000 / fadeTime;
                    if (fade < 0) {
                        this.keyPlayers.splice(i, 1);
                        player.player.player.pause();
                        i--;
                    }
                    else {
                        player.fade = fade;
                        player.player.player.volume = fade * player.velocity * player.volume;
                    }
                }
            }
            await new Promise(r => setTimeout(r, 10));
        }
    }

    pressKey(key: number, instrument: string) {
        let url = urls[key - 21];
        if (!url) return null;

        let p = new Audio(url);
        p.play();

        let player: KeyAudio = {
            player: audioPlayerBatch[0][0],
            fade: 1,
            volume: 1,
            velocity: 1,
            key: key,
            instrument: instrument
        }

        p.volume = player.velocity * player.volume;


        this.keyPlayers.push(player);


        return player;
    }

    unpressKey(key: KeyAudio | null) {
        if (key == null) return;
        key.fadeStart = Date.now();
    }
}

const runningAudioPlayer = new KeyAudioPlayer();
runningAudioPlayer.startUpdateLoop();
export default runningAudioPlayer;