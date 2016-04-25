import sortBy from "lodash/sortBy";
import defaults from "lodash/defaults";
import assign from "lodash/assign";
import React, { PropTypes } from "react";
import LineSegment from "./line-segment";
import LineLabel from "./line-label";
import Point from "../shared/point";
import Label from "../shared/label";
import Scale from "../../helpers/scale";
import Domain from "../../helpers/domain";
import Data from "../../helpers/data";
import { PropTypes as CustomPropTypes, Helpers, VictoryTransition } from "victory-core";

const defaultStyles = {
  markers: {
    opacity: 1
  },
  data: {
    strokeWidth: 2,
    fill: "none",
    stroke: "#756f6a",
    opacity: 1
  },
  labels: {
    padding: 5,
    fontFamily: "Helvetica",
    fontSize: 10,
    strokeWidth: 0,
    stroke: "transparent",
    textAnchor: "start"
  }
};

const getStyles = (props) => {
  const style = props.style || {};
  return {
    parent: defaults({width: "100%", height: "auto"}, style.parent, defaultStyles.parent),
    data: defaults({}, style.data, defaultStyles.data),
    labels: defaults({}, style.labels, defaultStyles.labels),
    line: defaults({}, style.line, defaultStyles.line)
  };
};

export default class VictoryLine extends React.Component {
  static role = "line";

  static defaultTransitions = {
    onExit: {
      duration: 500,
      before: () => ({ y: null })
    },
    onEnter: {
      duration: 500,
      before: () => ({ y: null }),
      after: (datum) => ({ y: datum.y})
    }
  };

