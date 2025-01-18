// Set up dimensions for the SVG
const width = 800;
const height = 600;

// Debugging: Confirm script is running
console.log("Simple bar chart script loaded");

// Append SVG to the container
const svg = d3
  .select("#sankey-container")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("background-color", "lightgray"); // Background color for visibility

// Define simple static data
const data = [
  { name: "A", value: 30 },
  { name: "B", value: 80 },
  { name: "C", value: 45 },
  { name: "D", value: 60 },
  { name: "E", value: 20 },
];

// Set up scales
const xScale = d3
  .scaleBand()
  .domain(data.map((d) => d.name))
  .range([0, width])
  .padding(0.2);

const yScale = d3.scaleLinear().domain([0, 100]).range([height, 0]);

// Draw bars
svg
  .selectAll("rect")
  .data(data)
  .join("rect")
  .attr("x", (d) => xScale(d.name))
  .attr("y", (d) => yScale(d.value))
  .attr("width", xScale.bandwidth())
  .attr("height", (d) => height - yScale(d.value))
  .attr("fill", "steelblue");

// Add labels
svg
  .selectAll("text")
  .data(data)
  .join("text")
  .attr("x", (d) => xScale(d.name) + xScale.bandwidth() / 2)
  .attr("y", (d) => yScale(d.value) - 5)
  .attr("text-anchor", "middle")
  .text((d) => d.value)
  .attr("fill", "#000");
