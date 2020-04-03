import React, { useState, useEffect } from "react";
import styled from "styled-components";
import popoutStore from "../../data/popout";
import { observer } from "mobx-react"

const PopoutBoxCon = styled.div`
  position: absolute;
  background-color: #444444;
  color: #ccc;
  box-shadow: 0 0 5px black;
  min-height: 20px;
  overflow-y: auto;
  transition: all 0.2s ease;
  border-radius: 10px;
  padding: 10px;

  ::-webkit-scrollbar {
    width: 1em;
  }

  ::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    border-radius: 10px;
  }

  ::-webkit-scrollbar-thumb {
    background-color: #333;
    outline: 1px solid slategrey;
    border-radius: 10px;
  }
`;

function PopoutBox(props: {}) {
  return (
    <>
      {popoutStore.showing && (<PopoutBoxCon className={'popout-click-ignore'} style={{...popoutStore.pos, width: popoutStore.width}}>{popoutStore.children}</PopoutBoxCon>)}
    </>
  );
}

export default observer(PopoutBox);
