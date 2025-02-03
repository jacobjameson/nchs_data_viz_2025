// mortality.js
// A polished animated scatterplot showing suicide mortality rates by age and gender.
// A button ("How does this compare to homicide?") now draws a homicide comparison that
// for each facet connects very small points (like geom_line in ggplot).

const margin = { top: 120, right: 60, bottom: 100, left: 80 };
const facetWidth = 400;
const height = 500;
const padding = 50;
// Increase overall SVG width so that the legend and chart have ample room.
const totalWidth = (facetWidth + margin.left + margin.right) * 2 + padding;

const container = d3.select("#mortality-chart")
  .style("display", "flex")
  .style("justify-content", "center")
  .style("align-items", "center");

const svg = container.append("svg")
  .attr("width", totalWidth)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Main title and subtitle
svg.append("text")
  .attr("class", "chart-title")
  .attr("x", (totalWidth - margin.left - margin.right) / 2)
  .attr("y", -80)
  .attr("text-anchor", "middle")
  .style("font-size", "24px")
  .style("font-weight", "bold")
  .text("Mortality Rates by Gender and Method");

svg.append("text")
  .attr("class", "chart-subtitle")
  .attr("x", (totalWidth - margin.left - margin.right) / 2)
  .attr("y", -50)
  .attr("text-anchor", "middle")
  .style("font-size", "18px")
  .text("Suicide Mortality Rates by Age and Gender");

const policyLabel = svg.append("text")
  .attr("class", "policy-label")
  .attr("x", (totalWidth - margin.left - margin.right) / 2)
  .attr("y", -20)
  .attr("text-anchor", "middle")
  .style("font-size", "16px")
  .style("font-weight", "bold");

// Facet groups for Firearm and Non-Firearm suicides
const firearmPlot = svg.append("g")
  .attr("class", "facet firearm");

const nonFirearmPlot = svg.append("g")
  .attr("class", "facet nonfirearm")
  .attr("transform", `translate(${facetWidth + margin.left + margin.right + padding},0)`);

// Facet titles
firearmPlot.append("text")
  .attr("class", "facet-title")
  .attr("x", facetWidth / 2)
  .attr("y", -10)
  .attr("text-anchor", "middle")
  .style("font-size", "16px")
  .text("Firearm Suicides");

nonFirearmPlot.append("text")
  .attr("class", "facet-title")
  .attr("x", facetWidth / 2)
  .attr("y", -10)
  .attr("text-anchor", "middle")
  .style("font-size", "16px")
  .text("Non-Firearm Suicides");

// Scales
const x = d3.scaleLinear().range([0, facetWidth]);
const y = d3.scaleLinear().range([height, 0]);

