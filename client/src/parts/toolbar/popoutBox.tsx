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

const Inner = styled.div`
  padding: 10px;
`;

function PopoutBox(props: {}) {
  const [top, setTop] = useState<number | undefined>(undefined);
  const [height, setHeight] = useState<number | undefined>(undefined);

  if (!popoutStore.showing) {
    if (undefined !== top) setTop(undefined);
  }

  return (
    <>
      {popoutStore.showing && (
        <PopoutBoxCon className={'popout-click-ignore'} style={{ ...popoutStore.pos, width: popoutStore.width, top }}>
          <Inner ref={r => {
            if (!r) return;
            if (popoutStore.pos.topHeightSubtract && popoutStore.pos.minTop) {
              if (height === r.clientHeight && top !== undefined) return;
              setHeight(r.clientHeight);
              let newTop = popoutStore.pos.topHeightSubtract - r.clientHeight;
              if (newTop < popoutStore.pos.minTop) newTop = popoutStore.pos.minTop;
              setTop(newTop);
            }
          }}>
            {popoutStore.children}
          </Inner>
        </PopoutBoxCon>
      )}
    </>
  );
}

export default observer(PopoutBox);
