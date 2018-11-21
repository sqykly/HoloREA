import React from "react";
import styled, { css } from "styled-components";
import Header from "./header";
import media from "styled-media-query";
import LogEvent from "../../logEvent";
import Feed from "../../FeedItem";
import moment from "moment";
import {clearFix} from 'polished'
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from '@nivo/line'
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";

export default props => {
  return (
    <Body>
      <Wrapper>
        <Header image={props.providerImage} name={"Ivan Minutillo"} />
        <Content>
          <Inside>
            <Overview>
              <Tabs>
                <StyledTabList>
                  <StyledTab>Exchange</StyledTab>
                  <StyledTab>Balance Sheet</StyledTab>
                </StyledTabList>
                <TabPanel>
                  <SmartSentence>
                    <LogEvent />
                  </SmartSentence>
                  <Tagline>Feed</Tagline>
                  <Feed
                    primary={
                      <FeedItem>
                        <B>Ivan Minutillo</B>{" "}
                        {"exchange" + " " + 5 + " " + "each of"}
                        <i>{"pies"}</i>
                      </FeedItem>
                    }
                    secondary={"Friendly gift"}
                    date={moment().format("DD MMM")}
                  />
                </TabPanel>
                <TabPanel>
                  <BalanceContainer>
                    <Assets>
                      <Box>
                        <BoxTitle>Total current assets</BoxTitle>
                        <BoxData>
                          <span>$</span>183.000
                        </BoxData>
                      </Box>
                      <WrapperViz>
                        <ResponsivePie
                          margin={{
                            top: 20,
                            right: 40,
                            bottom: 20,
                            left: 40
                          }}
                          data={[
                            {
                              id: "lisp",
                              label: "lisp",
                              value: 391
                            },
                            {
                              id: "stylus",
                              label: "stylus",
                              value: 512
                            },
                            {
                              id: "php",
                              label: "php",
                              value: 45
                            },
                            {
                              id: "make",
                              label: "make",
                              value: 225
                            },
                            {
                              id: "go",
                              label: "go",
                              value: 11
                            },
                            {
                              id: "c",
                              label: "c",
                              value: 373
                            },
                            {
                              id: "javascript",
                              label: "javascript",
                              value: 440
                            },
                            {
                              id: "python",
                              label: "python",
                              value: 536
                            },
                            {
                              id: "java",
                              label: "java",
                              value: 232
                            }
                          ]}
                          animate
                          innerRadius={0.6}
                        />
                      </WrapperViz>
                      <SubTitle>Current Assets</SubTitle>
                      <Item active>Cash <span>123.00</span></Item>
                      <Item active>Inventory <span>123.00</span></Item>
                      <Item active>Account Receivable <span>123.00</span></Item>
                    </Assets>
                    <Liabilities>
                      <Box>
                        <BoxTitle>Total current assets</BoxTitle>
                        <BoxData>
                          <span>$</span>183.000
                        </BoxData>
                      </Box>
                      <WrapperViz>
                        <ResponsiveLine
                          margin={{
                            top: 20,
                            right: 20,
                            bottom: 40,
                            left: 40
                          }}
                          data={[
                            {
                              id: "positive :)",
                              data: [
                                { x: 0, y: 0.7 },
                                { x: 1, y: 0.9 },
                                { x: 2, y: 0.8 },
                                { x: 3, y: 0.8 },
                                { x: 4, y: 0.9 },
                                { x: 6, y: 0.4 },
                              ]
                            }
                          ]}
                          animate
                          curve="monotoneX"
                          enableDotLabel
                          dotSymbol={CustomSymbol}
                          dotSize={14}
                          dotBorderWidth={1}
                          dotBorderColor="inherit:darker(0.3)"
                          dotLabelYOffset={-20}
                          enableGridX={false}
                          colors={["rgb(97, 205, 187)", "rgb(244, 117, 96)"]}
                          xScale={{ type: "linear" }}
                          yScale={{
                            type: "linear",
                            stacked: false,
                            min: 0,
                            max: 1
                          }}
                          enableArea
                          areaOpacity={0.07}
                        />
                      </WrapperViz>
                      <SubTitle>Current Assets</SubTitle>
                      <Item>Account Payable <span>123.00</span></Item>
                    </Liabilities>
                  </BalanceContainer>
                </TabPanel>
              </Tabs>
            </Overview>
          </Inside>
        </Content>
      </Wrapper>
    </Body>
  );
};