  static propTypes = {
    /**
     * The animate prop specifies props for VictoryAnimation to use. The animate prop should
     * also be used to specify enter and exit transition configurations with the `onExit`
     * and `onEnter` namespaces respectively.
     * @examples {duration: 500, onEnd: () => {}, onEnter: {duration: 500, before: () => ({y: 0})})}
     */
    animate: PropTypes.object,
    /**
     * The categories prop specifies how categorical data for a chart should be ordered.
     * This prop should be given as an array of string values, or an object with
     * these arrays of values specified for x and y. If this prop is not set,
     * categorical data will be plotted in the order it was given in the data array
     * @examples ["dogs", "cats", "mice"]
     */
    categories: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.string),
      PropTypes.shape({
        x: PropTypes.arrayOf(PropTypes.string),
        y: PropTypes.arrayOf(PropTypes.string)
      })
    ]),
    /**
     * The data prop specifies the data to be plotted.
     * Data should be in the form of an array of data points.
     * Each data point may be any format you wish (depending on the `x` and `y` accessor props),
     * but by default, an object with x and y properties is expected.
     * @examples [{x: 1, y: 2}, {x: 2, y: 3}], [[1, 2], [2, 3]],
     * [[{x: "a", y: 1}, {x: "b", y: 2}], [{x: "a", y: 2}, {x: "b", y: 3}]]
     */

    data: PropTypes.array,
    /**
     * The dataComponent prop takes an entire, HTML-complete data component which will be used to
     * create markers for each point given in data. The new element created from the passed
     * dataComponent will have the property datum set by VictoryLine for the point it renders;
     * properties position (x, y), datum, style, events, and index are all provided
     * If a dataComponent is not provided, VictoryScatter's Point component will be used.
     * to render invisible points (useful for attaching events)
     */
    dataComponent: PropTypes.element,
    /**
     * The domain prop describes the range of values your chart will include. This prop can be
     * given as a array of the minimum and maximum expected values for your chart,
     * or as an object that specifies separate arrays for x and y.
     * If this prop is not provided, a domain will be calculated from data, or other
     * available information.
     * @examples [-1, 1], {x: [0, 100], y: [0, 1]}
     */
    domain: PropTypes.oneOfType([
      CustomPropTypes.domain,
      PropTypes.shape({
        x: CustomPropTypes.domain,
        y: CustomPropTypes.domain
      })
    ]),
    /**
     * The events prop attaches arbitrary event handlers to data and label elements
     * Event handlers are called with their corresponding events, corresponding component props,
     * and their index in the data array, and event name. The return value of event handlers
     * will be stored by unique index on the state object of VictoryLine
     * i.e. `this.state.dataState[dataIndex] = {style: {fill: "red"}...}`, and will be
     * applied to by index to the appropriate child component. Event props on the
     * parent namespace are just spread directly on to the top level svg of VictoryLine
     * if one exists. If VictoryLine is set up to render g elements i.e. when it is
     * rendered within chart, or when `standalone={false}` parent events will not be applied.
     *
     * @examples {data: {
     *  onClick: () => onClick: () => return {style: {stroke: "green"}}
     *}}
     */
    events: PropTypes.shape({
      data: PropTypes.object,
      labels: PropTypes.object,
      markers: PropTypes.object,
      parent: PropTypes.object
    }),
    /**
     * The height props specifies the height the svg viewBox of the chart container.
     * This value should be given as a number of pixels
     */
    height: CustomPropTypes.nonNegative,
    /**
     * The interpolation prop determines how data points should be connected
     * when plotting a line
     */
    interpolation: PropTypes.oneOf([
      "basis",
      "basisClosed",
      "basisOpen",
      "bundle",
      "cardinal",
      "cardinalClosed",
      "cardinalOpen",
      "catmullRom",
      "catmullRomClosed",
      "catmullRomOpen",
      "linear",
      "linearClosed",
      "monotoneX",
      "monotoneY",
      "natural",
      "radial",
      "step",
      "stepAfter",
      "stepBefore"
    ]),
    /**
     * The labels prop defines labels that will appear above each data marker in your chart.
     * This prop should be given as an array of values or as a function of data.
     * If given as an array, the number of elements in the array should be equal to
     * the length of the data array. Labels may also be added directly to the data object
     * @examples: ["spring", "summer", "fall", "winter"], (datum) => datum.title
     */
    labels: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.array
    ]),
    /**
     * The labelComponent prop takes in an entire, HTML-complete label
     * component which will be used to create labels for each point in the line
     * chart. The new element created from the passed labelComponent will have
     * property data provided by the bar's datum; properties x, y, textAnchor,
     * and verticalAnchor preserved or default values provided by the bar; and
     * styles filled out with defaults provided by the bar, and overrides from
     * the datum. If labelComponent is omitted, a new VictoryLabel will be
     * created with props and styles from the bar.
     */
    labelComponent: PropTypes.element,
    /**
     * The padding props specifies the amount of padding in number of pixels between
     * the edge of the chart and any rendered child components. This prop can be given
     * as a number or as an object with padding specified for top, bottom, left
     * and right.
     */
    padding: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.shape({
        top: PropTypes.number,
        bottom: PropTypes.number,
        left: PropTypes.number,
        right: PropTypes.number
      })
    ]),
    /**
     * The samples prop specifies how many individual points to plot when plotting
     * y as a function of x. Samples is ignored if x props are provided instead.
     */
    samples: CustomPropTypes.nonNegative,
    /**
     * The scale prop determines which scales your chart should use. This prop can be
     * given as a string specifying a supported scale ("linear", "time", "log", "sqrt"),
     * as a d3 scale function, or as an object with scales specified for x and y
     * @exampes d3Scale.time(), {x: "linear", y: "log"}
     */
    scale: PropTypes.oneOfType([
      CustomPropTypes.scale,
      PropTypes.shape({
        x: CustomPropTypes.scale,
        y: CustomPropTypes.scale
      })
    ]),
    /**
     * The seriesLabel prop defines the label that will appear at the end of the line.
     * This prop may be given as a string or a custom label element
     */
    seriesLabel: PropTypes.any,
    /**
     * The standalone prop determines whether the component will render a standalone svg
     * or a <g> tag that will be included in an external svg. Set standalone to false to
     * compose VictoryLine with other components within an enclosing <svg> tag.
     */
    standalone: PropTypes.bool,
    /**
     * The style prop specifies styles for your VictoryLine. Any valid inline style properties
     * will be applied. Height, width, and padding should be specified via the height,
     * width, and padding props, as they are used to calculate the alignment of
     * components within chart.
     * @examples {data: {stroke: "red"}, labels: {fontSize: 12}}
     */
    style: PropTypes.shape({
      parent: PropTypes.object,
      data: PropTypes.object,
      labels: PropTypes.object,
      markers: PropTypes.object
    }),
    /**
     * The width props specifies the width of the svg viewBox of the chart container
     * This value should be given as a number of pixels
     */
    width: CustomPropTypes.nonNegative,
    /**
     * The x prop specifies how to access the X value of each data point.
     * If given as a function, it will be run on each data point, and returned value will be used.
     * If given as an integer, it will be used as an array index for array-type data points.
     * If given as a string, it will be used as a property key for object-type data points.
     * If given as an array of strings, or a string containing dots or brackets,
     * it will be used as a nested object property path (for details see Lodash docs for _.get).
     * If `null` or `undefined`, the data value will be used as is (identity function/pass-through).
     * @examples 0, 'x', 'x.value.nested.1.thing', 'x[2].also.nested', null, d => Math.sin(d)
     */
    x: PropTypes.oneOfType([
      PropTypes.func,
      CustomPropTypes.allOfType([CustomPropTypes.integer, CustomPropTypes.nonNegative]),
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ]),
    /**
     * The y prop specifies how to access the Y value of each data point.
     * If given as a function, it will be run on each data point, and returned value will be used.
     * If given as an integer, it will be used as an array index for array-type data points.
     * If given as a string, it will be used as a property key for object-type data points.
     * If given as an array of strings, or a string containing dots or brackets,
     * it will be used as a nested object property path (for details see Lodash docs for _.get).
     * If `null` or `undefined`, the data value will be used as is (identity function/pass-through).
     * @examples 0, 'y', 'y.value.nested.1.thing', 'y[2].also.nested', null, d => Math.sin(d)
     */
    y: PropTypes.oneOfType([
      PropTypes.func,
      CustomPropTypes.allOfType([CustomPropTypes.integer, CustomPropTypes.nonNegative]),
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string)
    ])
  };

  static defaultProps = {
    events: {},
    height: 300,
    interpolation: "linear",
    padding: 50,
    samples: 50,
    scale: "linear",
    standalone: true,
    width: 450,
    x: "x",
    y: "y",
    labelComponent: <Label/>,
    markerComponent: <Point/>
  };

  static getDomain = Domain.getDomain.bind(Domain);
  static getData = Data.getData.bind(Data);
  static getStyles = getStyles;

  componentWillMount() {
    this.state = {
      dataState: {},
      markersState: {},
      labelsState: {}
    };
  }

  getDataSegments(dataset) {
    const orderedData = sortBy(dataset, "x");
    const segments = [];
    let segmentStartIndex = 0;
    orderedData.forEach((datum, index) => {
      if (datum.y === null || typeof datum.y === "undefined") {
        segments.push(orderedData.slice(segmentStartIndex, index));
        segmentStartIndex = index + 1;
      }
    });
    segments.push(orderedData.slice(segmentStartIndex, orderedData.length));
    return segments.filter((segment) => {
      return Array.isArray(segment) && segment.length > 0;
    });
  }

  getLabelStyle(style, datum) {
    // match label color to data color if it is not given.
    // use fill instead of stroke for text
    const fill = style.line.stroke;
    const padding = style.labels.padding || 0;
    const labelStyle = defaults({}, style.labels, {fill, padding});
    return Helpers.evaluateStyle(labelStyle, datum);
  }

  renderLine(props, calculatedProps) {
    const {dataSegments, scale, style} = calculatedProps;
    const events = Helpers.getEvents.bind(this)(props.events.data, "data");
    return dataSegments.map((data, index) => {
      const lineProps = {
        key: `line-segment-${index}`,
        interpolation: props.interpolation,
        style: style.data,
        scale,
        index,
        data
      };
      return (
        <LineSegment
          {...lineProps}
          events={Helpers.getPartialEvents(events, index, lineProps)}
        />
      );
    });
  }

  getLabelText(props, datum, index) {
    const propsLabel = Array.isArray(props.labels) ?
      props.labels[index] : Helpers.evaluateProp(props.labels, datum);
    return datum.label || propsLabel;
  }

  getLabelProps(style, datum) {
    return {

    };
  }

  renderMarkersAndLabels(props, calculatedProps) {
    const {dataset, scale, style} = calculatedProps;
    const {markerComponent, labelComponent, events, labels} = props;
    const markersEvents = Helpers.getEvents.bind(this)(events.markers, "markers");
    const labelsEvents = Helpers.getEvents.bind(this)(events.labels, "labels");
    return dataset.map((datum, index) => {
      if (datum.y === null || typeof datum.y === "undefined") {
        return undefined;
      }
      const x = scale.x.call(null, datum.x);
      const y = scale.y.call(null, datum.y);

      const sharedProps = {
        index, datum, x, y
      };
      const markerProps = assign(
        {key: `marker-${index}`, style: Helpers.evaluateStyle(style.markers, datum)},
        sharedProps,
        markerComponent.props,
        this.state.markersState[index]
      );
      const marker = React.cloneElement(markerComponent, assign(
        { events: Helpers.getPartialEvents(markersEvents, index, markerProps) }, markerProps
      ));
      const text = this.getLabelText(props, datum, index);
      if (text || this.props.labels === true) {
        const labelStyle = this.getLabelStyle(style, datum);
        const labelProps = assign(
          {
            key: `label-${index}`,
            dy: labelStyle.padding,
            textAnchor: labelStyle.textAnchor,
            verticalAnchor: labelStyle.verticalAnchor || "end",
            style: labelStyle,
            text
          },
          labelComponent.props,
          sharedProps,
          this.state.labelsState[index]
        )
        const label = React.cloneElement(labelComponent, assign(
            labelProps,
            {events: Helpers.getPartialEvents(labelsEvents, index, labelProps)}
          )
        );
        return (
          <g key={`marker-group-${index}`}>
            {marker}
            {label}
          </g>
        );
      }
      return marker;
    })
  }

  renderSeriesLabel(props, calculatedProps) {
    if (!props.seriesLabel) {
      return undefined;
    }
    const {dataset, dataSegments, scale, style} = calculatedProps;
    const lastSegment = dataSegments[dataSegments.length - 1];
    const lastPoint = Array.isArray(lastSegment) ?
      lastSegment[lastSegment.length - 1] : lastSegment;
    const getBoundEvents = Helpers.getEvents.bind(this);
    return (
      <LineLabel
        key={`line-label`}
        events={getBoundEvents(props.events.labels, "labels")}
        data={dataset}
        x={scale.x.call(this, lastPoint.x)}
        y={scale.y.call(this, lastPoint.y)}
        label={props.seriesLabel}
        style={this.getLabelStyle(style)}
      />
    );
  }

  renderData(props, style) {
    const dataset = Data.getData(props);
    const dataSegments = this.getDataSegments(dataset);
    const range = {
      x: Helpers.getRange(props, "x"),
      y: Helpers.getRange(props, "y")
    };
    const domain = {
      x: Domain.getDomain(props, "x"),
      y: Domain.getDomain(props, "y")
    };
    const scale = {
      x: Scale.getBaseScale(props, "x").domain(domain.x).range(range.x),
      y: Scale.getBaseScale(props, "y").domain(domain.y).range(range.y)
    };
    const calculatedProps = {dataset, dataSegments, scale, style};
    return (
      <g style={style.parent}>
        {this.renderLine(props, calculatedProps)}
        {this.renderMarkersAndLabels(props, calculatedProps)}
        {this.renderSeriesLabel(props, calculatedProps)}
      </g>
    );
  }

  render() {
    // If animating, return a `VictoryAnimation` element that will create
    // a new `VictoryLine` with nearly identical props, except (1) tweened
    // and (2) `animate` set to null so we don't recurse forever.
    if (this.props.animate) {
      // Do less work by having `VictoryAnimation` tween only values that
      // make sense to tween. In the future, allow customization of animated
      // prop whitelist/blacklist?
      // TODO: extract into helper
      const whitelist = [
        "data", "domain", "height", "padding", "samples", "style", "width", "x", "y"
      ];
      return (
        <VictoryTransition animate={this.props.animate} animationWhitelist={whitelist}>
          <VictoryLine {...this.props}/>
        </VictoryTransition>
      );
    }
    const style = getStyles(this.props);
    const group = <g style={style.parent}>{this.renderData(this.props, style)}</g>;
    return this.props.standalone ?
      <svg
        style={style.parent}
        viewBox={`0 0 ${this.props.width} ${this.props.height}`}
        {...this.props.events.parent}
      >
        {group}
      </svg> :
      group;
  }
}
