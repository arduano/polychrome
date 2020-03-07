import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Main from './views/main/Main';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect,
    Link
} from "react-router-dom";
import { WebApi } from './web/restful';
import { MainInfoReturn } from './data/misc';
import { KeyAudioPlayer } from './data/audioHandler';
import { MidiHandler } from './data/midiHandler';
import store from './data/stores';
import BPRApi from './web/api';

function App() {
    const [mainInfo, setMainInfo] = useState<MainInfoReturn | null>(null);
    const [audioPlayer, setAudioPlayer] = useState<KeyAudioPlayer | null>(null);
    const [midiHandler, setMidiHandler] = useState<MidiHandler | null>(null);
    const [api, setApi] = useState<BPRApi | null>(null);
    if (!mainInfo) WebApi.getMainInfo().then(setMainInfo);

    useEffect(() => {
        MidiHandler.create().then(setMidiHandler);
        KeyAudioPlayer.create().then(setAudioPlayer);
        BPRApi.logInAsGuest('Arduano').then(api => {
            store.user.guest = api.guest;
            store.user.id = api.id;
            store.user.pfp = api.pfp;
            store.user.name = api.name;
            store.token = api.token;
            setApi(api);
        });
        console.log(api);
    }, []);

    let loading =
        audioPlayer === null || midiHandler === null ||
        !mainInfo || !store.token || !api;

    return (
        <Router>
            {loading ? (
                <div>temporary loading message...</div>
            ) : (
                    <Switch>
                        <Route path='/' exact>
                            <Redirect to={'/' + mainInfo!.defaultRoom} />
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
