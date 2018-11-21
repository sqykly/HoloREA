import { compose } from "recompose";
import Component from "./logEvent";
import moment from "moment";
import { withFormik } from "formik";
import * as Yup from "yup";

const wrapperComponent = compose(
  withFormik({
    mapPropsToValues: props => ({
      action: { value: props.action, label: props.action } || {
        value: "",
        label: ""
      },
      note: "",
      numericValue: "00.00" || "",
      unit: { value: props.unitId, label: props.unit } || {
        value: "",
        label: ""
      },
      date: moment(),
      affectedResourceClassifiedAsId: {
        value: props.resourceId,
        label: props.resource
      } || { value: "", label: "" }
    }),
    validationSchema: Yup.object().shape({
      action: Yup.object().required(),
      note: Yup.string(),
      numericValue: Yup.number(),
      unit: Yup.object().required(),
      date: Yup.string(),
      affectedResourceClassifiedAsId: Yup.object().required(
        "Classification is a required field"
      )
    }),
    handleSubmit: (values, { props, resetForm, setErrors, setSubmitting }) => {
      let date = moment(values.date).format("YYYY-MM-DD");
      return null
    }
  })
)(Component);

export default wrapperComponent;
