import React from 'react';
import styled from 'styled-components';

const UserContainer = styled.div`
    padding: 7px;
    background-color: #444444;
    box-shadow: 0 0 5px black;
    border-radius: 10px;
    display: flex;
`;

const PfpContainer = styled.div`
    display: flex;
    align-items: center;
`;

const Pfp = styled.div<{url: string}>`
    width: 20px;
    height: 20px;
    background-image: url("${props => props.url}");
    background-size: cover;
    border: solid 2px green;
    box-shadow: 0 0 3px black;
    border-radius: 100%;
`;

const Content = styled.div`
    padding-left: 5px;
    display: flex;
    flex-direction: column;
    justify-content: center;
`;

const Username = styled.div`
    font-size: 20px;
    color: #ccc;
`;

interface UserProps {
    pfp: string;
    name: string;
}

function User(props: UserProps) {
    return (
        <UserContainer>
            <PfpContainer>
                <Pfp url={props.pfp}/>
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