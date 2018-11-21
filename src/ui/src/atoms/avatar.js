import styled, {css} from "styled-components";
import { clearFix, ellipsis } from "polished";

export const Img = styled.div`
  float: left;
  background: url(${props => props.src});
  border-radius: ${props => props.theme.avatar.radius};
  width: ${props => props.theme.avatar.size};
  height: ${props => props.theme.avatar.size};
  ${props =>
    props.small &&
    css`
      width: 28px;
      height: 28px;
      margin-top: 4px;
    `};
  background-size: cover;
  background-position: center;
  background-color:  ${props => props.theme.color.p600};
`;

export const AvatarTitle = styled.h3`
  float: left;
  margin-left: 8px;
  line-height: ${props => props.theme.avatar.size};
  font-weight: 400;
  ${ellipsis('200px')}
`;

export const AvatarWrapper = styled.div`
  height: ${props => props.theme.avatar.size};
  // padding: 8px 0;
  ${clearFix()};
  padding-left: 8px;
  ${props =>
    props.active &&
    css`
      background: ${props => props.theme.color.b200};
    `};
`;
