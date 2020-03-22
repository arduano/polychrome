import React, { useState, useEffect } from "react";
import styled from "styled-components";
import popoutStore from "../../data/popout";

const Button = styled.div`
  background-color: #444444;
  color: #ccc;
  text-align: center;
  border-radius: 10px;
  min-width: 100px;
  margin-right: 10px;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 0 5px black;

  :hover {
    transform: translateY(-1px);
    box-shadow: 0 0 8px black;
  }

  :active {
    transform: translateY(1px);
    box-shadow: 0 0 2px black;
  }
`;

const PopoutBox = styled.div`
  position: absolute;
  background-color: #fff;
  box-shadow: 0 0 5px black;
  min-height: 20px;
  overflow-y: scroll;
`;

interface PopoutButtonProps {
  text: string;
  children?: any;
}

function PopoutButton(props: PopoutButtonProps) {

  return (
    <>
      <Button 
        className={'popout-click-ignore'}
        onClick={e => {
          let target = e.target as Element;
          if(popoutStore.lastButton == target && popoutStore.showing) {
            popoutStore.showing = false;
            return;
          }
          popoutStore.lastButton = target;
          let pos = target.getBoundingClientRect();
          let clientWidth = document.body.clientWidth;
          let clientHeight = document.body.clientHeight;
          let buttonCenter = pos.left + pos.width / 2
          let bottom = clientHeight - (pos.top - 10);
          let left = buttonCenter - popoutStore.width / 2;
          let maxHeight = clientHeight - bottom - 20;
          if(left < 20) left = 20;

          popoutStore.pos = {left, bottom, maxHeight};
          popoutStore.showing = true;
          popoutStore.children = props.children;
        }}
      >
        {props.text}
      </Button>
    </>
  );
}

export default PopoutButton;
