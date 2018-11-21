import React from 'react'
import styled, {css} from 'styled-components'
import {placeholder} from 'polished'

const InputCont = styled.input`
  width: 100%;
  direction: ltr;
  border-radius: 4px;
  display: block;
  box-sizing: border-box;
  margin: 0;
  ${placeholder({'color': '#757575'})}
  color: '#282c37';
  background: '#fff'; 
  padding: 5px;
  font-family: inherit;
  font-size: 14px;
  resize: none;
  border: 0;
  outline: 0;
  height: 34px;
  ${props =>
    props.type === "dark" &&
    css`
      background: #1F2129;
      color: #9baec8;
    `}
  ${props =>
    props.type === "gray" &&
    css`
      background: #efefef;
    `}
`

const Input = ({ onChange, type, name, placeholder, value }) => (
  <InputCont onChange={onChange} type={type} name={name} placeholder={placeholder} value={value} />
)


export default Input
