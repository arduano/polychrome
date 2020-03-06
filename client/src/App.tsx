import React, { useState } from 'react';
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

function App() {
    const [mainInfo, setMainInfo] = useState<MainInfoReturn | null>(null);
    const [audioPlayer, setAudioPlayer] = useState<KeyAudioPlayer | null | 'loading'>(null);
    const [midiHandler, setMidiHandler] = useState<MidiHandler | null | 'loading'>(null);
    if (!mainInfo) WebApi.getMainInfo().then(setMainInfo);

    if (!audioPlayer) {
        KeyAudioPlayer.create().then(setAudioPlayer)
        setAudioPlayer('loading');
    }
    if (!midiHandler) {
        MidiHandler.create().then(setMidiHandler)
        setMidiHandler('loading');
    }

    let loading =
        audioPlayer === null || audioPlayer === 'loading' ||
        midiHandler === null || midiHandler === 'loading' ||
        !mainInfo;

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
                            <Main audioPlayer={audioPlayer as KeyAudioPlayer} midiHandler={midiHandler as MidiHandler} />
                        </Route>
                    </Switch >
                )}
        </Router >
    )
}

export default App;
