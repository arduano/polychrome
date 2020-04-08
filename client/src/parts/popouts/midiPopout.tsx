import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { MidiHandler } from "../../data/midiHandler";

const MidiButton = styled.div`
`;

interface MidiDevice {
  name: string;
  port: string;
  selected: boolean;
}

function MidiPopout(props: { midiHandler: MidiHandler; }) {
  const [inDevices, setInDevices] = useState<MidiDevice | undefined>(undefined);

  const getInputDevices = () => {
    let midi = props.midiHandler;
    let res: MidiDevice[] = [];
  
    midi.getInputs().forEach(e => {
      res.push({name: e.name, port: e.id, selected: false});
    });
  
    console.log(res);
  
    return res;
  }
  
  const getOutputDevices = () => {
    let midi = props.midiHandler;
    let res: MidiDevice[] = [];
  
    midi.getOutputs().forEach(e => {
      res.push({name: e.name, port: e.id, selected: false});
    });
  
    console.log(res);
  
    return res;
  }

  return (
    <>
      {getInputDevices()?.map(e => (
        <p key={e.port}>{e.name}</p>
      ))}
      {getOutputDevices()?.map(e => (
        <p key={e.port}>{e.name}</p>
      ))}
    </>
  );
}

export default MidiPopout;
