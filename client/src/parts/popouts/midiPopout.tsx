import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { MidiHandler } from "../../data/midiHandler";
import { Input, Output } from "webmidi";

const MidiButton = styled.div`
`;

let idCounter = 0;

interface MidiDevice {
    id: number;
    name: string;
    port: string;
}

const DeviceItem = styled.div<{ selected: boolean }>`
    padding: 5px;
    text-align: center;

    transition: background-color 0.2s;

    user-select: none;
    cursor: pointer;

    :hover {
        background-color: #fff3;
    }
`;

const DeviceItemList = styled.div`
    margin-bottom: 10px;
`;

const DeviceListTitle = styled.div`
    padding: 5px;
    text-align: center;
    color: #fff;
`;

function MidiPopout(props: { midiHandler: MidiHandler; }) {
    const [inDevices, setInDevices] = useState<MidiDevice[]>([]);
    const [outDevices, setOutDevices] = useState<MidiDevice[]>([]);
    const [selectedInDevice, setSelectedInDevice] = useState<MidiDevice | undefined>(undefined);
    const [selectedOutDevice, setSelectedOutDevice] = useState<MidiDevice | undefined>(undefined);

    useEffect(() => {
        let midi = props.midiHandler;

        const mapDevices = (dev: Input | Output): MidiDevice => ({
            id: idCounter++,
            name: dev.name,
            port: dev.id,
        });

        setInDevices(midi.getInputs().map(mapDevices));
        setOutDevices(midi.getOutputs().map(mapDevices));
    }, [])

    return (
        <>
            <DeviceItemList>
                <DeviceListTitle>
                    Inputs
                </DeviceListTitle>
                {inDevices.map((e, i) => (
                    <DeviceItem key={i} selected={!!selectedInDevice && (e.id === selectedInDevice.id)}>
                        {e.name}
                    </DeviceItem>
                ))}
            </DeviceItemList>
            <DeviceItemList>
                <DeviceListTitle>
                    Outputs
                </DeviceListTitle>
                {outDevices.map((e, i) => (
                    <DeviceItem key={i} selected={!!selectedOutDevice && (e.id === selectedOutDevice.id)}>
                        {e.name}
                    </DeviceItem>
                ))}
            </DeviceItemList>
        </>
    );
}

export default MidiPopout;
