// mechanismPointsHighlight.js
// Creates a faceted scatter plot from WISQARS.csv, filtered for Age 13+
// The chart has a white background, grid lines, and a smooth YearGroup animation.

d3.csv("WISQARS.csv", d3.autoType).then(data => {
  // Convert Sex encoding if necessary
  data.forEach(d => {
    if (d.Sex === "1" || d.Sex === 1) d.Sex = "Female";
    else if (d.Sex === "2" || d.Sex === 2) d.Sex = "Male";
  });
 // Filter for ages 13 and above
  data = data.filter(d => d.Age >= 13);
  console.log("Filtered data length:", data.length);

  // Aggregate data using d3.rollup for more reliable aggregation
  const nested = d3.rollup(
    data,
    v => d3.mean(v, d => d.CR),
    d => d.Mechanism,
    d => d.YearGroup,
    d => d.Sex,
    d => d.Age
  );

  // Convert nested Map to array format
  let aggregated = [];
  for (let [mech, yearMap] of nested) {
    for (let [year, sexMap] of yearMap) {
      for (let [sex, ageMap] of sexMap) {
        for (let [age, cr] of ageMap) {
          aggregated.push({
            Mechanism: mech,
            YearGroup: year,
            Sex: sex,
            Age: +age,
            CR: cr
          });
        }
      }
    }
  }

  console.log("Aggregated data sample:", aggregated.slice(0, 5));
  console.log("Unique sexes in aggregated data:", [...new Set(aggregated.map(d => d.Sex))]);

  // Get unique values
  const mechanisms = [...new Set(aggregated.map(d => d.Mechanism))].sort();
  const yearGroups = [...new Set(aggregated.map(d => d.YearGroup))].sort();
  const sexes = ["Female", "Male"];

  console.log("Mechanisms:", mechanisms);
  console.log("Year Groups:", yearGroups);
  console.log("Sexes:", sexes);

  // Enhanced dimensions for better visibility
  const facetMargin = { top: 50, right: 50, bottom: 60, left: 80 };
  const facetWidth = 300;
  const facetHeight = 300;
  const totalWidth = mechanisms.length * (facetWidth + facetMargin.left + facetMargin.right);
  const totalHeight = facetHeight + facetMargin.top + facetMargin.bottom;

  // Create SVG with responsive sizing
  const svg = d3.select("#mechanism-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${totalWidth} ${totalHeight + 50}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("background", "#ffffff")
    .style("max-width", "100%")
    .style("height", "auto")
    .append("g")
    .attr("transform", `translate(0,50)`);

  // Add legend
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${totalWidth - 150}, -30)`);

  sexes.forEach((sex, i) => {
    const legendItem = legend.append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    legendItem.append("circle")
      .attr("r", 4)
      .attr("fill", sex === "Female" ? "#FF9F1C" : "#1e90ff")
      .attr("opacity", 0.8);

    legendItem.append("text")
      .attr("x", 10)
      .attr("y", 4)
      .text(sex)
      .style("font-size", "12px")
      .style("font-family", "sans-serif");
  });

  // Enhanced global label
  const globalLabel = svg.append("text")
    .attr("class", "current-yeargroup")
    .attr("x", totalWidth / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .style("font-family", "sans-serif");

  // Enhanced Y-axis label
  svg.append("text")
    .attr("class", "y-axis-label")
    .attr("x", -totalHeight / 2)
    .attr("y", -60)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-family", "sans-serif")
    .text("Suicide Deaths per 100,000 Population");

  // Enhanced scales
  const x = d3.scaleLinear()
    .domain(d3.extent(aggregated, d => d.Age))
    .nice()
    .range([0, facetWidth]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(aggregated, d => d.CR) * 1.1]).nice()
    .range([facetHeight, 0]);

  // Scientific color scheme
  const colorScale = d3.scaleOrdinal()
    .domain(sexes)
    .range(["#FF9F1C", "#1e90ff"]);

  // Create facets with enhanced styling
  const facets = svg.selectAll(".facet")
    .data(mechanisms)
    .join("g")
    .attr("class", "facet")
    .attr("transform", (d, i) => 
      `translate(${i * (facetWidth + facetMargin.left + facetMargin.right) + facetMargin.left},${facetMargin.top})`
    );

  // Add enhanced axes and grid to each facet
  facets.each(function(mech) {
    const g = d3.select(this);
    
    // Vertical grid (for y-axis)
    g.append("g")
      .attr("class", "grid y-grid")
      .selectAll("line")
      .data(y.ticks(10))
      .join("line")
      .attr("x1", 0)
      .attr("x2", facetWidth)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1);

    // Horizontal grid (for x-axis)
    g.append("g")
      .attr("class", "grid x-grid")
      .selectAll("line")
      .data(x.ticks(10))
      .join("line")
      .attr("x1", d => x(d))
      .attr("x2", d => x(d))
      .attr("y1", 0)
      .attr("y2", facetHeight)
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1);

    // Enhanced X-axis with label
    const xAxis = g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${facetHeight})`)
      .call(d3.axisBottom(x)
        .ticks(10)
        .tickSize(6)
      )
      .style("font-size", "12px")
      .style("font-family", "sans-serif");

    // Add X-axis label
    g.append("text")
      .attr("class", "x-axis-label")
      .attr("text-anchor", "middle")
      .attr("x", facetWidth / 2)
      .attr("y", facetHeight + 40)
      .style("font-size", "14px")
      .style("font-family", "sans-serif")
      .text("Age (years)");

    // Enhanced Y-axis with more prominent label
    const yAxis = g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y)
        .ticks(10)
        .tickSize(6)
        .tickFormat(d3.format("d"))
      )
      .style("font-size", "12px")
      .style("font-family", "sans-serif");

    // Add Y-axis label if this is the leftmost facet
    if (mech === mechanisms[0]) {
      g.append("text")
        .attr("class", "y-axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -facetHeight / 2)
        .attr("y", -60)
        .style("font-size", "14px")
        .style("font-family", "sans-serif")
        .text("Suicide Deaths per 100,000 Population");
    }

    // Enhanced facet title
    g.append("text")
      .attr("class", "facet-title")
      .attr("x", facetWidth / 2)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .style("font-family", "sans-serif")
      .text(mech);
  });

  // Enhanced update function with debugging
  function updateHighlight(currentYG) {
    globalLabel.text(`${currentYG}`);

    facets.each(function(mech) {
      const g = d3.select(this);
      const facetData = aggregated.filter(d => 
        d.Mechanism === mech && d.YearGroup === currentYG
      );

      console.log(`Data for ${mech}, ${currentYG}:`, facetData);

      // Enhanced points with smooth transitions
      const points = g.selectAll(".point")
        .data(facetData, d => `${d.Age}-${d.Sex}`);

      // ENTER new points
      const pointsEnter = points.enter()
        .append("circle")
        .attr("class", d => `point ${d.Sex}`)
        .attr("cx", d => x(d.Age))
        .attr("cy", d => y(d.CR))
        .attr("r", 4)
        .attr("fill", d => colorScale(d.Sex))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .attr("opacity", 0);

      // UPDATE + ENTER
      points.merge(pointsEnter)
        .transition()
        .duration(1000)
        .ease(d3.easeCubicInOut)
        .attr("cx", d => x(d.Age))
        .attr("cy", d => y(d.CR))
        .attr("fill", d => colorScale(d.Sex))
        .attr("opacity", 0.8);

      // EXIT
      points.exit()
        .transition()
        .duration(1000)
        .ease(d3.easeCubicInOut)
        .attr("opacity", 0)
        .remove();
    });
  }

  // Initialize and start animation
  let highlightedYGIndex = 0;
  updateHighlight(yearGroups[highlightedYGIndex]);

  // Smoother animation interval
  const interval = setInterval(() => {
    highlightedYGIndex = (highlightedYGIndex + 1) % yearGroups.length;
    updateHighlight(yearGroups[highlightedYGIndex]);
  }, 2000);

  // Cleanup on page unload
  window.addEventListener('unload', () => clearInterval(interval));
});