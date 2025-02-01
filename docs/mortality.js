// Adjusted dimensions for better spacing
const margin = {top: 100, right: 40, bottom: 80, left: 60};  // Increased top and bottom margins
const facetWidth = 380;
const height = 450;
const padding = 50;

// Total SVG width includes two facets and padding
const totalWidth = (facetWidth + margin.left + margin.right) * 2 + padding;

// Create a container div for centering
const container = d3.select("#mortality-chart")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("align-items", "center");

// Create SVG container with adjusted dimensions
const svg = container.append("svg")
    .attr("width", totalWidth)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Main title with more space above
svg.append("text")
    .attr("class", "chart-title")
    .attr("x", (totalWidth - margin.left - margin.right) / 2)
    .attr("y", -65)  // Moved up
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("Mortality Rates by Gender and Method");

// Subtitle with adjusted spacing
svg.append("text")
    .attr("class", "chart-subtitle")
    .attr("x", (totalWidth - margin.left - margin.right) / 2)
    .attr("y", -40)  // Adjusted spacing
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Suicide Mortality Rates by Age and Gender");

// State policy indicator with adjusted spacing
const policyLabel = svg.append("text")
    .attr("class", "policy-label")
    .attr("x", (totalWidth - margin.left - margin.right) / 2)
    .attr("y", -15)  // More space before charts
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold");

// Create containers for each facet
const firearmPlot = svg.append("g")
    .attr("class", "facet firearm");

const nonFirearmPlot = svg.append("g")
    .attr("class", "facet nonfirearm")
    .attr("transform", `translate(${facetWidth + margin.left + margin.right + padding},0)`);

// Add facet titles
firearmPlot.append("text")
    .attr("class", "facet-title")
    .attr("x", facetWidth / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Firearm Suicides");

nonFirearmPlot.append("text")
    .attr("class", "facet-title")
    .attr("x", facetWidth / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Non-Firearm Suicides");

// Set up scales
const x = d3.scaleLinear()
    .range([0, facetWidth]);

const y = d3.scaleLinear()
    .range([height, 0]);

// Add axes to each facet
const facets = [firearmPlot, nonFirearmPlot];
facets.forEach(facet => {
    facet.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`);

    facet.append("g")
        .attr("class", "y-axis");

    // Add axis labels with more bottom spacing
    facet.append("text")
        .attr("class", "axis-label")
        .attr("x", facetWidth / 2)
        .attr("y", height + 45)  // More space below
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Age");

    if (facet === firearmPlot) {
        facet.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -45)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Deaths per 100,000");
    }
});

// Add legend with adjusted positioning
const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${totalWidth - margin.right - 80}, 0)`);

const legendData = [
    {gender: "Female", color: "#ffd700"},
    {gender: "Male", color: "#1e90ff"}
];

legendData.forEach((d, i) => {
    const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);
        
    legendRow.append("circle")
        .attr("r", 5)
        .style("fill", d.color);
        
    legendRow.append("text")
        .attr("x", 12)
        .attr("y", 4)
        .text(d.gender)
        .style("font-size", "12px");
});

// Add tooltip
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

// Load and process data
d3.csv("mortality_data.csv")
    .then(function(data) {
        // Filter for suicide data only
        const suicideData = data.filter(d => d.method === "Suicide");

        // Set fixed scales based on all suicide data
        x.domain([15, 84]);
        y.domain([0, d3.max(suicideData, d => +d.deaths_100k)]);

        // Update axes for both facets
        facets.forEach(facet => {
            facet.select(".x-axis").call(d3.axisBottom(x));
            facet.select(".y-axis").call(d3.axisLeft(y));
        });

        // Function to get color based on gender
        const getColor = (d) => d.gender === "Female" ? "#ffd700" : "#1e90ff";

        // Update function for each facet
        function updateFacet(facet, mode, strictness) {
            const filteredData = suicideData.filter(d => 
                d.mode === mode && d.strictness === strictness
            );

            // Update policy label
            policyLabel.text(`Current State Policy: ${strictness}`);

            // Data join
            const circles = facet.selectAll(".mortality-dot")
                .data(filteredData, d => `${d.gender}-${d.agegroup}`);

            // Exit
            circles.exit()
                .transition()
                .duration(750)
                .style("opacity", 0)
                .remove();

            // Enter
            const circlesEnter = circles.enter()
                .append("circle")
                .attr("class", "mortality-dot")
                .attr("r", 5)
                .attr("cx", d => x(+d.agegroup))
                .attr("cy", d => y(+d.deaths_100k))
                .style("fill", getColor)
                .style("opacity", 0);

            // Update + Enter
            circles.merge(circlesEnter)
                .transition()
                .duration(750)
                .style("opacity", 0.6)
                .attr("cx", d => x(+d.agegroup))
                .attr("cy", d => y(+d.deaths_100k))
                .style("fill", getColor);

            // Add hover effects
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
                        .style("opacity", 0.6)
                        .attr("r", 5);

                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                });
        }

        // Animation setup
        const strictnessCategories = ["Permissive", "Strict"];
        let currentStrictnessIndex = 0;

        // Initial update
        updateFacet(firearmPlot, "Firearm", strictnessCategories[currentStrictnessIndex]);
        updateFacet(nonFirearmPlot, "Non-Firearm", strictnessCategories[currentStrictnessIndex]);

        // Set up animation interval
        setInterval(() => {
            currentStrictnessIndex = (currentStrictnessIndex + 1) % strictnessCategories.length;
            updateFacet(firearmPlot, "Firearm", strictnessCategories[currentStrictnessIndex]);
            updateFacet(nonFirearmPlot, "Non-Firearm", strictnessCategories[currentStrictnessIndex]);
        }, 5000);  // 5 seconds between transitions
    })
    .catch(function(error) {
        console.log("Error loading data:", error);
    });