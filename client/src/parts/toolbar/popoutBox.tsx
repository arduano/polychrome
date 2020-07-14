import React, { useState, useEffect } from "react";
import styled, { keyframes, css } from "styled-components";
import popoutStore from "../../data/popout";
import { observer } from "mobx-react"
import { Transition } from 'react-transition-group';
import { TransitionStatus } from "react-transition-group/Transition";

const fadeIn = keyframes`
    from {
        transform: translateY(5px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
`;

const animationDuration = 100;

const PopoutBoxCon = styled.div<{ showing: TransitionStatus }>`
    position: absolute;
    background-color: #444444;
    color: #ccc;
    box-shadow: 0 0 5px black;
    min-height: 20px;
    overflow-y: auto;
    transition: all 0.2s ease;
    border-radius: 10px;

    ${props => {
        const state = props.showing;
        if (state === 'entered') {
            return;
        }
        if (state === 'exited') {
            return css`display: none;`;
        }
        if (state === 'entering') {
            return css`animation: ${fadeIn} ${animationDuration}ms ease;`;
        }
        if (state === 'exiting') {
            return css`
                animation: ${fadeIn} ${animationDuration}ms ease;
                animation-direction: reverse;
            `;
        }
    }}

    ::-webkit-scrollbar {
        width: 1em;
    }

    ::-webkit-scrollbar-track {
        box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
        border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb {
        background-color: #333;
        outline: 1px solid slategrey;
        border-radius: 10px;
    }
`;

const Inner = styled.div`
    padding: 10px;
`;

const PopoutInner = observer(({ state }: { state: TransitionStatus }) => {
    const [top, setTop] = useState<number | undefined>(undefined);
    const [height, setHeight] = useState<number | undefined>(undefined);
    const [allowScroll, setAllowScroll] = useState<boolean>(false);

    return (
        <PopoutBoxCon showing={state} className={'popout-click-ignore'} style={{ 
            ...popoutStore.pos, 
            width: popoutStore.width, 
            top,
            overflowY: allowScroll ? 'auto' : 'hidden'
        }}>
            <Inner ref={r => {
                if (!r) return;

                if (!popoutStore.showing) {
                    if (undefined !== top) setTop(undefined);
                }

                if (state === 'exiting' || state === 'exited') return;

                if (popoutStore.pos.topHeightSubtract && popoutStore.pos.minTop) {
                    if (height === r.clientHeight && top !== undefined) return;
                    setHeight(r.clientHeight);
                    let newTop = popoutStore.pos.topHeightSubtract - r.clientHeight;
                    if (newTop < popoutStore.pos.minTop) {
                        setAllowScroll(true);
                        newTop = popoutStore.pos.minTop;
                    }
                    else{
                        setAllowScroll(false);
                    }
                    setTop(newTop);
                }
            }}>
                {popoutStore.children}
            </Inner>
        </PopoutBoxCon>
    )
});

const PopoutBox = observer((props: {}) => {
    return (
        <Transition in={popoutStore.showing} timeout={animationDuration}>
            {state => <PopoutInner state={state} />}
        </Transition>
    );
})

export default PopoutBox;
