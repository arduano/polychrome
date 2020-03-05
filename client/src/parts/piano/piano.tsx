import React, { useState } from 'react';
import styled from 'styled-components';
import PianoState from '../../data/pianoState';

const PianoContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const PianoCanvas = styled.canvas`
    width: 1000px;
    height: 1000px;
`;

let first = 21;
let last = 109;

const keyAspect = 9;
const blackHeight = 1 / 3 * 2;
const blackWidth = 0.7;

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

        for (var blackPass = 0; blackPass < 3; blackPass++) {
            for (var i = first; i < last; i++) {
                var n = i - first;
                if (n != last - 1) {
                    let keyData = keyboard.keys[i];
                    let col = keyData.mixedColor;
                    let colStr = `rgb(${col.r},${col.g},${col.b})`
                    //Black key
                    if (blackKeys[i] && blackPass === 2) {
                        let wn = keyNums[i - 1] - keyNums[first]
                        ctx.fillStyle = colStr;
                        ctx.fillRect((wn + 1 - blackWidth / 2) / whiteKeys * ctx.canvas.clientWidth, 0, blackWidth / whiteKeys * ctx.canvas.clientWidth, ctx.canvas.clientHeight * blackHeight);
                    }
                    //White key
                    else if (!blackKeys[i] && blackPass === 0) {
                        let wn = keyNums[i] - keyNums[first]
                        ctx.fillStyle = colStr;
                        ctx.fillRect(wn / whiteKeys * ctx.canvas.clientWidth, 0, 1 / whiteKeys * ctx.canvas.clientWidth, ctx.canvas.clientHeight);
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

        keyboard.pressKey(keyNumber, 1, '', { r: 255, g: 0, b: 0 });
        setTimeout(() => keyboard.unpressKey(keyNumber, ''), 1000);
    }

    return (
        <PianoContainer>
            <canvas
                style={{ width: '80%' }}
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
    )
}

export default Piano;