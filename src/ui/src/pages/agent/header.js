import React from "react";
import styled from "styled-components";
import media from "styled-media-query";
import { clearFix } from "polished";
export default ({
  name,
  image
}) => {
 
  return (
    <WrappedHeader>
      <Header>
        <HeaderLeft>
          <Img src={image} />
          <Title>{name}</Title>
        </HeaderLeft>
      </Header>

    </WrappedHeader>
  );
};

const WrappedHeader = styled.div`
  ${clearFix()};
  background: #36393F;
  position: relative;
`;

const Header = styled.div`
  position: relative;
  height: 50px;
  color: ${props => props.theme.color.p100};
  background: #36393F;
  border-bottom: 1px solid #1e2024;
  box-shadow: 0 1px 0 #373d45;
  z-index: 9999;
  ${clearFix()};
  ${media.lessThan("medium")`
    width: 100%;
  `};
`;

const HeaderLeft = styled.div`
  float: left;
  margin-left: 8px;
  ${clearFix()};
`;


const Img = styled.div`
  float: left;
  background: url(${props => props.src});
  border-radius: ${props => props.theme.avatar.radius};
  width: ${props => props.theme.avatar.mini};
  height: ${props => props.theme.avatar.mini};
  margin-top: 11px;
  margin-left: 0px;
  background-size: cover;
  background-color: ${props => props.theme.color.p600};
`;
const Title = styled.h2`
  float: left;
  margin-left: 8px;
  line-height: 50px;
`;