// Add axes to each facet
const facets = [firearmPlot, nonFirearmPlot];
facets.forEach(facet => {
  facet.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`);
  facet.append("g")
    .attr("class", "y-axis");

  // Axis labels with larger fonts
  facet.append("text")
    .attr("class", "axis-label")
    .attr("x", facetWidth / 2)
    .attr("y", height + 50)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Age");

  if (facet === firearmPlot) {
    facet.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -60)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Deaths per 100,000");
  }
});

// Legend with extra room
const legendData = [
  { label: "Female", color: "#FF9F1C" },
  { label: "Male", color: "#1e90ff" },
  { label: "Homicide", color: "black", isLine: true }
];

const legend = svg.append("g")
  .attr("class", "legend")
  .attr("transform", `translate(${totalWidth - margin.right - 120}, 0)`);

legendData.forEach((d, i) => {
  const legendRow = legend.append("g")
    .attr("transform", `translate(0, ${i * 25})`);
  if (d.isLine) {
    legendRow.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 20)
      .attr("y2", 0)
      .attr("stroke", d.color)
      .attr("stroke-width", 2);
  } else {
    legendRow.append("circle")
      .attr("r", 5)
      .style("fill", d.color);
  }
  legendRow.append("text")
    .attr("x", 30)
    .attr("y", 5)
    .text(d.label)
    .style("font-size", "14px");
});

// Tooltip for hover details
const tooltip = d3.select("#mortality-chart")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("background-color", "white")
  .style("border", "1px solid #ddd")
  .style("border-radius", "4px")
  .style("padding", "8px")
  .style("pointer-events", "none");

let mortalityInterval; // For cycling state policies

// Load and process data
d3.csv("mortality_data.csv").then(function(data) {
  // Filter suicide data (case-insensitive)
  const suicideData = data.filter(d => d.method && d.method.toLowerCase() === "suicide");
  
  // Filter homicide data for comparison (unsorted initially)
  const homicideDataAll = data.filter(d => d.method && d.method.toLowerCase() === "homicide");
  
  // For homicide data we will sort later per facet.
  
  // Set domains for scales
  x.domain([15, 84]);
  y.domain([0, d3.max(suicideData, d => +d.deaths_100k)]);

  facets.forEach(facet => {
    facet.select(".x-axis")
      .call(d3.axisBottom(x).ticks(8).tickSizeOuter(0))
      .selectAll("text")
      .style("font-size", "14px");
    facet.select(".y-axis")
      .call(d3.axisLeft(y).ticks(6).tickSizeOuter(0))
      .selectAll("text")
      .style("font-size", "14px");
  });

  // Helper: color coding for suicide circles
  const getColor = d => d.gender === "Female" ? "#FF9F1C" : "#1e90ff";

  // Update function for each facet (suicide data)
  function updateFacet(facet, mode, strictness) {
    const filteredData = suicideData.filter(d =>
      d.mode === mode && d.strictness === strictness
    );

    policyLabel.text(`Current State Policy: ${strictness}`);

    const circles = facet.selectAll(".mortality-dot")
      .data(filteredData, d => `${d.gender}-${d.agegroup}`);

    circles.exit()
      .transition()
      .duration(750)
      .style("opacity", 0)
      .remove();

    const circlesEnter = circles.enter()
      .append("circle")
      .attr("class", "mortality-dot")
      .attr("r", 5)
      .attr("cx", d => x(+d.agegroup))
      .attr("cy", d => y(+d.deaths_100k))
      .style("fill", getColor)
      .style("opacity", 0);

    circles.merge(circlesEnter)
      .transition()
      .duration(750)
      .style("opacity", 0.8)
      .attr("cx", d => x(+d.agegroup))
      .attr("cy", d => y(+d.deaths_100k))
      .style("fill", getColor);

    circlesEnter
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("opacity", 1)
          .attr("r", 8);
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);
        tooltip.html(`
          Age: ${d.agegroup}<br/>
          Gender: ${d.gender}<br/>
          State Policy: ${d.strictness}<br/>
          Deaths per 100k: ${(+d.deaths_100k).toFixed(2)}<br/>
          Total Deaths: ${d.deaths}
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .style("opacity", 0.8)
          .attr("r", 5);
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });
  }

  // Define state policy conditions for suicide animation
  const strictnessCategories = ["Permissive", "Strict"];
  let currentStrictnessIndex = 0;

  // Suicide data animation: cycle through policies every 5 seconds.
  function startAnimation() {
    updateFacet(firearmPlot, "Firearm", strictnessCategories[currentStrictnessIndex]);
    updateFacet(nonFirearmPlot, "Non-Firearm", strictnessCategories[currentStrictnessIndex]);
    mortalityInterval = setInterval(() => {
      currentStrictnessIndex = (currentStrictnessIndex + 1) % strictnessCategories.length;
      updateFacet(firearmPlot, "Firearm", strictnessCategories[currentStrictnessIndex]);
      updateFacet(nonFirearmPlot, "Non-Firearm", strictnessCategories[currentStrictnessIndex]);
    }, 5000);
  }

  // Auto-start the suicide animation
  startAnimation();

  // Homicide line: when the "How does this compare to homicide?" button is clicked,
  // draw a homicide line that connects very small points in each facet.
  let homicideShown = false;
  d3.select("#show-homicide").on("click", function() {
    if (!homicideShown) {
      homicideShown = true;
      drawHomicideLine();
    }
  });

  // Function to draw the homicide line for each facet separately.
  function drawHomicideLine() {
    [firearmPlot, nonFirearmPlot].forEach(facet => {
      // Determine the mode for this facet: if the facet has class "firearm", use "Firearm"; otherwise "Non-Firearm"
      let facetMode = facet.classed("firearm") ? "Firearm" : "Non-Firearm";
      // Filter homicide data for this mode and sort by agegroup
      let facetHomicideData = homicideDataAll.filter(d => d.mode === facetMode);
      facetHomicideData.sort((a, b) => +a.agegroup - +b.agegroup);
      
      if (facetHomicideData.length === 0) return; // Skip if no data for this mode

      // Create a line generator for homicide data
      const homicideLine = d3.line()
        .x(d => x(+d.agegroup))
        .y(d => y(+d.deaths_100k))
        .curve(d3.curveMonotoneX);

      const homicideGroup = facet.append("g").attr("class", "homicide-group");

      // Draw very small points at each homicide data record
      homicideGroup.selectAll("circle")
        .data(facetHomicideData)
        .enter()
        .append("circle")
        .attr("cx", d => x(+d.agegroup))
        .attr("cy", d => y(+d.deaths_100k))
        .attr("r", 3)
        .attr("fill", "black")
        .style("opacity", 0)
        .transition()
        .delay((d, i) => i * 50)
        .duration(500)
        .style("opacity", 1);

      // Draw the connecting line (like geom_line)
      homicideGroup.append("path")
        .datum(facetHomicideData)
        .attr("d", homicideLine)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .style("opacity", 0)
        .transition()
        .duration(2000)
        .style("opacity", 1);
    });
  }
})
.catch(function(error) {
  console.error("Error loading mortality data:", error);
});
