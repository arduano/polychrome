import { default as webmidi, Input, InputEventNoteon, InputEventNoteoff } from "webmidi";
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

        await new Promise((ret, rej) => {
            webmidi.enable(function (err) {
                err ? console.log("WebMIDI could not start!") : console.log("WebMIDI started!");

                if (err) rej();
                else ret();

                console.log('Inputs:', webmidi.inputs);
                console.log('Outputs:', webmidi.outputs);
            });
        });
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
        //device.addListener('noteon', 'all', console.log);
    }

    private noteOn(e: InputEventNoteon) {
        this.rateFactor -= (Date.now() - this.lastNoteTime) / 1000 * this.maxNps;
        this.lastNoteTime = Date.now();
        if(this.rateFactor < 0) this.rateFactor = 0;
        if(this.rateFactor > e.velocity * this.maxNps) return;
        this.rateFactor++;
        this.pianoState?.pressKeyLocal(e.note.number, e.velocity)
    }

    private noteOff(e: InputEventNoteoff) {
        this.pianoState?.unpressKeyLocal(e.note.number)
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
}