import React from "react";
import styled from "styled-components";

export default ({ title, value }) => (
  <Box>
    <BoxTitle>{title}</BoxTitle>
    <BoxData>
      <span>$</span>
      {value}
    </BoxData>
  </Box>
);



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