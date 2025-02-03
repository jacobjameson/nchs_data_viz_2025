(function() {
  // Set the dimensions of the SVG.
  var width = 800,
      height = 600;

  // Append an SVG element to the #map container.
  var svg = d3.select("#map")
    .append("svg")
      .attr("width", width)
      .attr("height", height);

  // Create a tooltip div.
  var tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "6px")
    .style("background", "rgba(0,0,0,0.6)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // Define a Mercator projection (we’ll adjust it to fit the hex grid).
  var projection = d3.geoMercator();
  var path = d3.geoPath().projection(projection);

  // Define the grade-to-color mapping.
  var gradeColors = {
    "A": "#1a9850",
    "A-": "#66bd63",
    "B+": "#a6d96a",
    "B": "#d9ef8b",
    "B-": "#fee08b",
    "C+": "#fdae61",
    "C": "#f46d43",
    "C-": "#d73027",
    "D+": "#a50026",
    "F": "#b2182b"
  };

  // Mapping from full state names to postal abbreviations.
  var stateToAbbr = {
    "Alabama": "AL",
    "Alaska": "AK",
    "Arizona": "AZ",
    "Arkansas": "AR",
    "California": "CA",
    "Colorado": "CO",
    "Connecticut": "CT",
    "Delaware": "DE",
    "Florida": "FL",
    "Georgia": "GA",
    "Hawaii": "HI",
    "Idaho": "ID",
    "Illinois": "IL",
    "Indiana": "IN",
    "Iowa": "IA",
    "Kansas": "KS",
    "Kentucky": "KY",
    "Louisiana": "LA",
    "Maine": "ME",
    "Maryland": "MD",
    "Massachusetts": "MA",
    "Michigan": "MI",
    "Minnesota": "MN",
    "Mississippi": "MS",
    "Missouri": "MO",
    "Montana": "MT",
    "Nebraska": "NE",
    "Nevada": "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    "Ohio": "OH",
    "Oklahoma": "OK",
    "Oregon": "OR",
    "Pennsylvania": "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    "Tennessee": "TN",
    "Texas": "TX",
    "Utah": "UT",
    "Vermont": "VT",
    "Virginia": "VA",
    "Washington": "WA",
    "West Virginia": "WV",
    "Wisconsin": "WI",
    "Wyoming": "WY"
  };

  // Define the desired ordering for the legend.
  var gradeOrder = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "F"];

  // Load both the CSV data and the hexagonal US states GeoJSON concurrently.
  Promise.all([
    d3.csv("scorecard_2022.csv"),
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/us_states_hexgrid.geojson.json")
  ]).then(function([csvData, geoData]) {
    // Build a lookup object keyed by state postal abbreviation.
    var csvLookup = {};
    csvData.forEach(function(d) {
      var abbr = stateToAbbr[d.State];
      csvLookup[abbr] = d;
    });

    // Adjust the projection to fit the geoData into the SVG.
    projection.fitSize([width, height], geoData);

    // Draw the hexagonal states.
    var states = svg.append("g")
      .selectAll("path")
      .data(geoData.features)
      .enter()
      .append("path")
        .attr("d", path)
        .attr("fill", function(d) {
          var abbr = d.properties.iso3166_2; // e.g., "CA"
          if (csvLookup[abbr]) {
            var grade = csvLookup[abbr].Grade;
            return gradeColors[grade] || "#ccc";
          }
          return "#ccc";
        })
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .on("mouseover", function(event, d) {
          var abbr = d.properties.iso3166_2;
          var dataRow = csvLookup[abbr];
          var htmlText = "";
          if (dataRow) {
            htmlText = "<strong>" + dataRow.State + " (" + abbr + ")</strong><br/>" +
              "Grade: " + dataRow.Grade + "<br/>" +
              "Gun Death Rate per 100k: " + dataRow["Gun Death Rate (per 100K)"];
          } else {
            htmlText = "<strong>" + abbr + "</strong>";
          }
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip.html(htmlText)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
          tooltip.transition().duration(500).style("opacity", 0);
        });

    // Add state labels (postal abbreviations) at the centroid of each hexagon.
    svg.append("g")
      .selectAll("text")
      .data(geoData.features)
      .enter()
      .append("text")
        .attr("x", function(d) { return path.centroid(d)[0]; })
        .attr("y", function(d) { return path.centroid(d)[1]; })
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
        .text(function(d) { return d.properties.iso3166_2; })
        .style("font-size", "15px")
        .style("fill", "white")
        .style("pointer-events", "none");

    // Create a horizontal legend at the bottom.
    var legendRectSize = 20,
        legendSpacing = 5;
    // Estimate width per legend item: rect width + spacing + text width (approx. 30px).
    var legendItemWidth = legendRectSize + legendSpacing + 30;
    var totalLegendWidth = gradeOrder.length * legendItemWidth;
    var legendStartX = (width - totalLegendWidth) / 2;
    var legendY = height - 40; // 40 pixels from the bottom

    var legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", "translate(" + legendStartX + "," + legendY + ")");

    gradeOrder.forEach(function(grade, i) {
      var g = legend.append("g")
        .attr("transform", "translate(" + (i * legendItemWidth) + ",0)");
      g.append("rect")
        .attr("width", legendRectSize)
        .attr("height", legendRectSize)
        .attr("fill", gradeColors[grade]);
      g.append("text")
        .attr("x", legendRectSize + legendSpacing)
        .attr("y", legendRectSize / 2)
        .attr("dy", "0.35em")
        .text(grade)
        .style("font-size", "12px")
        .style("fill", "#000");
    });
  }).catch(function(error) {
    console.error("Error loading data:", error);
  });
})();
