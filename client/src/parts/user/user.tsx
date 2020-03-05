import React from 'react';
import styled from 'styled-components';

const UserContainer = styled.div`
    padding: 0.3px;
    background-color: #444444;
    box-shadow: 0 0 5px black;
    border-radius: 12px;
    display: flex;
    cursor: pointer;
    user-select: none;
    transition: all 0.1s;

    :hover{
        transform: translateY(-1px);
        box-shadow: 0 0 8px black;
    }

    :active{
        transform: translateY(1px);
        box-shadow: 0 0 2px black;
    }
`;

const PfpContainer = styled.div`
    display: flex;
    align-items: center;
`;

const Pfp = styled.div<{ url: string }>`
    width: 20px;
    height: 20px;
    background-image: url("${props => props.url}");
    background-size: cover;
    border: solid 2px green;
    box-shadow: 0 0 3px black;
    border-radius: 100%;
`;

const Content = styled.div`
    padding-left: 3px;
    padding-right: 7px;
    display: flex;
    flex-direction: column;
    justify-content: center;
`;

const Username = styled.div`
    font-size: 15px;
    color: #ccc;
    padding-bottom: 1px;
`;

interface UserProps {
    pfp: string;
    name: string;
}

function User(props: UserProps) {
    return (
        <UserContainer>
            <PfpContainer>
                <Pfp url={props.pfp} />
            </PfpContainer>
            <Content>
                <Username>
                    {props.name}
                </Username>
            </Content>
        </UserContainer>
    )
}

export default User;