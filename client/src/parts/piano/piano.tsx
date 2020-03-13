import React, { useState, useEffect } from 'react';
import * as webmidi from "webmidi";
import styled from 'styled-components';
import PianoState from '../../data/pianoState';
import { Color } from '../../data/misc';

const Container = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const PianoContainer = styled.div`
    width: 92%;
    box-shadow: 0 0 20px 15px black;
`;

const PianoCanvas = styled.canvas`
    width: calc(100% + 20px);
    margin: -10px;
`;

let first = 21;
let last = 109;

const keyAspect = 9;
const blackHeight = 1 / 3 * 2;
const blackWidth = 0.7;

let lastKeyClicked = -1;

function Piano(props: { keyboard: PianoState }) {

    const [renderCanvas, setRenderCanvas] = useState<HTMLCanvasElement | null>(null)

    const { blackKeys, keyNums } = props.keyboard;
    const keyboard = props.keyboard;

    function draw() {
        const cnv = document.getElementById('piano-canvas') as HTMLCanvasElement | null;
        if (!cnv) return;

        let whiteKeys = 0;
        for (var i = first; i < last; i++) {
            if (!blackKeys[i]) whiteKeys++;
        }
        cnv.height = cnv.clientWidth / whiteKeys * keyAspect;
        cnv.style.height = cnv.height + 'px';
        cnv.width = cnv.clientWidth;

        const ctx = cnv.getContext('2d');
        if (!ctx) return;

        keyboard.updateAllKeys();

        ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
        ctx.fillStyle = 'white';
        //ctx.fillRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);

        function getColStr(col: Color) {
            return `rgb(${col.r},${col.g},${col.b})`;
        }

        function getColAStr(col: Color, a: number) {
            return `rgba(${col.r},${col.g},${col.b},${a})`;
        }

        for (var blackPass = 0; blackPass < 3; blackPass++) {
            for (var i = first; i < last; i++) {
                var n = i - first;
                if (n != last - 1) {
                    let keyData = keyboard.keys[i];
                    //Black key
                    if (blackKeys[i] && blackPass === 2) {
                        let press = keyData.pressStrength * ctx.canvas.clientHeight * 0.01;

                        let wn = keyNums[i - 1] - keyNums[first]
                        let left = (wn + 1 - blackWidth / 2) / whiteKeys * ctx.canvas.clientWidth;
                        let width = blackWidth / whiteKeys * ctx.canvas.clientWidth;

                        ctx.save();
                        ctx.fillStyle = getColStr(keyData.mixedColor);
                        ctx.shadowColor = 'black';
                        ctx.shadowBlur = 5;
                        ctx.fillRect(left, press, width, ctx.canvas.clientHeight * blackHeight);
                        ctx.restore();

                        let padding = 0.01;
                        let size = 0.1;
                        let top = 1;

                        let sidePadding = 0.1 / whiteKeys * ctx.canvas.clientWidth
                        left += sidePadding;
                        width -= sidePadding * 2;

                        //for (let i = keyData.pressers.length - 1; i >= 0; i--) {
                        for (let i = 0; i < keyData.pressers.length; i++) {
                            let presser = keyData.pressers[i];
                            let height = presser.fade * presser.volume * blackHeight;
                            top -= height * size + padding;

                            ctx.fillStyle = getColAStr(presser.color, presser.fade);
                            ctx.fillRect(left, (top - (1 - blackHeight)) * ctx.canvas.clientHeight, width, height * size * ctx.canvas.clientHeight);
                        }
                    }
                    //White key
                    else if (!blackKeys[i] && blackPass === 0) {
                        let wn = keyNums[i] - keyNums[first]

                        let left = wn / whiteKeys * ctx.canvas.clientWidth;
                        let width = 1 / whiteKeys * ctx.canvas.clientWidth;

                        let press = keyData.pressStrength * ctx.canvas.clientHeight * 0.01;

                        ctx.fillStyle = getColStr(keyData.mixedColor);
                        ctx.fillRect(left, press, width, ctx.canvas.clientHeight);

                        let padding = 0.01;
                        let size = 0.1;
                        let top = 1;

                        let sidePadding = 0.1 / whiteKeys * ctx.canvas.clientWidth
                        left += sidePadding;
                        width -= sidePadding * 2;

                        //for (let i = keyData.pressers.length - 1; i >= 0; i--) {
                        for (let i = 0; i < keyData.pressers.length; i++) {
                            let presser = keyData.pressers[i];
                            let height = presser.fade * presser.volume;
                            top -= height * size + padding;

                            ctx.fillStyle = getColAStr(presser.color, presser.fade);
                            ctx.fillRect(left, top * ctx.canvas.clientHeight, width, height * size * ctx.canvas.clientHeight);
                        }
                    }
                    //White key edge
                    else if (!blackKeys[i] && blackPass === 1) {
                        let wn = keyNums[i] - keyNums[first]
                        ctx.fillStyle = 'black';
                        ctx.fillRect((wn + 1) / whiteKeys * ctx.canvas.clientWidth, 0, 0.05 / whiteKeys * ctx.canvas.clientWidth, ctx.canvas.clientHeight);
                    }
                }
            }
        }

        //console.log(keyboard.keys[21]);

        window.requestAnimationFrame(draw);
    }

    function pianoClick(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
        if (event.button != 0) return;
        const cnv = event.target as HTMLCanvasElement;
        if (!cnv) return;
        let cnvRect = cnv.getBoundingClientRect();
        let left = event.clientX - cnvRect.left;
        let top = event.clientY - cnvRect.top;
        let inBlackKeyY = top < cnv.clientHeight * blackHeight;

        let whiteKeys = 0;
        for (var i = first; i < last; i++) {
            if (!blackKeys[i]) whiteKeys++;
        }

        let whiteKeyPos = left / cnv.clientWidth * whiteKeys;

        let whiteKey = Math.floor(whiteKeyPos);
        let whiteOffset = 0;
        for (var i = 0; i < 128; i++) {
            if (i < first && !blackKeys[i]) whiteOffset++;
            else {
                if (!blackKeys[i] && keyNums[i] === whiteKey + whiteOffset) {
                    whiteKey = i;
                    break;
                }
            }
        }

        let keyNumber = whiteKey;
        if (inBlackKeyY) {
            let posInKey = whiteKeyPos % 1;
            let halfBlackWidth = blackWidth / 2;
            if (blackKeys[keyNumber - 1] && posInKey < halfBlackWidth) keyNumber--;
            if (blackKeys[keyNumber + 1] && posInKey > 1 - halfBlackWidth) keyNumber++;
        }

        if (keyNumber < first) keyNumber = first;
        if (keyNumber >= last) keyNumber = last - 1;

        if (lastKeyClicked != -1) keyboard.unpressKeyLocal(lastKeyClicked);
        keyboard.pressKeyLocal(keyNumber, 1);
        lastKeyClicked = keyNumber;

        //setTimeout(() => keyboard.unpressKey(keyNumber, ''), 1000);
    }

    function mouseUp() {
        if (lastKeyClicked === -1) return;
        keyboard.unpressKeyLocal(lastKeyClicked)
        lastKeyClicked = -1;
    }

    function midiNoteOn() {

    }

    useEffect(() => {
        window.addEventListener('mouseup', mouseUp);
        return () => {
            window.removeEventListener('mouseup', mouseUp);
        }
    })

    return (
        <Container>
            <PianoContainer>
                <PianoCanvas
                    onMouseDown={pianoClick}
                    ref={c => {
                        if (c && c != renderCanvas) {
                            setRenderCanvas(c);
                            draw()
                        }
                    }}
                    id={'piano-canvas'}
                />
            </PianoContainer>
        </Container>
    )
}

export default Piano;