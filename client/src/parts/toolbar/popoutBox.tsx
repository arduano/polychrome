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
  transition: all 0.2s linear;
`;

function PopoutBox(props: {}) {
  return (
    <>
      {popoutStore.showing && (<PopoutBoxCon className={'popout-click-ignore'} style={{...popoutStore.pos, width: popoutStore.width}}>{popoutStore.children}</PopoutBoxCon>)}
    </>
  );
}

export default observer(PopoutBox);
