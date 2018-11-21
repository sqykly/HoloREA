import React from "react";
import Button from '../atoms/button'
import Input from '../atoms/input'
import Textarea from '../atoms/textarea'
import DatePicker from "react-datepicker";
import { Form, Field } from "formik";
import { placeholder } from "polished";
import Log from "./styled";
import Select from "react-select";
import styled from "styled-components";
import Units from "./unit";
import Icons from '../atoms/icons'
import Events from "./events";
import AsyncSelect from "react-select/lib/Async";
require("react-datepicker/dist/react-datepicker-cssmodules.css");


const LogEvent = ({
  values,
  setFieldValue,
  handleMenuSelection,
  errors,
  touched,
  closeLogEvent,
  setFieldTouched,
  menuSelected
}) => (
        <Form>
          <Log.Module>
            <Header>Exchange a resource</Header>
            <Log.Log>
              <Row>
                <Action>
                  <Field
                    name={"action"}
                    render={({ field }) => {
                      return (
                        <Select
                          onChange={val =>
                            setFieldValue("action", {
                              value: val.value,
                              label: val.label
                            })
                          }
                          options={Events}
                          // styles={customStyles}
                          value={field.value}
                          placeholder="Select an event"
                        />
                      );
                    }}
                  />
                  {errors.action &&
                    touched.action && errors.action}
                </Action>
                <Qty>
                  <Field
                    name="numericValue"
                    render={({ field }) => (
                      <Input
                        name={field.name}
                        onChange={field.onChange}
                        type="number"
                        min="00.00"
                        max="100.00"
                        step="0.1"
                        placeholder="00.00"
                      />
                    )}
                  />
                  {errors.numericValue &&
                    touched.numericValue && (
                      errors.numericValue
                    )}
                </Qty>
                <Unit>
                  <Field
                    name={"unit"}
                    render={({ field }) => {
                      return (
                        <Select
                          onChange={val =>
                            setFieldValue("unit", {
                              value: val.value,
                              label: val.label
                            })
                          }
                          options={Units}
                          // styles={customStyles}
                          placeholder="Select a unit"
                          value={field.value}
                        />
                      );
                    }}
                  />
                  {errors.unit && touched.unit && errors.unit}
                </Unit>
                <Resource>
                  <Field
                    name="affectedResourceClassifiedAsId"
                    render={({ field }) => (
                      <AsyncSelect
                        placeholder="Select a classification..."
                        defaultOptions
                        cacheOptions
                        value={field.value}
                        // styles={customStyles}
                        onChange={val =>console.log(val)}
                        loadOptions={val => console.log(val)}
                      />
                    )}
                  />
                  {errors.affectedResourceClassifiedAsId &&
                    touched.affectedResourceClassifiedAsId && (
                      errors.affectedResourceClassifiedAsId
                    )}
                </Resource>
              </Row>
            </Log.Log>
            {/* </div> */}
            <Log.Note>
              <NoteIcon><Icons.Text width='16' height='16' color='#b7bfc6' /></NoteIcon>
              <Field
                name="note"
                render={({ field }) => (
                  <Textarea
                    value={field.value}
                    name={field.name}
                    onChange={field.onChange}
                    placeholder={"Type a note..."}
                  />
                )}
              />
            </Log.Note>

            <Log.PublishActions>
              <StartDate
                value={values.date}
                onChange={setFieldValue}
                onBlur={setFieldTouched}
                error={errors.start}
                touched={touched.start}
              />
              <Button  type="submit">Publish</Button>
              <Button outline onClick={closeLogEvent}>Cancel</Button>
            </Log.PublishActions>
          </Log.Module>
        </Form>
     
  );

const Action = styled.div``;
const Qty = styled.div`
  border-radius: 3px;
  max-height: 36px;
  text-align: center;
  ${placeholder({ color: "red" })};
  & input {
    width: 100%;
    text-align: center;
    color: #333;
    height: 38px;
    border: 1px solid #7d849a50;
    ${placeholder({ color: "red" })};
  }
`;
const Unit = styled.div``;
const Header = styled.div`
height: 30px;
margin: -10px;
margin-bottom: 10px;
background: #e6ecf2;
line-height: 30px;
padding: 0 10px;
border-bottom: 1px solid #d6dbdf;
font-size: 13px;
color: #535050;
letter-spacing: 1px;
font-weight: 500;
`;
const Resource = styled.div`
  margin-bottom: 8px;
`;
const Row = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 2fr 3fr;
  grid-column-gap: 4px;
  & input {
    ${placeholder({ color: "#333" })};
  }
`;


const NoteIcon = styled.div`
    position: absolute;
    top: 17px;
    left: 0px;`

const StartDate = props => {
  const handleChange = value => {
    props.onChange("date", value);
  };
  return (
    <Log.ItemDate>
      <span>
        <Icons.Calendar  width='16' height='16' color='#b7bfc6' />
      </span>
      <DatePicker
        selected={props.value}
        onChange={handleChange}
        dateFormat={"DD MMM"}
        withPortal
      />
      {props.error && props.touched && props.error}
    </Log.ItemDate>
  );
};


export default LogEvent;
