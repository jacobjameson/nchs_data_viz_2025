// dynamicGraph.js
// This script creates a dynamic stacked bar chart visualization from NHANES.csv.
// For each combination of Age group and PHQ_c category, it displays, by “Seen” response,
// the gender breakdown (Female and Male) as a stacked bar chart.
// The visualization automatically cycles through each combination with smooth transitions.

d3.csv("NHANES.csv", d3.autoType).then(data => {
  // Convert Gender from numeric codes to strings ("Female" if 1, "Male" if 2)
  data.forEach(d => {
    if (d.Gender === 1) {
      d.Gender = "Female";
    } else if (d.Gender === 2) {
      d.Gender = "Male";
    }
  });

  // Get unique Age groups and PHQ_c categories (assume they are exactly as in the CSV)
  const ageGroups = Array.from(new Set(data.map(d => d.Age))).sort();
  const phqOrder = [
    "Minimal (0-4)",
    "Mild (5-9)",
    "Moderate (10-14)",
    "Moderately Severe (15-19)",
    "Severe (20-27)"
  ];
  
  // (Optionally, filter out rows if needed—but here we use all data.)
  
  // Set dimensions and margins for the visualization.
  const margin = { top: 60, right: 20, bottom: 60, left: 60 },
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
  
  // Append an SVG to the container #dynamic-chart.
  const svg = d3.select("#dynamic-chart")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // Define the x-axis: "Seen" responses.
  // Here, we assume the possible values are "No" and "Yes".
  const seenCategories = ["No", "Yes"];
  const x = d3.scaleBand()
    .domain(seenCategories)
    .range([0, width])
    .padding(0.2);
  
  // y-scale for the proportion (0-100%)
  const y = d3.scaleLinear()
    .domain([0, 1])
    .range([height, 0]);
  
  // Colors for genders: yellow for Female and blue for Male.
  const color = d3.scaleOrdinal()
    .domain(["Female", "Male"])
    .range(["#ffd700", "#1e90ff"]);
  
  // Add x-axis and y-axis to the SVG.
  svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));
  
  svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).tickFormat(d3.format(".0%")));
  
  // Create a group for the bars.
  const barsGroup = svg.append("g")
      .attr("class", "bars-group");
  
  // Add a title text that will update with the current Age group and PHQ_c.
  const title = svg.append("text")
      .attr("class", "vis-title")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "bold");
  
  // Function to update the chart for a given Age group and PHQ_c category.
  function updateVis(currentAge, currentPHQ) {
    // Filter data for the selected Age group and PHQ_c.
    const subset = data.filter(d => d.Age === currentAge && d.PHQ_c === currentPHQ);
    
    // Group data by "Seen" and then by Gender.
    const grouped = d3.rollups(
      subset,
      v => {
        const total = d3.sum(v, d => d.Count);
        const byGender = d3.rollup(v, vv => d3.sum(vv, d => d.Count), d => d.Gender);
        // Compute proportions for each gender in this Seen group.
        const proportions = {};
        byGender.forEach((count, gender) => {
          proportions[gender] = total ? count / total : 0;
        });
        return { total, proportions };
      },
      d => d.Seen
    );
    // Convert to a map keyed by Seen category.
    const dataMap = new Map(grouped);
    
    // For each seen category, build a data array for stacking.
    // For each seen value, we want an object: { Seen: value, Female: proportion, Male: proportion }
    const stackData = seenCategories.map(seen => {
      const entry = dataMap.get(seen) || { total: 0, proportions: {} };
      return {
        Seen: seen,
        Female: entry.proportions["Female"] || 0,
        Male: entry.proportions["Male"] || 0
      };
    });
    
    // Use d3.stack to stack the data by gender.
    const series = d3.stack()
      .keys(["Female", "Male"])
      (stackData);
    
    // Update the title.
    title.text(`Age: ${currentAge} | PHQ‑9: ${currentPHQ}`);
    
    // Bind the series data.
    const groups = barsGroup.selectAll(".bar-group")
      .data(series, d => d.key);
    
    groups.enter()
      .append("g")
        .attr("class", "bar-group")
        .attr("fill", d => color(d.key))
      .merge(groups);
    
    groups.exit().remove();
    
    // For each series, bind rectangles to the seen categories.
    series.forEach((d, i) => {
      const rects = barsGroup.selectAll(`.bar-${d.key}`)
        .data(d, d => d.data.Seen);
      
      rects.enter()
        .append("rect")
          .attr("class", `bar-${d.key}`)
          .attr("x", d => x(d.data.Seen))
          .attr("width", x.bandwidth())
          .attr("y", height)
          .attr("height", 0)
        .merge(rects)
        .transition()
        .duration(1000)
          .attr("x", d => x(d.data.Seen))
          .attr("width", x.bandwidth())
          .attr("y", d => y(d[1]))
          .attr("height", d => y(d[0]) - y(d[1]));
      
      rects.exit().remove();
    });
    
    // Add labels for percentages on top of each bar.
    const labels = barsGroup.selectAll(".bar-label")
      .data(stackData, d => d.Seen);
    
    labels.enter()
      .append("text")
        .attr("class", "bar-label")
        .attr("x", d => x(d.Seen) + x.bandwidth() / 2)
        .attr("y", d => y(d.Female + d.Male) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#000")
        .text(d => {
          const totalProp = d.Female + d.Male;
          return d3.format(".0%")(totalProp);
        })
      .merge(labels)
      .transition()
      .duration(1000)
        .attr("x", d => x(d.Seen) + x.bandwidth() / 2)
        .attr("y", d => y(d.Female + d.Male) - 5)
        .text(d => {
          const totalProp = d.Female + d.Male;
          return d3.format(".0%")(totalProp);
        });
    
    labels.exit().remove();
  }
  
  // Auto-cycle through each Age group and PHQ_c combination.
  let currentAgeIndex = 0;
  let currentPHQIndex = 0;
  function cycle() {
    const currentAge = ageGroups[currentAgeIndex];
    const currentPHQ = phqOrder[currentPHQIndex];
    updateVis(currentAge, currentPHQ);
    
    // Update indices.
    currentPHQIndex++;
    if (currentPHQIndex >= phqOrder.length) {
      currentPHQIndex = 0;
      currentAgeIndex++;
      if (currentAgeIndex >= ageGroups.length) currentAgeIndex = 0;
    }
  }
  
  // Start auto-cycling every 5 seconds.
  cycle();
  setInterval(cycle, 5000);
  
}).catch(error => console.error("Error loading NHANES.csv:", error));
