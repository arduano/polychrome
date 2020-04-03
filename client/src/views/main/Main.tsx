import React, { useState, useEffect } from 'react';
import Piano from '../../parts/piano/piano';
import styled from 'styled-components';
import User from '../../parts/user/user';
import { User as UserType, JoinedUser } from '../../data/misc';
import PianoState from '../../data/pianoState';
import { KeyAudioPlayer } from '../../data/audioHandler';
import { MidiHandler } from '../../data/midiHandler';
import Slider from 'react-input-slider';
import socketio from 'socket.io-client';
import BPRApi, { JoinRoomData } from '../../web/api';
import { withRouter, RouteProps, RouteComponentProps } from 'react-router';
import { standardKeyMap } from '../../keymaps/pianoKeyMap';
import PopoutButton from '../../parts/toolbar/popoutButton';
import PopoutBox from '../../parts/toolbar/popoutBox';
import Msg from '../../parts/chat/chatMsg';

const barHeight = 80;
const iconSize = 60;
let msgId = 0;

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

const UserContainer = styled.div`
    margin: 5px;
`;

const ToolbarContainer = styled.div`
    position: absolute;
    right: 0;
    left: 0;
    bottom: 0;
    height: 48px;
    padding-left: 20px;
    display: flex;
    align-items: center;
    color: #ccc;
    font-weight: 700;
    user-select: none;
`;

const ChatContainer = styled.div`
    position: absolute;
    bottom: 48px;
    left: 0;
    right: 0;
    padding: 20px;
`;

const ChatInput = styled.input`
    outline: none;
    border: 1px solid #666;
    border-radius: 5px;
    background-color: #333;
    color: #ccc;
    width: calc(100% - 10px);
    font-size: 18px;
    padding: 2px 5px;
    box-shadow: 0 0 2px black;
`;

const MsgContainer = styled.div`
    position: relative;
    width: calc(100% - 10px);
    margin-bottom: 10px;
`;

const ChatMsg = styled.div`
    margin-top: 5px;
    display: inline-block;
`;

interface MainProps {
    audioPlayer: KeyAudioPlayer;
    midiHandler: MidiHandler;
    api: BPRApi;
}

interface Msg {
    text: string;
    user: JoinedUser;
    id: number;
}

function Main(props: MainProps & RouteComponentProps<{ room: string }, {}, {}>) {
    const [keyboardState, setKeyboardState] = useState<PianoState | undefined>(undefined);
    const [roomUsers, setRoomUsers] = useState<JoinedUser[]>([]);
    const [volume, setVol] = useState<number>(100);
    const [msg, setMsg] = useState<Msg[]>([]);
    const [chatBoxText, setChatBoxText] = useState<string>("");
    const [state, setState] = useState({keyboardState, roomUsers, volume, msg});
    state.roomUsers = roomUsers;
    state.keyboardState = keyboardState;
    state.volume = volume;
    state.msg = msg;

    let api = props.api;

    const processApi = () => {
        api.joinRoom(props.match.params.room).then((data: JoinRoomData) => {
            api.on('user join', (user) => {
                setRoomUsers(u => u.concat([user]));
            })
            api.on('user leave', (user) => {
                let i = roomUsers.findIndex(u => u.id == user.id);
                setRoomUsers(u => u.filter(_u => _u.id !== user.id));
            })
            api.on('note on', (user, key, velocity) => {
                state.keyboardState!.pressKeyWeb(key, velocity, user.id, user.color);
            })
            api.on('note off', (user, key) => {
                state.keyboardState!.unpressKeyWeb(key, user.id);
            })
            api.on('chat', (text, user) => {
                setMsg([{text, user, id: msgId++}, ...state.msg])
            })
            setRoomUsers(data.users);
        });
    }

    const sendMessage = (text: string) => {
        setMsg([{text, user: api.self, id: msgId++}, ...state.msg]);
        api.sendMessage(text);
    }

    useEffect(() => {
        let _keyboardState = new PianoState(props.audioPlayer, props.midiHandler, props.api);
        setKeyboardState(_keyboardState);

        processApi();

        document.addEventListener("keydown", event => {
            let target = event.target as Element;
            if(event.repeat) return;
            if(target.tagName == "INPUT") return;
            if(standardKeyMap[event.key]) _keyboardState.pressKeyLocal(standardKeyMap[event.key], 1)
        });

        document.addEventListener("keyup", event => {
            let target = event.target as Element;
            if(target.tagName == "INPUT") return;
            if (standardKeyMap[event.key]) _keyboardState.unpressKeyLocal(standardKeyMap[event.key])
        });
    }, [])

    let msgReverse = [...msg].reverse();

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
            </TopBar>
            <ChatContainer>
                <MsgContainer>
                    {msgReverse.map(msg => (
                        <ChatMsg key={msg.id}>
                            <Msg text={msg.text} name={msg.user.name} color={msg.user.color} pfp={msg.user.pfp} />
                        </ChatMsg>
                    ))}
                </MsgContainer>
                <ChatInput value={chatBoxText} onChange={e => {
                    let newText = e.target.value;
                    if(newText.length > 1000) {
                        if(newText.startsWith(chatBoxText)) {
                            newText = newText.substr(0, 1000);
                        } else {
                            return;
                        }
                    }
                    setChatBoxText(newText)
                }} 
                onKeyPress={e => {
                    if(e.key == "Enter") {
                        sendMessage(chatBoxText);
                        setChatBoxText("");
                    }
                }}></ChatInput>
            </ChatContainer>
            <ToolbarContainer>
                <PopoutButton text={'Room'}><div style={{height: '9999px'}}>Test</div></PopoutButton>
                <PopoutButton text={'MIDI'}><div style={{height: '99px'}}>Fuck</div></PopoutButton>
                <PopoutButton text={'Settings'}><div style={{height: '9px'}}>Shit</div></PopoutButton>
                <div style={{ display: 'flex' }}>
                    Volume:
                    <div style={{ marginLeft: '15px' }}>
                        <Slider axis="x" x={volume} onChange={e => {
                            setVol(e.x)
                            props.audioPlayer.setVolume(Math.pow(e.x / 100, 2));
                        }} />
                    </div>
                </div>
            </ToolbarContainer>
            <PopoutBox></PopoutBox>
        </Container>
    )
}

export default withRouter(Main);