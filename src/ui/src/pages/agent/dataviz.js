import React from 'react'
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from '@nivo/line'

export const Line = (props) => (
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
)

export const Pie = (props) => (
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
)


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
  