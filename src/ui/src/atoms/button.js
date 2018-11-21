import styled, {css} from 'styled-components'

const Button = styled.button`
  background: #2588d0;
  border: none;
  border-radius: 3px;
  box-sizing: border-box;
  color: #fff;
  cursor: pointer;
  display: inline-block;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  height: 32px;
  letter-spacing: 0;
  line-height: 32px;
  overflow: hidden;
  padding: 0 16px;
  position: relative;
  text-align: center;
  text-transform: capitalize;
  text-decoration: none;
  text-overflow: ellipsis;
  transition: all .1s ease-in;
  white-space: nowrap;
  width: auto;
  &:disabled {
    background: #dadada;
    color: #a9a9a9;
    cursor: no-drop;
  }
${props => props.alert && css`
  background: #FF5630;
  color: white
`}
${props => props.gray && css`
  background: #d2d2d3;;
  color: #4c4c4c;
  `}
  ${props => props.outline && css`
  border: 1px solid #C3C3C3;
  background: transparent;
  color: #4c4c4c;
`}
${props => props.small && css`
  height: 28px;
  line-height: 28px;
  font-size: 14px;
  text-transform: capitalize;
`}
`
export default Button
