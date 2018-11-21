import styled from "styled-components";
import { clearFix, placeholder } from "polished";
import media from "styled-media-query";

const Module = styled.div`
  ${clearFix()};
  position: relative;
  border-radius: 4px;
  z-index: 1;
  ${media.lessThan("medium")`
    width: 100%;
    left: 0;
    margin: 0;
  `};
`;

const Log = styled.div`
  margin-top: 0px;
  padding: 0 10px;
  & input {
    width: 70px;
    float: left;
    background-color: hsl(0,0%,98%);
    ${placeholder({ color: "#f0f0f0" })};
    font-size: 18px;
  }
  ${clearFix()};
`;
// TO DELETE!!!!
const Header = styled.div`
  margin-top: 0px;
  padding: 0 4px;
  height: 40px;
  ${clearFix()};
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  background: #0b6db5;
  ${media.lessThan("medium")`
  padding-left: 4px;
  `};
`;

const Title = styled.h3`
  float: left;
  color: ${props => props.theme.color.p200};
  height: 40px;
  line-height: 40px;
`;

const SentenceAction = styled.h3`
  font-size: ${props => props.theme.fontSize.h3};
  color: ${props => props.theme.color.p300};
  font-weight: 500;
  font-style: italic;
  float: left;
  line-height: 40px;
  margin-right: 10px;
  max-width: 210px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  text-transform: capitalize;
`;
const Of = styled.span`
  font-size: ${props => props.theme.fontSize.h2};
  color: ${props => props.theme.color.p800};
  font-weight: 300;
  font-style: italic;
  line-height: 40px;
  float: left;
  width: 20px;
  margin-right: 8px;
`;

const Note = styled.div`
position: relative;
border-top: 1px solid #e0e6e8;;
margin: 10px;
display: flex;
${clearFix()}
  & textarea {
    margin-left: 20px;
    margin-top: 10px;
    outline: none;
    float: left
    min-height: 30px;
    resize: none;
    font-size: 14px;
    line-height: 20px;
    clear: both;
    font-weight: 400;
    overflow: hidden;
    word-wrap: break-word;
    color: #333;
    border: none;
    margin: 0;
    background: transparent;
    box-sizing: border-box;
    text-indent: 10px;
    margin-top: 10px;
    margin-left: 20px;
    padding-left: 0;
    flex: 1;
    border: 1px solid transparent;
    &:hover {
      border: 1px solid #cccccc;
    }
    ${placeholder({ color: "#b2b2bc6" })};
  }
`;

const PublishActions = styled.div`
  height: 36px;
  padding: 0 10px;
  ${clearFix} & button {
    float: right;
    width: 120px;
    margin: 0;
    box-shadow: none;
    margin-top: 2px;
    margin-left: 8px;
  }
`;

const ItemDate = styled.div`
  background: transparent;
  border-color: #b7bfc6;
  color: #646f79;
  fill: #848f99;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 18px;
  display: inline-flex;
  flex: 1 1 auto;
  min-width: 1px;
  padding: 3px;
  padding-right: 10px;
  position: relative;
  transition: 0.2s box-shadow, 0.2s color;
  float: left;
  margin-bottom: 0px;
  cursor: pointer;
  &:hover {
    background-color: #f6f8f9;
    border-color: #646f79;
    border-style: solid;
    color: #222b37;
    fill: #222b37;
    cursor: pointer;
    & span {
      background-color: #f6f8f9;
      border-color: #646f79;
      border-style: solid;
      color: #222b37;
      fill: #222b37;
    }
  }
  & span {
    box-sizing: border-box;
    color: #848f99;
    fill: #848f99;
    flex: 0 0 auto;
    font-size: 13px;
    height: 30px;
    line-height: 1;
    transition: 200ms box-shadow, 200ms color, 200ms background, 200ms fill;
    width: 30px;
    background: #fff;
    border: 1px solid #b7bfc6;
    border-radius: 50%;
    align-items: center;
    border-style: dashed;
    display: flex;
    flex-shrink: 0;
    justify-content: center;
    transition: none;
  }

  & > div {
    display: inline-block;
    margin-top: 2px;
  }

  & input {
    border: none;
    font-size: 14px;
    padding: 0;
    height: 36px;
    width: 70px;
    font-weight: 500;
    background: transparent;
    margin: 0;
    margin-left: 10px;
    height: 30px;
    line-height: 30px;
    color: #757575;
    font-size: 13px;
    font-weight: 400;
  }
`;

const ItemDistribution = styled.div`
  margin-right: 10px;
  margin-top: 7px;
  float: right;
  & label {
    color: #828282;
    font-weight: 500;
    letter-spacing: 1px;
    margin-left: 10px;
    font-size: 13px;
  }
`;

const Span = styled.span`
  float: left;
  text-align: center;
  margin-top: 10px;
  cursor: pointer;
  margin-right: 10px;
`;

export default {
  Module,
  Header,
  Title,
  ItemDate,
  Span,
  ItemDistribution,
  Log,
  PublishActions,
  Note,
  SentenceAction,
  Of
};
