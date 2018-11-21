import React from 'react'
import styled, {css} from 'styled-components'
import {placeholder} from 'polished'

const TextArea = styled.textarea`
  width: 100%;
  direction: ltr;
  border-radius: 4px;
  display: block;
  box-sizing: border-box;
  margin: 0;
  color: #282c37;
  background: #fff;
  padding: 5px;
  font-family: inherit;
  background: '#fff'; 
  font-size: 14px;
  resize: none;
  border: 0;
  outline: 0;
  height: 100%;
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
  ${placeholder({
    color: '#757575'
  })}
`

const Textarea = ({placeholder, name, onChange, type, value}) => (<TextArea onChange={onChange} name={name} type={type} placeholder={placeholder} value={value} />)

export default Textarea
