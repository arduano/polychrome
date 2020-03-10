import { Color } from "./misc";
import { KeyAudioPlayer } from "./audioHandler";
import { MidiHandler } from "./midiHandler";

type KeyPresser = {
    color: Color;
    key: number;
    volume: number;
    agent: string;
    pressed: boolean;
    pressTime: number;
    unpressTime?: number;
    fade: number;
}

type KeyState = {
    pressers: KeyPresser[];
    pressStrength: number;
    mixedColor: Color;
    color: Color;
}

const fadeTime = 0.3;
const keyDesaturate = 80;
let autoFadeTime = 5;

export default class PianoState {
    keys: KeyState[] = []

    blackKeys: boolean[] = []
    keyNums: number[] = []
    keyStarts: number[] = []

    player: KeyAudioPlayer;
    midi: MidiHandler;

    constructor(player: KeyAudioPlayer, midi: MidiHandler) {
        this.player = player;
        this.midi = midi;

        //midi.listenTo(midi.getInputs()[0], this)

        let blacki = 0;
        let whitei = 0;

        for (var i = 0; i < 128; i++) {
            let n = i % 12;
            const black = n === 1 || n === 3 || n === 6 || n === 8 || n === 10;
            this.blackKeys.push(black);
            if (black) this.keyNums.push(blacki++);
            else this.keyNums.push(whitei++);

            if (black) {
                this.keys.push({
                    pressers: [],
                    pressStrength: 0,
                    mixedColor: { r: 0, g: 0, b: 0 },
                    color: { r: 70, g: 70, b: 100 },
                });
            }
            else {
                this.keys.push({
                    pressers: [],
                    pressStrength: 0,
                    mixedColor: { r: 255, g: 255, b: 255 },
                    color: { r: 255, g: 255, b: 255 },
                });
            }
        }
    }

    pressKey(key: number, velocity: number, agent: string, color: Color) {
        let k = this.keys[key];
        if (!k) return;

        this.player.pressKey(key, velocity, '');

        k.pressers.push({
            agent: agent,
            key: key,
            color: color,
            volume: velocity,
            fade: 1,
            pressTime: Date.now(),
            pressed: true,
        })
    }

    unpressKey(key: number, agent: string) {
        let k = this.keys[key];
        if (!k) return;

        for (let i = k.pressers.length - 1; i >= 0; i--) {
            let p = k.pressers[i];
            if (p.agent === agent && p.pressed) {
                p.unpressTime = Date.now();
                p.pressed = false;
                this.player.unpressKey(p.key, '');
                break;
            }
        }
    }

    updateAllKeys() {
        let time = Date.now();
        this.keys.forEach((key, i) => {
            let col: Color = key.mixedColor;
            col.r = key.color.r;
            col.g = key.color.g;
            col.b = key.color.b;
            for (let i = 0; i < key.pressers.length; i++) {
                let p = key.pressers[i];
                if (!p.pressed) {
                    let fade1 = 1 - ((time - p.pressTime!) / 1000 - autoFadeTime) / fadeTime;
                    let fade2 = 1 - (time - p.unpressTime!) / 1000 / fadeTime;
                    let fade = Math.min(Math.max(Math.min(fade1, fade2), 0), 1);
                    if (fade <= 0) {
                        key.pressers.splice(i, 1);
                        i--;
                    }
                    else {
                        p.fade = fade;
                    }
                }
                else {
                    let fade = 1 - ((time - p.pressTime!) / 1000 - autoFadeTime) / fadeTime;
                    fade = Math.min(Math.max(fade, 0), 1);
                    if (fade <= 0) {
                        this.player.unpressKey(p.key, '');
                        key.pressers.splice(i, 1);
                        i--;
                    }
                    else {
                        p.fade = fade;
                    }
                }
            }

            let firstPressed = 0;
            for (; firstPressed < key.pressers.length; firstPressed++) {
                if (key.pressers[firstPressed].fade === 1) break;
            }

            let pressState = 0;
            if (firstPressed === key.pressers.length) {
                col.r = key.color.r;
                col.g = key.color.g;
                col.b = key.color.b;
                pressState = 0;
            }
            else {
                let p = key.pressers[firstPressed];
                col.r = p.color.r;
                col.g = p.color.g;
                col.b = p.color.b;
                pressState = 1;
            }

            for (let i = firstPressed - 1; i >= 0; i--) {
                let p = key.pressers[i];
                let fade = p.fade;
                let unfade = 1 - fade;
                col.r = p.color.r * fade + col.r * unfade;
                col.g = p.color.g * fade + col.g * unfade;
                col.b = p.color.b * fade + col.b * unfade;
                pressState += fade * (1 - pressState);
            }

            if (this.blackKeys[i]) {
                col.r = Math.max(col.r - keyDesaturate);
                col.g = Math.max(col.g - keyDesaturate);
                col.b = Math.max(col.b - keyDesaturate);
            }
            else {
                col.r = Math.min(col.r + keyDesaturate);
                col.g = Math.min(col.g + keyDesaturate);
                col.b = Math.min(col.b + keyDesaturate);
            }

            key.pressStrength = Math.max(pressState * 2 - 1);
            key.mixedColor = col;
        });
    }
}