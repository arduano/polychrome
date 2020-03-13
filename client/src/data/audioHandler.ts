import { link } from "fs";
import axios from 'axios';
import { WebApi } from "../web/restful";

var context = new AudioContext();

let falloff = 0.3;
let constantVolumeScale = 0.2;

type NotePlayer = {
    source: AudioBufferSourceNode;
    gain: GainNode;
    removed: boolean;
}

function toArrayBuffer(buf: Buffer) {
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}

export class KeyAudioPlayer {
    synth: any;

    audioNoteBuffers: AudioBuffer[] = [];

    keyPlayers: NotePlayer[][] = [];

    private constructor() {
    }

    static async create() {
        let ap = new KeyAudioPlayer();

        ap.keyPlayers = [];
        let urls = [...Array(128).keys()].map(i => WebApi.getAudioUrl(i));

        let cache = await window.caches.open('piano-audio');
        
        let bufferWaiters = urls.map(async key => {
            ap.keyPlayers.push([]);

            let resp = await cache.match(key);
            if (!resp) {
                await cache.add(key);
                resp = await cache.match(key);
            }
            let buffer = await resp!.arrayBuffer();
            let audio = await context.decodeAudioData(buffer);
            return audio;
        })

        ap.audioNoteBuffers = await Promise.all(bufferWaiters);

        return ap;
    }

    pressKey(key: number, velocity: number, instrument: string) {
        var source = context.createBufferSource()
        var gain = context.createGain();
        source.connect(gain);
        gain.connect(context.destination);
        let buffer = this.audioNoteBuffers[key];
        source.buffer = buffer;
        gain.gain.value = Math.pow(velocity, 2) * constantVolumeScale;
        source.start();

        let player: NotePlayer = {
            gain, source,
            removed: false
        }

        this.keyPlayers[key].push(player);

        this.setRemoveTimeout(player, buffer.duration * 1000);

        //console.log(context.currentTime)
    }

    unpressKey(key: number, instrument: string) {
        if (this.keyPlayers[key].length === 0) return;
        let player = this.keyPlayers[key][this.keyPlayers[key].length - 1];
        this.keyPlayers[key].splice(this.keyPlayers[key].length - 1, 1);
        player.gain.gain.setValueAtTime(player.gain.gain.value, context.currentTime + 0.05);
        player.gain.gain.linearRampToValueAtTime(0.0001, context.currentTime + falloff + 0.05);
        this.setRemoveTimeout(player, falloff * 1000 + 500);
    }

    setRemoveTimeout(player: NotePlayer, timeout: number) {
        setTimeout(() => {
            if (player.removed) return;
            player.gain.disconnect();
            player.source.disconnect();
            player.source.stop();
            player.removed = true;
        }, timeout);
    }
}