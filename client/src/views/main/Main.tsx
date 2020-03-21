import React, { useState, useEffect } from 'react';
import Piano from '../../parts/piano/piano';
import styled from 'styled-components';
import User from '../../parts/user/user';
import { User as UserType, JoinedUser } from '../../data/misc';
import PianoState from '../../data/pianoState';
import { KeyAudioPlayer } from '../../data/audioHandler';
import { MidiHandler } from '../../data/midiHandler';
import Toolbar from '../../parts/toolbar/toolbar';
import Slider from 'react-input-slider';
import socketio from 'socket.io-client';
import BPRApi, { JoinRoomData } from '../../web/api';
import { withRouter, RouteProps, RouteComponentProps } from 'react-router';
import { standardKeyMap } from '../../keymaps/pianoKeyMap';

const barHeight = 80;
const iconSize = 60;

const TopBar = styled.div`
    position: absolute;
    width: 100%;
`;

const UserBar = styled.div`
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
`;

const Icon = styled.div`
    width: ${iconSize}px;
    height: ${iconSize}px;
    margin: 10px;
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
    display: flex;
    align-items: center;
`;

interface MainProps {
    audioPlayer: KeyAudioPlayer;
    midiHandler: MidiHandler;
    api: BPRApi;
}

function Main(props: MainProps & RouteComponentProps<{ room: string }, {}, {}>) {
    const [keyboardState, setKeyboardState] = useState<PianoState | undefined>(undefined);
    const [roomUsers, setRoomUsers] = useState<JoinedUser[]>([]);
    const [volume, setVol] = useState<number>(100);

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
                _keyboardState!.pressKeyWeb(key, velocity, user, roomUsers.find(u => u.id === user)!.color);
            })
            api.on('note off', (user, key) => {
                _keyboardState!.unpressKeyWeb(key, user);
            })
            setRoomUsers(data.users);
        });

        document.addEventListener("keydown", event => {
            if (event.repeat) return;
            if (standardKeyMap[event.key]) _keyboardState.pressKeyLocal(standardKeyMap[event.key], 1)
        });

        document.addEventListener("keyup", event => {
            if (standardKeyMap[event.key]) _keyboardState.unpressKeyLocal(standardKeyMap[event.key])
        });
    }, [])

    return (
        <Container>
            <PianoContainer>
                {keyboardState && <Piano keyboard={keyboardState} />}
            </PianoContainer>
            <TopBar>
                <UserBar>
                    {roomUsers.map((user, i) => (
                        <UserContainer key={i}>
                            <User name={user.name} pfp={user.pfp} color={user.color} />
                        </UserContainer>
                    ))}
                </UserBar>
                {/*
                    <IconContainer>
                        <Icon>
                            asdf
                        </Icon>
                    </IconContainer>
                */}
            </TopBar>
            <ToolbarContainer>
                <div style={{ marginLeft: '15px' }}                >
                    <Slider axis="x" x={volume} onChange={e => {
                        setVol(e.x)
                        props.audioPlayer.setVolume(Math.pow(e.x / 100, 2));
                    }} />
                </div>
            </ToolbarContainer>
        </Container>
    )
}

export default withRouter(Main);