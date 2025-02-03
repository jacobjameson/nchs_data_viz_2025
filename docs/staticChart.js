// staticGroupedBar.js
// This script creates a static, faceted grouped bar chart visualization from NHANES.csv.
// For each Age group, it displays two bars (one for Female and one for Male) representing
// the proportion (percentage out of 100) of respondents who answered "Yes" to having seen a mental healthcare professional.

d3.csv("NHANES.csv", d3.autoType).then(data => {
  // If Gender is encoded as numbers, convert them:
  data.forEach(d => {
    if (d.Gender === 1) d.Gender = "Female";
    else if (d.Gender === 2) d.Gender = "Male";
  });

  // Filter data: only include rows where Seen is "Yes"
  const filtered = data.filter(d => d.Seen === "Yes");

  // Get unique Age groups (assume they are in a natural order like "0-20", "21-40", etc.)
  const ageGroups = Array.from(new Set(filtered.map(d => d.Age))).sort();
  ageGroups.pop();
  ageGroups.shift();

  // Define genders
  const genders = ["Female", "Male"];

  // For each Age group, aggregate the Count by Gender.
  // We compute for each Age group the total count (for "Yes" responses) and then the proportion for each gender.
  const ageData = ageGroups.map(age => {
    const subset = filtered.filter(d => d.Age === age);
    const total = d3.sum(subset, d => d.Count);
    // Sum counts for each gender:
    const counts = {};
    genders.forEach(g => {
      counts[g] = d3.sum(subset.filter(d => d.Gender === g), d => d.Count);
    });
    // Compute proportions (as numbers between 0 and 1).
    const proportions = {};
    genders.forEach(g => {
      proportions[g] = total ? counts[g] / total : 0;
    });
    return { Age: age, total, counts, proportions };
  });

  // Set dimensions for each facet.
  const facetWidth = 200,
        facetHeight = 300,
        facetMargin = { top: 40, right: 20, bottom: 40, left: 40 };

  // Create a container SVG for all facets.
  const svg = d3.select("#static-chart")
    .append("svg")
      .attr("width", ageGroups.length * (facetWidth + facetMargin.left + facetMargin.right))
      .attr("height", facetHeight + facetMargin.top + facetMargin.bottom);

  // Create one group per Age group (facets arranged horizontally).
  const facets = svg.selectAll(".facet")
    .data(ageData)
    .enter()
    .append("g")
      .attr("class", "facet")
      .attr("transform", (d, i) => `translate(${i * (facetWidth + facetMargin.left + facetMargin.right) + facetMargin.left},${facetMargin.top})`);

  // For each facet, add a title (the Age label) at the top.
  facets.append("text")
    .attr("class", "facet-title")
    .attr("x", facetWidth / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text(d => `Age: ${d.Age}`);

  // Set up x-scale for each facet (the two gender categories).
  const x = d3.scaleBand()
    .domain(genders)
    .range([0, facetWidth])
    .padding(0.2);

  // Set up y-scale (0 to 1 for percentage).
  const y = d3.scaleLinear()
    .domain([0, 1])
    .range([facetHeight, 0]);

  // Add axes to each facet.
  facets.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${facetHeight})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
      .style("font-size", "12px");

  facets.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".0%")))
    .selectAll("text")
      .style("font-size", "12px");

  // Create the bars.
  facets.selectAll(".bar")
    .data(d => genders.map(g => ({ gender: g, proportion: d.proportions[g] })))
    .enter()
    .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.gender))
      .attr("width", x.bandwidth())
      .attr("y", d => y(d.proportion))
      .attr("height", d => facetHeight - y(d.proportion))
      .attr("fill", d => {
        return d.gender === "Female" ? "#FF9F1C" : "#1e90ff";
      });

  // Add percentage labels on top of each bar.
  facets.selectAll(".bar-label")
    .data(d => genders.map(g => ({ gender: g, proportion: d.proportions[g] })))
    .enter()
    .append("text")
      .attr("class", "bar-label")
      .attr("x", d => x(d.gender) + x.bandwidth() / 2)
      .attr("y", d => y(d.proportion) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#000")
      .text(d => d3.format(".0%")(d.proportion));
  
}).catch(error => console.error("Error loading NHANES.csv:", error));
