import defaults from "lodash/defaults";
import React, { PropTypes } from "react";
import { VictoryLabel, Helpers } from "victory-core";

export default class Label extends React.Component {
  static propTypes = {
    datum: PropTypes.object,
    dy: PropTypes.number,
    dx: PropTypes.number,
    index: PropTypes.number,
    events: PropTypes.object,
    position: PropTypes.object,
    style: PropTypes.object,
    textAnchor: PropTypes.string,
    verticalAnchor: PropTypes.string
  };

  render() {
    const {style, datum, events, index, position, text} = this.props
    const labelStyle = Helpers.evaluateStyle(style, datum);
    const labelProps = {
      x: position.x,
      y: position.y,
      dy: dy || labelStyle.padding,
      textAnchor: textAnchor || labelStyle.textAnchor || "middle",
      verticalAnchor: verticalAnchor || "end",
      style: labelStyle,
      events,
      datum,
      text
    };
    return React.createElement(VictoryLabel, labelProps);
  }
}