const CustomSymbol = ({ size, color, borderWidth, borderColor }) => (
  <g>
      <circle fill="#fff" r={size / 2} strokeWidth={borderWidth} stroke={borderColor} />
      <circle
          r={size / 5}
          strokeWidth={borderWidth}
          stroke={borderColor}
          fill={color}
          fillOpacity={0.35}
      />
  </g>
)

const SubTitle = styled.div`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
  margin-top: 24px;
`

const Item = styled.div`
  height: 50px;
  border-radius: 3px;
  background: #353940;
  line-height: 50px;
  font-size: 14px;
  color: #f0f0f0;
  letter-spacing: 0.5px;
  margin-top: 10px;
  padding: 0 10px;
  ${clearFix()};
  ${props =>
    props.active &&
    css`
      & span {
        color: #26ED8E !important;
      }
    `};
  & span {
    float: right;
    color: #EF2978;
    font-size: 11px;
    font-weight: 500;
  }
`

const WrapperViz = styled.div`
  background: #35394020;
  border-radius: 3px;
  padding: 4px;
  margin-top: 20px;
  height: 300px;
`;

const BalanceContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-column-gap: 24px;
  margin-top: 10px;
  padding: 0 10px;
`;

const Assets = styled.div``;
const Liabilities = styled.div``;

const Box = styled.div`
  margin-top: 10px;
`;
const BoxTitle = styled.h3`
  color: #677b83;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;
const BoxData = styled.h2`
  margin-top: 10px;
  font-size: 26px;
  letter-spacing: 1px;
  color: #36393f;
  & span {
    color: #677b83;
  }
`;

const StyledTabList = styled(TabList)`
  border-bottom: 4px solid #485c7a42;
  margin: 10px;
  padding: 0;
  border-radius: 2px;
`;

const StyledTab = styled(Tab)`
  display: inline-block;
  border-bottom: none;
  bottom: -1px;
  position: relative;
  list-style: none;
  padding: 6px 12px;
  cursor: pointer;
  background: transparent !important;
  color: ${props =>
    props.selected ? "#333 !important" : "#33333360 !important"};
  font-size: 13px;
  font-weight: 500 !important;
  letter-spacing: 1px;
  margin-right: 24px;
  padding: 0;
  border: 0;
  padding-bottom: 12px;
  ${props =>
    props.selected &&
    css`
      &:before {
        position: absolute;
        content: "";
        bottom: -3px;
        width: 100%;
        height: 4px;
        background-color: #53d2b2;
        display: block;
        border-radius: 20px;
      }
    `};
`;

const B = styled.b`
  font-weight: 500;
  color: #32211b;
`;

const Tagline = styled.div`
  height: 30px;
  margin: 10px;
  margin-top: 20px;
  background: #e6ecf2;
  line-height: 30px;
  padding: 0 10px;
  border: 1px solid #d6dbdf;
  font-size: 13px;
  color: #535050;
  letter-spacing: 1px;
  font-weight: 500;
  border-radius: 4px;
`;

const SmartSentence = styled.div`
  background: #fff;
  display: flex;
  flex-direction: row;
  margin-bottom: 16px;
  border: 1px solid #dadada;
  border-radius: 4px;
  padding: 10px;
  margin: 10px;
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

const FeedItem = styled.div`
  font-size: ${props => props.theme.fontSize.h3};
  color: ${props => props.theme.color.p900};
`;
