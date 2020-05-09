import React from 'react';
import styled from 'styled-components';
import { Color } from '../../data/misc';

const MsgContainer = styled.div`
    padding: 0.3px;
    background-color: #444444;
    box-shadow: 0 0 3px black;
    border-radius: 12px;
    display: flex;
    user-select: none;
`;

const PfpContainer = styled.div`
    display: flex;
    align-items: top;
`;

const Pfp = styled.div`
    width: 20px;
    height: 20px;
    background-size: cover;
    border: solid 2px green;
    box-shadow: 0 0 3px black;
    border-radius: 100%;
`;

const ColorCircle = styled.div`
    width: 20px;
    height: 20px;
    box-shadow: 0 0 3px black;
    border-radius: 100%;
`;

const Content = styled.div`
    padding-left: 3px;
    padding-right: 7px;
    display: flex;
    justify-content: center;
`;

const Username = styled.div<{color: string}>`
    font-size: 15px;
    color: ${props => props.color};
    font-weight: 700;
    padding-top: 1px;
`;

const Text = styled.div`
    font-size: 15px;
    color: #ccc;
    padding-top: 1px;
    margin-left: 5px;
    word-wrap: break-word;
    word-break: break-word;
    white-space: normal;
`;


interface MsgProps {
    pfp: string;
    color: Color;
    name: string;
    text: string;
}

function Msg(props: MsgProps) {

    function getColStr(col: Color) {
        return `rgb(${col.r},${col.g},${col.b})`;
    }

    return (
        <MsgContainer>
            <PfpContainer>
                {/*
                    <Pfp style={{ backgroundImage: `url("${props.pfp}")` }} />
                */}
                <ColorCircle style={{ backgroundColor: getColStr(props.color) }} />
            </PfpContainer>
            <Content>
                <Username color={getColStr(props.color)}>
                    {props.name}:
                </Username>
                <Text>
                    {props.text}
                </Text>
            </Content>
        </MsgContainer>
    )
}

export default Msg;