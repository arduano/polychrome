import { default as webmidi, Input, InputEventNoteon, InputEventNoteoff, InputEventChannelmode } from "webmidi";
import PianoState from "./pianoState";

export class MidiHandler {
    private constructor() {

    }

    maxNps = 500;
    rateFactor: number = 0;
    lastNoteTime: number = 0;

    static async create() {
        let mh = new MidiHandler();

        mh.noteOn = mh.noteOn.bind(mh);
        mh.noteOff = mh.noteOff.bind(mh);
        mh.channelMode = mh.channelMode.bind(mh);

        try {
            await new Promise((ret, rej) => {
                webmidi.enable(function (err) {
                    err ? console.log("WebMIDI could not start!") : console.log("WebMIDI started!");

                    if (err) rej();
                    else ret();

                    console.log('Inputs:', webmidi.inputs);
                    console.log('Outputs:', webmidi.outputs);
                }, true);
            });
        }
        catch { }
        return mh;
    }

    async init() {
    }

    pianoState: PianoState | undefined = undefined;
    currentInput?: Input;

    listenTo(device: Input, pianoState: PianoState) {
        this.unlink();
        this.pianoState = pianoState;
        this.currentInput = device;

        console.log(device);

        device.addListener('noteon', 'all', this.noteOn);
        device.addListener('noteoff', 'all', this.noteOff);
        device.addListener('channelmode', 'all', this.channelMode);
    }

    private noteOn(e: InputEventNoteon) {
        if (e.velocity <= 6 / 127) return;
        if (e.channel == 10) return;
        this.rateFactor -= (Date.now() - this.lastNoteTime) / 1000 * this.maxNps;
        this.lastNoteTime = Date.now();
        if (this.rateFactor < 0) this.rateFactor = 0;
        if (this.rateFactor > e.velocity * this.maxNps) return;
        this.rateFactor++;
        this.pianoState?.pressKeyLocal(e.note.number, e.velocity)
    }

    private noteOff(e: InputEventNoteoff) {
        if (e.channel == 10) return;
        this.pianoState?.unpressKeyLocal(e.note.number)
    }

    private channelMode(e: InputEventChannelmode) {
        if (e.controller.name == "allsoundoff") {
            console.log("allsoundoff");
            for (var i = 0; i < 128; i++) {
                this.pianoState?.unpressAllKeysLocal();
            }
        }
    }

    unlink() {
        if (!this.currentInput) return;
        this.currentInput.removeListener('noteon', 'all', this.noteOn);
        this.currentInput.removeListener('noteoff', 'all', this.noteOff);
        this.currentInput = undefined;
    }

    getInputs() {
        return webmidi.inputs;
    }

    getOutputs() {
        return webmidi.outputs;
    }
}