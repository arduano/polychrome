import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import PianoState from '../../data/pianoState';
import { Color } from '../../data/misc';

const PianoContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const PianoShadow = styled.div`
    box-shadow: 0 0 10px black;
`;

const PianoCanvas = styled.canvas`
    width: 92%;
    box-shadow: 0 0 20px 5px black;
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
                        let wn = keyNums[i - 1] - keyNums[first]
                        ctx.fillStyle = getColStr(keyData.mixedColor);
                        ctx.fillRect((wn + 1 - blackWidth / 2) / whiteKeys * ctx.canvas.clientWidth, 0, blackWidth / whiteKeys * ctx.canvas.clientWidth, ctx.canvas.clientHeight * blackHeight);
                    }
                    //White key
                    else if (!blackKeys[i] && blackPass === 0) {
                        let wn = keyNums[i] - keyNums[first]

                        let left = wn / whiteKeys * ctx.canvas.clientWidth;
                        let width = 1 / whiteKeys * ctx.canvas.clientWidth;

                        ctx.fillStyle = getColStr(keyData.mixedColor);
                        ctx.fillRect(left, 0, width, ctx.canvas.clientHeight);

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
        if (lastKeyClicked != -1) keyboard.unpressKey(lastKeyClicked, '');
        keyboard.pressKey(keyNumber, 1, '', { r: 255, g: 0, b: 0 });
        lastKeyClicked = keyNumber;

        //setTimeout(() => keyboard.unpressKey(keyNumber, ''), 1000);
    }

    function mouseUp() {
        if (lastKeyClicked == -1) return;
        keyboard.unpressKey(lastKeyClicked, '')
        lastKeyClicked = -1;
    }

    useEffect(() => {
        window.addEventListener('mouseup', mouseUp);
        return () => {
            window.removeEventListener('mouseup', mouseUp);
        }
    })

    return (
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
    )
}

export default Piano;