import React, { useState, useEffect } from 'react';
import Piano from '../../parts/piano/piano';
import styled from 'styled-components';
import User from '../../parts/user/user';
import PianoState from '../../data/pianoState';
import { KeyAudioPlayer } from '../../data/audioHandler';
import { MidiHandler } from '../../data/midiHandler';
import Toolbar from '../../parts/toolbar/toolbar';

const barHeight = 80;
const iconSize = 60;

const UserBar = styled.div`
    position: absolute;
    width: 100%;
    display: flex;
    flex-wrap: wrap;
`;

const Container = styled.div`
    height: 100vh;
    width: 100vw;
    display: relative;
    background-color: #222;
`;

const PianoContainer = styled.div`
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
`;

const IconContainer = styled.div`
    width: ${iconSize}px;
    position: absolute;
    left: 0;
    top: ${barHeight}px;
`;

const Icon = styled.div`
    width: ${iconSize}px;
    height: ${iconSize}px;
    padding: 10px;
    background-color: red;
`;

const UserContainer = styled.div`
    margin: 5px;
`;

const ToolbarContainer = styled.div`
    position: absolute;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 3em;
`;

interface MainProps {
    audioPlayer: KeyAudioPlayer;
    midiHandler: MidiHandler;
}

function Main(props: MainProps) {
    const [keyboardState, setKeyboardState] = useState<PianoState | undefined>(undefined);

    useEffect(() => {
        setKeyboardState(new PianoState(props.audioPlayer, props.midiHandler));
    }, [])

    return (
        <Container>
            <ToolbarContainer>
                <Toolbar btnTitle={'Test'} />
            </ToolbarContainer>
            <UserBar>
                <UserContainer>
                    <User name={'Arduano'} pfp={'https://i.imgur.com/2ZipxzK.png'} />
                </UserContainer>
                <UserContainer>
                    <User name={'Kaydax'} pfp={'https://cdn.kaydax.xyz/Untitled.png'} />
                </UserContainer>
            </UserBar>
            <PianoContainer>
                {keyboardState && <Piano keyboard={keyboardState} />}
            </PianoContainer>
        </Container>
    )
}

export default Main;