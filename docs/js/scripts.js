// Basic mortality visualization
const margin = {top: 50, right: 50, bottom: 50, left: 70};
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create SVG
const mortalityPlot = d3.select("#mortality-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Load and display data
d3.csv("../data/mortality_data.csv")
    .then(function(data) {
        console.log("Loading data...");
        
        // Filter for Firearm data only
        const firearmData = data.filter(d => d.mode === "Firearm");
        
        // Create scales
        const x = d3.scaleLinear()
            .domain([15, 84])
            .range([0, width]);
            
        const y = d3.scaleLinear()
            .domain([0, d3.max(firearmData, d => +d.deaths_100k)])
            .range([height, 0]);

        // Add X axis
        mortalityPlot.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        // Add Y axis
        mortalityPlot.append("g")
            .call(d3.axisLeft(y));

        // Add dots
        mortalityPlot.selectAll("circle")
            .data(firearmData)
            .enter()
            .append("circle")
            .attr("cx", d => x(+d.agegroup))
            .attr("cy", d => y(+d.deaths_100k))
            .attr("r", 5)
            .style("fill", d => d.gender === "Female" ? "#ff6b6b" : "#4ecdc4")
            .style("opacity", 0.6);

        // Add X axis label
        mortalityPlot.append("text")
            .attr("text-anchor", "middle")
            .attr("x", width/2)
            .attr("y", height + 40)
            .text("Age");

        // Add Y axis label
        mortalityPlot.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", -40)
            .attr("x", -height/2)
            .text("Deaths per 100,000");
    })
    .catch(function(error) {
        console.log("Error loading data:", error);
    });