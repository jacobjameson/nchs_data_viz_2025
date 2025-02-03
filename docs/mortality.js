// Mortality visualization comparing suicide and homicide rates
d3.csv("mortality_data.csv", d3.autoType).then(data => {
  // Constants and configuration
  const config = {
    margin: { top: 120, right: 60, bottom: 100, left: 80 },
    facetWidth: 500,
    height: 500,
    padding: 50,
    animationDuration: 750,
    colors: {
      female: "#FF9F1C",
      male: "#1e90ff",
      homicide: "#333333",
      grid: "#e0e0e0"
    },
    fontSize: {
      title: "24px",
      subtitle: "18px",
      label: "18px",
      axis: "16px"
    }
  };

  // Calculate total width for better organization
  const totalWidth = (config.facetWidth + config.margin.left + config.margin.right) * 2 + config.padding;

  // Setup container with flex layout
  const container = d3.select("#mortality-chart")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("align-items", "center");

  // Create main SVG with white background
  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${totalWidth} ${config.height + config.margin.top + config.margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("background", "#ffffff")
    .style("max-width", "100%")
    .style("height", "auto")
    .append("g")
    .attr("transform", `translate(${config.margin.left},${config.margin.top})`);

  // Add titles and labels
  const titles = {
    main: "Mortality Rates by Gender and Method",
    subtitle: "Suicide Mortality Rates by Age and Gender"
  };

  svg.append("text")
    .attr("class", "chart-title")
    .attr("x", (totalWidth - config.margin.left - config.margin.right) / 2)
    .attr("y", -80)
    .attr("text-anchor", "middle")
    .style("font-size", config.fontSize.title)
    .style("font-weight", "bold")
    .text(titles.main);

  svg.append("text")
    .attr("class", "chart-subtitle")
    .attr("x", (totalWidth - config.margin.left - config.margin.right) / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .style("font-size", config.fontSize.subtitle)
    .text(titles.subtitle);

  const policyLabel = svg.append("text")
    .attr("class", "policy-label")
    .attr("x", (totalWidth - config.margin.left - config.margin.right) / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", config.fontSize.label)
    .style("font-weight", "bold");

  // Create facets for Firearm and Non-Firearm
  const facets = {
    firearm: svg.append("g").attr("class", "facet firearm"),
    nonFirearm: svg.append("g")
      .attr("class", "facet nonfirearm")
      .attr("transform", `translate(${config.facetWidth + config.margin.left + config.margin.right + config.padding},0)`)
  };

  // Add facet titles
  Object.entries(facets).forEach(([key, facet]) => {
    facet.append("text")
      .attr("class", "facet-title")
      .attr("x", config.facetWidth / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", config.fontSize.label)
      .text(key === "firearm" ? "Firearm Suicides" : "Non-Firearm Suicides");
  });

  // Setup scales
  const scales = {
    x: d3.scaleLinear().range([0, config.facetWidth]).domain([15, 84]),
    y: d3.scaleLinear().range([config.height, 0])
  };

  // Add axes and grid to each facet
  Object.values(facets).forEach(facet => {
    // Add grid lines
    facet.append("g")
      .attr("class", "grid y-grid")
      .selectAll("line")
      .data(scales.y.ticks(10))
      .join("line")
      .attr("x1", 0)
      .attr("x2", config.facetWidth)
      .attr("y1", d => scales.y(d))
      .attr("y2", d => scales.y(d))
      .attr("stroke", config.colors.grid)
      .attr("stroke-width", 1);

    // Add x-grid
    facet.append("g")
      .attr("class", "grid x-grid")
      .selectAll("line")
      .data(scales.x.ticks(10))
      .join("line")
      .attr("x1", d => scales.x(d))
      .attr("x2", d => scales.x(d))
      .attr("y1", 0)
      .attr("y2", config.height)
      .attr("stroke", config.colors.grid)
      .attr("stroke-width", 1);

    // Add axes
    facet.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${config.height})`)
      .call(d3.axisBottom(scales.x).ticks(8))
      .style("font-size", config.fontSize.axis);

    facet.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(scales.y).ticks(10))
      .style("font-size", config.fontSize.axis);

    // Add axis labels
    facet.append("text")
      .attr("class", "axis-label")
      .attr("x", config.facetWidth / 2)
      .attr("y", config.height + 40)
      .attr("text-anchor", "middle")
      .style("font-size", config.fontSize.label)
      .text("Age (years)");

    if (facet === facets.firearm) {
      facet.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -config.height / 2)
        .attr("y", -60)
        .attr("text-anchor", "middle")
        .style("font-size", config.fontSize.label)
        .text("Suicide Deaths per 100,000 Population");
    }
  });

  // Add tooltip
  const tooltip = d3.select("#mortality-chart")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "rgba(255, 255, 255, 0.95)")
    .style("padding", "12px")
    .style("border", "1px solid #ddd")
    .style("border-radius", "4px")
    .style("font-size", "14px")
    .style("pointer-events", "none")
    .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
    .style("max-width", "200px");

  // Add legend
  const legendData = [
    { label: "Female", color: config.colors.female },
    { label: "Male", color: config.colors.male }
  ];

  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${totalWidth - config.margin.right - 120}, 0)`);

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
      .style("font-size", config.fontSize.label);
  });

  // Process data and update visualization
  const suicideData = data.filter(d => d.method?.toLowerCase() === "suicide");
  const homicideData = data.filter(d => d.method?.toLowerCase() === "homicide");

  // Set y-scale domain based on data
  scales.y.domain([0, d3.max(suicideData, d => +d.deaths_100k)]);

  // Update axes with new domain
  Object.values(facets).forEach(facet => {
    facet.select(".x-axis").call(d3.axisBottom(scales.x).ticks(8));
    facet.select(".y-axis").call(d3.axisLeft(scales.y).ticks(10));
  });

  // Helper functions
  function getColor(d) {
    return d.gender === "Female" ? config.colors.female : config.colors.male;
  }

  // Update visualization with data
  function updateFacet(facet, mode, strictness) {
    const filteredData = suicideData.filter(d =>
      d.mode === mode && d.strictness === strictness
    );

    policyLabel.text(`Current State Policy: ${strictness}`);

    const points = facet.selectAll(".mortality-dot")
      .data(filteredData, d => `${d.gender}-${d.agegroup}`);

    const pointsEnter = points.enter()
      .append("circle")
      .attr("class", "mortality-dot")
      .attr("r", 5)
      .attr("cx", d => scales.x(+d.agegroup))
      .attr("cy", d => scales.y(+d.deaths_100k))
      .style("fill", getColor)
      .style("opacity", 0)
      .style("stroke", "#ffffff")
      .style("stroke-width", 1)
      .on("mouseover", function(event, d) {
        // Highlight the point
        d3.select(this)
          .transition()
          .duration(200)
          .style("opacity", 1)
          .attr("r", 8);

        // Show and position tooltip
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);

        tooltip.html(`
          <strong>${d.gender}</strong><br/>
          <strong>Age:</strong> ${d.agegroup}<br/>
          <strong>Policy:</strong> ${d.strictness}<br/>
          <strong>Deaths per 100k:</strong> ${(+d.deaths_100k).toFixed(1)}<br/>
          <strong>Total Deaths:</strong> ${d.deaths.toLocaleString()}
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        // Reset point size
        d3.select(this)
          .transition()
          .duration(200)
          .style("opacity", 0.8)
          .attr("r", 5);

        // Hide tooltip
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

    points.merge(pointsEnter)
      .transition()
      .duration(config.animationDuration)
      .style("opacity", 0.8)
      .attr("cx", d => scales.x(+d.agegroup))
      .attr("cy", d => scales.y(+d.deaths_100k))
      .style("fill", getColor);

    points.exit()
      .transition()
      .duration(config.animationDuration)
      .style("opacity", 0)
      .remove();
  }

  // Initialize visualization
  const strictnessCategories = ["Permissive", "Strict"];
  let currentIndex = 0;

  function animate() {
    updateFacet(facets.firearm, "Firearm", strictnessCategories[currentIndex]);
    updateFacet(facets.nonFirearm, "Non-Firearm", strictnessCategories[currentIndex]);
    currentIndex = (currentIndex + 1) % strictnessCategories.length;
  }

  // Start animation
  animate();
  const interval = setInterval(animate, 2500);

  // Cleanup
  window.addEventListener('unload', () => clearInterval(interval));
}).catch(error => {
  console.error("Error loading mortality data:", error);
});