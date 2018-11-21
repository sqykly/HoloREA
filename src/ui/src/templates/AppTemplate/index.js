import * as React from "react";
import styled from "styled-components";
import Agent from "../../pages/agent";

const Surface = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  width: 1010px;
  margin: 0 auto;
`;


const AppTemplate = props => {
  return (
    <Surface>
      <Agent />
    </Surface>
  );
};

export default AppTemplate