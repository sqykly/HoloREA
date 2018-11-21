import React from "react";
import styled from "styled-components";
import Header from "./header";
import media from "styled-media-query";
import Select from "react-select";

export default props => {
  return (
    <Body>
      <Wrapper>
        <Header
          image={props.providerImage}
          name={'Ivan Minutillo'}
        />
        <Content>
          <Inside>
            <Overview>
              <SmartSentence>
                <Img
                  style={{ backgroundImage: `url(${props.providerImage})` }}
                />
                <WrapperNew>
                  <Select
                    styles={customStylesTwo}
                    onChange={props.openStuff}
                    value={{ value: null, label: "Add new..." }}
                    options={[
                      { value: "requirement", label: "Add a new requirement" },
                      { value: "process", label: "Add a new process" }
                    ]}
                  />
                </WrapperNew>
              </SmartSentence>
              
            </Overview>
          </Inside>
        </Content>
      </Wrapper>
    </Body>
  );
}

const WrapperNew = styled.div`
  cursor: pointer;
  box-sizing: border-box;
  width: 180px;
  position: relative;
  z-index: 99999;
  margin-right: 16px;
  margin-top: 10px;
  flex: 1;
`;

const Img = styled.div`
  width: 34px;
  height: 34px;
  background: ${props => props.theme.color.p150};
  border-radius: 100px;
  display: inline-block;
  margin-right: 8px;
  margin-left: 16px;
  margin-top: 18px;
  vertical-align: middle;
  background-size: cover;
`;

const SmartSentence = styled.div`
  height: 70px;
  background: #fff;
  display: flex;
  flex-direction: row;
  margin-bottom: 16px;
  border: 1px solid #dadada;
  border-radius: 4px;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  position: relative;
  flex: 1;
  margin-top: 8px;
  margin-left: 8px;
  min-height: 100vh;
  ${media.lessThan("medium")`
    display: ${props => (props.isopen ? "none" : "flex")}
  `};
`;

const Content = styled.div`
  flex: 1 1 auto;
  will-change: transform;
  display: flex;
  flex: 1;
  background: #f2f4f8;
`;

const Inside = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-content: center;
  position: relative;

  position: relative;
`;

const Overview = styled.div`
  flex: 1;
  ${media.lessThan("medium")`
  width: 100%;
  margin-top: 16px;
  `};
`;

const Body = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
`;

const customStylesTwo = {
  control: base => ({
    ...base,
    background: "#e3ebf2;",
    border: "0px solid #396ea6",
    color: "#32211B80",
    fontWeight: 500,
    fontSize: "13px",
    minHeight: "50px",
    height: "50px",
    borderRadius: "6px"
  }),
  input: base => ({
    ...base,
    color: "#32211B80",
    fontWeight: 500,
    fontSize: "13px",
    height: "50px",
    minHeight: "50px"
  }),
  singleValue: base => ({
    ...base,
    color: "#32211B80",
    fontWeight: 500,
    fontSize: "13px"
  }),
  option: base => ({
    ...base,
    fontSize: "13px"
  }),
  menuList: base => ({
    ...base,
    fontSize: "13px"
  }),
  placeholder: base => ({
    ...base,
    color: "#32211B80",
    fontWeight: 500,
    fontSize: "13px"
  })
};
