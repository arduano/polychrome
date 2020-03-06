import { link } from "fs";
import axios from 'axios';
import { WebApi } from "../web/restful";
const Tone = require('tone');

export class KeyAudioPlayer {
    synth: any;
    audioLoaded = false;

    constructor() {
        let tones: any = {}
        let bufferWaiters: Promise<void>[] = [];
        for (let i = 0; i < 128; i++) {
            bufferWaiters.push(new Promise(res => {
                tones[`C${i}`] = new Tone.Buffer(WebApi.getAudioUrl(i), function(){
                    res();
                });
            }));
        }
        Promise.all(bufferWaiters).then(() => this.audioLoaded = true);
        this.synth = new Tone.Sampler(tones).toMaster();
        this.synth.release = 1;
    }

    pressKey(key: number, velocity: number, instrument: string) {
        if(!this.audioLoaded) return;
        this.synth.triggerAttack(`C${key}`, undefined, velocity);
    }

    unpressKey(key: number, instrument: string) {
        if(!this.audioLoaded) return;
        this.synth.triggerRelease(`C${key}`);
    }
}