// mechanismPointsHighlight.js
// Creates a faceted scatter plot from WISQARS.csv, filtered for Age 13+
// The chart has a white background, grid lines, and a smooth YearGroup animation.

d3.csv("WISQARS.csv", d3.autoType).then(data => {
  // Convert Sex encoding if necessary
  data.forEach(d => {
    if (d.Sex === "1" || d.Sex === 1) d.Sex = "Female";
    else if (d.Sex === "2" || d.Sex === 2) d.Sex = "Male";
  });

  // Filter data for ages 13 and above
  data = data.filter(d => d.Age >= 13);

  // Aggregate data: average CR per Mechanism, YearGroup, Sex, and Age
  const nested = d3.rollup(
    data,
    v => d3.mean(v, d => d.CR),
    d => d.Mechanism,
    d => d.YearGroup,
    d => d.Sex,
    d => d.Age
  );

  // Flatten the nested structure
  let aggregated = [];
  nested.forEach((yearMap, mech) => {
    yearMap.forEach((sexMap, yg) => {
      sexMap.forEach((ageMap, sex) => {
        ageMap.forEach((avgCR, age) => {
          aggregated.push({
            Mechanism: mech,
            YearGroup: yg,
            Sex: sex,
            Age: +age,
            CR: avgCR
          });
        });
      });
    });
  });

  // Get unique values
  const mechanisms = Array.from(new Set(aggregated.map(d => d.Mechanism))).sort();
  const yearGroups = Array.from(new Set(aggregated.map(d => d.YearGroup))).sort();
  const sexes = ["Female", "Male"];

  // Set dimensions
  const facetMargin = { top: 40, right: 40, bottom: 50, left: 70 },
        facetWidth = 300,
        facetHeight = 300;
  const totalWidth = mechanisms.length * (facetWidth + facetMargin.left + facetMargin.right),
        totalHeight = facetHeight + facetMargin.top + facetMargin.bottom;

  // Create SVG container with white background
  const svg = d3.select("#mechanism-chart")
    .append("svg")
      .attr("width", totalWidth)
      .attr("height", totalHeight + 50)
      .style("background", "#fff")  // White background
    .append("g")
      .attr("transform", `translate(0,50)`);

  // Global label for current YearGroup
  const globalLabel = svg.append("text")
      .attr("class", "current-yeargroup")
      .attr("x", totalWidth / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .text("");

  // Y-axis label
  svg.append("text")
      .attr("class", "y-axis-label")
      .attr("x", -totalHeight / 2)
      .attr("y", -50)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text("Deaths per 100k");

  // Scales
  const x = d3.scaleLinear()
    .domain(d3.extent(aggregated, d => d.Age))
    .range([0, facetWidth]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(aggregated, d => d.CR)]).nice()
    .range([facetHeight, 0]);

  // Color scale for sexes
  const colorScale = d3.scaleOrdinal()
    .domain(sexes)
    .range(["#FF9F1C", "#1e90ff"]);  // Yellow for Female, Blue for Male

  // Create one facet per Mechanism
  const facets = svg.selectAll(".facet")
    .data(mechanisms)
    .enter()
    .append("g")
      .attr("class", "facet")
      .attr("transform", (d, i) =>
        `translate(${i * (facetWidth + facetMargin.left + facetMargin.right) + facetMargin.left}, ${facetMargin.top})`
      );

  // Add axes, grid lines, and titles to each facet
  facets.each(function(mech) {
    const g = d3.select(this);

    // X-axis
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${facetHeight})`)
      .call(d3.axisBottom(x).ticks(5));

    // Y-axis with grid lines
    g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".2f")))
      .call(g => g.selectAll(".tick line")
        .attr("x2", facetWidth)
        .attr("stroke", "#ddd")
        .attr("stroke-dasharray", "2,2")
      );

    // Facet title
    g.append("text")
      .attr("class", "facet-title")
      .attr("x", facetWidth / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(mech);
  });

  // Function to update the plot smoothly
  function updateHighlight(currentYG) {
    globalLabel.text(`Years: ${currentYG}`);

    facets.each(function(mech) {
      const g = d3.select(this);
      const facetData = aggregated.filter(d => d.Mechanism === mech && d.YearGroup === currentYG);

      // Bind new data for the current YearGroup
      const points = g.selectAll(".point")
        .data(facetData, d => `${d.Age}-${d.Sex}`);

      // ENTER new points
      points.enter()
        .append("circle")
          .attr("class", d => `point ${d.Sex}`)
          .attr("cx", d => x(d.Age))
          .attr("cy", d => y(d.CR))
          .attr("r", 3)
          .attr("fill", d => colorScale(d.Sex))
          .attr("opacity", 0)
        .merge(points) // Merge with existing points
        .transition()
          .duration(1000) // Smoother transition duration
          .ease(d3.easeCubicInOut)
          .attr("cx", d => x(d.Age))
          .attr("cy", d => y(d.CR))
          .attr("fill", d => colorScale(d.Sex))
          .attr("opacity", 1);

      // EXIT old points
      points.exit()
        .transition()
          .duration(1000) // Smooth fade out
          .ease(d3.easeCubicInOut)
          .attr("opacity", 0)
          .remove();
    });
  }

  // Initial display
  let highlightedYGIndex = 0;
  updateHighlight(yearGroups[highlightedYGIndex]);

  // Rotate highlighted YearGroup every 5 seconds
  setInterval(() => {
    highlightedYGIndex = (highlightedYGIndex + 1) % yearGroups.length;
    updateHighlight(yearGroups[highlightedYGIndex]);
  }, 1500);
});
