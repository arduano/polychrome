import React, { useState } from 'react';
import Piano from '../../parts/piano/piano';
import styled from 'styled-components';
import User from '../../parts/user/user';
import PianoState from '../../data/pianoState';

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

function Main(props: {}) {
    const [keyboardState, setKeyboardState] = useState(new PianoState());
    
    return (
        <Container>
            <PianoContainer>
                <Piano keyboard={keyboardState} />
            </PianoContainer>
            <UserBar>
                <UserContainer>
                    <User name={'Arduano'} pfp={'https://i.imgur.com/2ZipxzK.png'}/>
                </UserContainer>
            </UserBar>
        </Container>
    )
}

export default Main;