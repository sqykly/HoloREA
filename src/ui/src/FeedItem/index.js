import React from "react";
import styled from "styled-components";
import Icons from "../atoms/icons";
import { clearFix } from "polished";

export default function({
  image,
  id,
  primary,
  light,
  commitmentId,
  validations,
  openValidationModal,
  secondary,
  date,
  scopeId,
  withValidation,
  withDelete,
  providerId,
  loggedUserId
}) {
  return (
    <FeedItem>
      <Member>
        <MemberItem>
          <Img alt="provider" src={image} />
        </MemberItem>
      </Member>
      <Desc>
        <Primary>
          {primary}
          <Secondary light={light}>{secondary}</Secondary>
        </Primary>
        <Sub>
        <Date>{date}</Date>
        </Sub>
      </Desc>
    </FeedItem>
  );
}

const FeedItem = styled.div`
  min-height: 30px;
  position: relative;
  margin: 0;
  padding: 20px;
  word-wrap: break-word;
  font-size: 14px;
  border-bottom: 1px solid #e9e9e9;
  padding-top: 16px;
  color: ${props => props.theme.color.p800};
  ${clearFix()};
  transition: background 0.5s ease;
`;

const Primary = styled.div`
  line-height: 20px;
  display: inline-block;
  padding: 0;
  background: #f0f8ff0f;
  border-radius: 56px;
  position: relative;
`;

const Secondary = styled.div`
  font-weight: 400;
  margin-top: 4px;
  letter-spacing. .5px;
  line-height: 20px;
  font-size: 14px;
  color: #36393fb0;
`;

const Member = styled.div`
  float: left;
  vertical-align: top;
  margin-right: 14px;
`;
const Validations = styled.div`
  float: right;
  margin-top: 5px;
  vertical-align: sub;
  margin-left: 5px;
`;

const Sub = styled.div`
  ${clearFix()};
  
`;

const MemberItem = styled.span`
  background-color: #d6dadc;
  border-radius: 100px;
  color: #4d4d4d;
  display: inline-block;
  float: left;
  height: 24px;
  overflow: hidden;
  position: relative;
  width: 24px;
  user-select: none;
  z-index: 0;
`;

const Desc = styled.div`
  position: relative;
  min-height: 30px;
  padding-left: 40px;
`;

const Img = styled.img`
  width: 32px;
  height: 32px;
  display: block;
  -webkit-appearance: none;
  line-height: 32px;
  text-indent: 4px;
  font-size: 13px;
  overflow: hidden;
  max-width: 32px;
  max-height: 32px;
  text-overflow: ellipsis;
`;

const Date = styled.div`
  font-weight: 400;
  color: ${props => props.theme.color.p200};
  font-weight: 400;
  font-size: 12px;
  line-height: 32px;
  height: 20px;
  letter-spacing: 1px;
  margin: 0;
  float: left;
`;

const Actions = styled.div`
  ${clearFix()};
  float: left;
  vertical-align: middle;
  margin-left: 0px;
  
`;

const ActionTitle = styled.h3`
  font-weight: 400;
  margin-left: 8px;
  display: inline-block;
  height: 20px;
  line-height: 32px;
  font-size: 12px;
  letter-spacing: 1px;
  color: ${props => props.theme.color.p200};
`;

const Action = styled.div`
  cursor: pointer;
  float: left;
  transition: background-color 0.5s ease;
  padding-right: 8px;
  margin-right: 24px;
  position: relative;
`;

const Span = styled.span`
  vertical-align: sub;
  margin-right: ${props => (props.withText ? "8px" : 0)}
  float: left;
  height: 30px;
  line-height: 30px;
  & svg {
    height: 30px;
  }
`;
