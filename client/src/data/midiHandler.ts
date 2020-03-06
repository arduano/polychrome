import { default as webmidi, Input, InputEventNoteon, InputEventNoteoff } from "webmidi";
import PianoState from "./pianoState";

export class MidiHandler {
    webMidiLoader: Promise<void>;

    constructor() {
        this.webMidiLoader = new Promise((ret, rej) => {
            webmidi.enable(function (err) {
                err ? console.log("WebMIDI could not start!") : console.log("WebMIDI started!");

                if (err) rej();
                else ret();

                console.log('Inputs:', webmidi.inputs);
                console.log('Outputs:', webmidi.outputs);
            });
        });

        this.noteOn = this.noteOn.bind(this);
        this.noteOff = this.noteOff.bind(this);
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
        device.addListener('noteon', 'all', console.log);
    }

    private noteOn(e: InputEventNoteon) {
        this.pianoState?.pressKey(e.note.number, e.velocity, '', { r: 0, g: 255, b: 0 })
    }

    private noteOff(e: InputEventNoteoff) {
        this.pianoState?.unpressKey(e.note.number, '')
    }

    unlink() {
        if (!this.currentInput) return;
        this.currentInput.removeListener('noteon', 'all', this.noteOn);
        this.currentInput.removeListener('noteoff', 'all', this.noteOff);
        this.currentInput = undefined;
    }

    async getInputs() {
        await this.webMidiLoader;
        return webmidi.inputs;
    }
}