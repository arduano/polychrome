import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import Main from './views/main/Main';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect,
    Link
} from "react-router-dom";
import { KeyAudioPlayer } from './data/audioHandler';
import { MidiHandler } from './data/midiHandler';
import store from './data/stores';
import BPRApi from './web/api';
import popoutStore from './data/popout';

const OverlayPage = styled.div`
    position: fixed;
    left: 0;
    right: 0;
    width: 100vw;
    height: 100vh;

    background-color: #333;

    display: flex;
    justify-content: center;
    align-items: center;
`;

const EnterNameForm = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: 100px;
`;

const EnterNameTitle = styled.div`
    font-size: 32px;
    color: #CCC;
`;

const EnterNameBox = styled.input`
    font-size: 24px;
    color: #AAA;
    border: 1px solid #777;
    border-radius: 15px;
    background-color: #222;
    outline: none;
    padding: 10px 15px;
    margin-top: 20px;

    transition: all 0.1s;
    box-shadow: 0 0 8px black;

    :focus{
        transform: translateY(2px);
        box-shadow: 0 0 5px black;
    }
`;

const EnterNameButton = styled.button`
    font-size: 28px;
    border-radius: 10px;
    background-color: #00AA00;
    border: none;
    padding: 5px 20px;
    margin-top: 15px;
    box-shadow: 0 0 8px black;
    color: white;
    outline: none;
    transition: all 0.1s;

    :active{
        transform: translateY(2px);
        box-shadow: 0 0 5px black;
    }
`;

const Spin = keyframes`
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
`;

const Loader = styled.div`
    animation: ${Spin} 1.2s linear infinite;
    border-radius: 100%;
    border: 3px solid black;
    border-color: #7289da #7289da #7289da transparent;
    margin: auto;
    width: 40px;
    height: 40px;
`;

const LoaderContainer = styled.div`
    display: flex;
    align-items: center;
`;

const LoaderText = styled.div`
    font-size: 32px;
    color: #AAA;
    margin-left: 20px;
`;

function App() {
    const [audioPlayer, setAudioPlayer] = useState<KeyAudioPlayer | null>(null);
    const [midiHandler, setMidiHandler] = useState<MidiHandler | null>(null);
    const [api, setApi] = useState<BPRApi | null>(null);
    const [loggingIn, setLoggingIn] = useState<boolean>(false);
    const [enteredName, setEnteredName] = useState<string>('');
    const [mainInput, setMainInput] = useState<'loading' | HTMLInputElement>('loading');
    const [inputLoaded, setInputLoaded] = useState<boolean>(false);

    const submitName = (name: string) => {
        if (loggingIn) return;
        name = name.trim();
        if (name.length === 0 || name.length >= 25) return;
        localStorage.setItem('guestName', name);
        localStorage.setItem('guestNameTime', Date.now().toString());
        BPRApi.logInAsGuest(name).then(api => {
            store.user.guest = api.guest;
            store.user.id = api.id;
            store.user.pfp = api.pfp;
            store.user.name = api.name;
            store.token = api.token;
            setApi(api);
        });
        setLoggingIn(true);
    }

    (() => {
        let guestName = localStorage.getItem('guestName');
        if (guestName !== null) {
            let time = localStorage.getItem('guestNameTime');
            if (time !== null && parseInt(time) > Date.now() - 1000 * 60 * 60) {
                submitName(guestName)
            }
        }
    })()

    if (mainInput !== 'loading' && !inputLoaded) {
        mainInput.focus();
        setInputLoaded(true);
    }

    useEffect(() => {
        MidiHandler.create().then(setMidiHandler);
        KeyAudioPlayer.create().then(setAudioPlayer);

        document.addEventListener('click', e => {
            if(!popoutStore.showing) return;
            let target = e.target as Element | null;
            while(target) {
                if(target.classList.contains('popout-click-ignore')) return;
                target = target.parentElement;
            }
            popoutStore.showing = false;
        });
    }, []);

    let loading =
        audioPlayer === null || midiHandler === null ||
        !store.token || !api;

    return (
        <Router>
            {loading ? (
                <OverlayPage>
                    {
                        api || loggingIn ? (
                            <LoaderContainer>
                                <Loader></Loader>
                                <Switch>
                                    {!api && (<LoaderText>Connecting...</LoaderText>)}
                                    {!midiHandler && (<LoaderText>Waiting for midi...</LoaderText>)}
                                    {!audioPlayer && (<LoaderText>Downloading audio...</LoaderText>)}
                                    (<LoaderText>Loading...</LoaderText>)
                                </Switch>
                            </LoaderContainer>
                        ) : (
                                <EnterNameForm>
                                    <EnterNameTitle>Enter Name</EnterNameTitle>
                                    <EnterNameBox
                                        spellCheck={false}
                                        value={enteredName}
                                        onChange={e => {
                                            if (e.target.value.length >= 25) return;
                                            setEnteredName(e.target.value)
                                        }}
                                        ref={e => {
                                            if (e && mainInput === 'loading') {
                                                setMainInput(e);
                                            }
                                        }}
                                        onKeyPress={e => {
                                            if (e.key === 'Enter') {
                                                if (inputLoaded && mainInput !== 'loading') {
                                                    submitName(mainInput.value);
                                                }
                                            }
                                        }}
                                    />
                                    <EnterNameButton onClick={e => {
                                        if (inputLoaded && mainInput !== 'loading') {
                                            submitName(mainInput.value);
                                        }
                                    }}>
                                        Join!
                                    </EnterNameButton>
                                </EnterNameForm>
                            )
                    }
                </OverlayPage>
            ) : (
                    <Switch>
                        <Route path='/' exact>
                            <Redirect to={'/' + api!.defaultRoom} />
                        </Route>
                        <Route path='/:room' exact>
                            <Main api={api!} audioPlayer={audioPlayer!} midiHandler={midiHandler!} />
                        </Route>
                    </Switch >
                )}
        </Router >
    )
}

export default App;
