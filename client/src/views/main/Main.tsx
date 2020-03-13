import React, { useState, useEffect } from 'react';
import Piano from '../../parts/piano/piano';
import styled from 'styled-components';
import User from '../../parts/user/user';
import { User as UserType } from '../../data/misc';
import PianoState from '../../data/pianoState';
import { KeyAudioPlayer } from '../../data/audioHandler';
import { MidiHandler } from '../../data/midiHandler';
import Toolbar from '../../parts/toolbar/toolbar';
import socketio from 'socket.io-client';
import BPRApi, { JoinRoomData } from '../../web/api';
import { withRouter, RouteProps, RouteComponentProps } from 'react-router';

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
    api: BPRApi;
}

function Main(props: MainProps & RouteComponentProps<{ room: string }, {}, {}>) {
    const [keyboardState, setKeyboardState] = useState<PianoState | undefined>(undefined);
    const [roomUsers, setRoomUsers] = useState<UserType[]>([]);

    let api = props.api;

    useEffect(() => {
        let _keyboardState = new PianoState(props.audioPlayer, props.midiHandler, props.api);
        setKeyboardState(_keyboardState);

        api.joinRoom(props.match.params.room).then((data: JoinRoomData) => {
            api.on('user join', (user) => {
                setRoomUsers(u => u.concat([user]));
            })
            api.on('user leave', (user) => {
                let i = roomUsers.findIndex(u => u.id == user.id);
                setRoomUsers(u => u.filter(_u => _u.id !== user.id));
            })
            api.on('note on', (user, key, velocity) => {
                _keyboardState!.pressKeyWeb(key, velocity, user, { r: 0, g: 255, b: 0 });
            })
            api.on('note off', (user, key) => {
                _keyboardState!.unpressKeyWeb(key, user);
            })
            setRoomUsers(data.users);
        });
    }, [])

    return (
        <Container>
            <ToolbarContainer>
                <Toolbar btnTitle={'Test'} />
            </ToolbarContainer>
            <UserBar>
                {roomUsers.map((user, i) => (
                    <UserContainer key={i}>
                        <User name={user.name} pfp={user.pfp} />
                    </UserContainer>
                ))}
            </UserBar>
            <PianoContainer>
                {keyboardState && <Piano keyboard={keyboardState} />}
            </PianoContainer>
        </Container>
    )
}

export default withRouter(Main);