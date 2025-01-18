const width = 800;
const height = 600;

const nodes = [];
const links = [];

// Transform raw data into nodes and links
Object.keys(rawData).forEach((incomeGroup) => {
  nodes.push({ name: incomeGroup });

  Object.keys(rawData[incomeGroup]).forEach((mentalState) => {
    if (!nodes.find((n) => n.name === mentalState)) {
      nodes.push({ name: mentalState });
    }

    links.push({
      source: incomeGroup,
      target: mentalState,
      value: rawData[incomeGroup][mentalState].males + rawData[incomeGroup][mentalState].females,
    });
  });
});

// Create the Sankey layout
const sankey = d3
  .sankey()
  .nodeId((d) => d.name)
  .nodeWidth(20)
  .nodePadding(15)
  .size([width, height]);

const sankeyData = sankey({
  nodes: nodes.map((d) => Object.assign({}, d)),
  links: links.map((d) => Object.assign({}, d)),
});

// Draw the SVG container
const svg = d3
  .select("#sankey-container")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Draw links
svg
  .append("g")
  .selectAll("path")
  .data(sankeyData.links)
  .join("path")
  .attr("d", d3.sankeyLinkHorizontal())
  .attr("fill", "none")
  .attr("stroke", "#ccc")
  .attr("stroke-width", (d) => Math.max(1, d.width));

// Draw nodes
svg
  .append("g")
  .selectAll("rect")
  .data(sankeyData.nodes)
  .join("rect")
  .attr("x", (d) => d.x0)
  .attr("y", (d) => d.y0)
  .attr("height", (d) => d.y1 - d.y0)
  .attr("width", (d) => d.x1 - d.x0)
  .attr("fill", "steelblue")
  .attr("stroke", "#000")
  .append("title")
  .text((d) => `${d.name}\n${d.value}`);
