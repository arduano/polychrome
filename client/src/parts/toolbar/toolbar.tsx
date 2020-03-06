import React from 'react';
import styled from 'styled-components';

const BottomBar = styled.div`
    background-color: #444444;
    width: 100%;
    height: 100%;
`;

const BtnContainer = styled.div`
    box-shadow: 0 0 5px black;
    border-radius: 12px;
    display: flex;
    height: 100%;
`;

const Button = styled.div`
    font-size: 25px;
    color: #ccc;
    padding-bottom: 1px;
`;

interface ToolbarProps {
    btnTitle: string;
}

export default function Toolbar(props: ToolbarProps) 
{
    return (
        <BottomBar>
            <BtnContainer>
                <Button>
                    {props.btnTitle}
                </Button>
            </BtnContainer>
        </BottomBar>
    );
}