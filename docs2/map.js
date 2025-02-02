// map.js

// ==================== SPIKE MAP SETUP ====================

// Set up the dimensions for the spike map.
const width = 960;
const height = 600;

// Append the SVG for the spike map.
const svg = d3.select("#chart")
  .append("svg")
  .attr("class", "spike-map")
  .attr("width", width)
  .attr("height", height);

// Define an arrow marker (used later in the annotation).
const defs = svg.append("defs");
defs.append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 0 10 10")
    .attr("refX", 5)
    .attr("refY", 5)
    .attr("markerWidth", 4)
    .attr("markerHeight", 4)
    .attr("orient", "auto-start-reverse")
  .append("path")
    .attr("d", "M 0 0 L 10 5 L 0 10 z")
    .attr("fill", "black");

// Create an Albers USA projection and corresponding path generator.
const projection = d3.geoAlbersUsa()
  .scale(1000)  // Adjust the scale if needed.
  .translate([width / 2, height / 2]);
const path = d3.geoPath().projection(projection);

// Helper function to generate a spike path (an upward-pointing triangle).
const spike = (length, spikeWidth = 7) => `M${-spikeWidth/2},0 L0,${-length} L${spikeWidth/2},0`;

// File paths (update if necessary).
const csvDataPath = "map_overdose.csv";         // CSV with county overdose data.
const geojsonPath = "counties.geojson"; // GeoJSON for U.S. counties.

// Load CSV data and GeoJSON concurrently.
Promise.all([
  d3.csv(csvDataPath, d => ({
    FIPS: d.FIPS,
    Year: +d.Year,
    State: d.State,
    County: d.County,
    Population: +d.Population,
    deathRate: +d["Model-based Death Rate"]
  })),
  d3.json(geojsonPath)
])
.then(([csvData, countiesGeoJSON]) => {
  
  // Group CSV rows by year and county (using padded FIPS codes).
  const dataByYear = {};
  csvData.forEach(d => {
    if (!dataByYear[d.Year]) dataByYear[d.Year] = {};
    let fips = d.FIPS.toString();
    if (fips.length < 5) fips = fips.padStart(5, '0');
    dataByYear[d.Year][fips] = d;
  });
  
  // Get a sorted array of available years.
  const years = Object.keys(dataByYear).map(Number).sort((a, b) => a - b);
  
  // Compute global min and max death rates.
  const deathRates = csvData.map(d => d.deathRate);
  const minRate = d3.min(deathRates);
  const maxRate = d3.max(deathRates);
  
  // Create a linear scale for spike length (0 to 50 pixels).
  const spikeScale = d3.scaleLinear()
    .domain([minRate, maxRate])
    .range([0, 50]);
  
  // DRAW THE BASE MAP (county boundaries).
  svg.append("g")
    .selectAll("path")
    .data(countiesGeoJSON.features)
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("d", path);
  
  // DRAW THE SPIKES (one per county).
  const spikes = svg.append("g")
    .selectAll("path")
    .data(countiesGeoJSON.features)
    .enter()
    .append("path")
    .attr("class", "spike")
    .attr("transform", d => {
      const center = path.centroid(d);
      return center ? `translate(${center[0]},${center[1]})` : "translate(-100,-100)";
    })
    .attr("d", spike(0))  // Start with zero-length spikes.
    .attr("fill", "red")
    .attr("fill-opacity", 0.5)
    .attr("stroke", "red")
    .attr("stroke-width", 0.5);
  
  // Add tooltips to each spike.
  spikes.append("title")
    .text(d => {
      let fips = d.properties.GEOID;
      if (fips && fips.toString().length < 5) fips = fips.toString().padStart(5, '0');
      const data = dataByYear[years[0]][fips];
      return data ? `${data.County} (${data.State})\nDeath Rate: ${data.deathRate}` : "No data";
    });
  
  // Function to update spike lengths for a given year.
  function updateSpikes(year) {
    d3.select("#year-label").text(year);
    spikes.transition()
      .duration(200)
      .attr("d", d => {
        let fips = d.properties.GEOID;
        if (fips && fips.toString().length < 5) fips = fips.toString().padStart(5, '0');
        const dataForYear = dataByYear[year];
        const rate = dataForYear && dataForYear[fips] ? dataForYear[fips].deathRate : 0;
        return spike(spikeScale(rate));
      });
    spikes.select("title")
      .text(d => {
        let fips = d.properties.GEOID;
        if (fips && fips.toString().length < 5) fips = fips.toString().padStart(5, '0');
        const dataForYear = dataByYear[year];
        if (dataForYear && dataForYear[fips]) {
          const info = dataForYear[fips];
          return `${info.County} (${info.State})\nDeath Rate: ${info.deathRate}`;
        } else {
          return "No data";
        }
      });
  }
  
  // Function to annotate the highest spike in 2021.
  function annotateHighest() {
    const data2021 = dataByYear[2021];
    const highest = Object.values(data2021).reduce((a, b) => (b.deathRate > a.deathRate ? b : a), { deathRate: -Infinity });
    let highestFIPS = highest.FIPS.toString();
    if (highestFIPS.length < 5) highestFIPS = highestFIPS.padStart(5, '0');
    const feature = countiesGeoJSON.features.find(d => {
      let f = d.properties.GEOID.toString();
      return f.padStart(5, '0') === highestFIPS;
    });
    if (!feature) return;
    const center = path.centroid(feature);
    const annotationText = `${highest.County} (${highest.State})\nDeath Rate: ${highest.deathRate}`;
    const offsetX = 50, offsetY = -50;
    svg.append("line")
      .attr("class", "annotation-line")
      .attr("x1", center[0] + offsetX)
      .attr("y1", center[1] + offsetY)
      .attr("x2", center[0])
      .attr("y2", center[1])
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("marker-end", "url(#arrow)");
    svg.append("text")
      .attr("class", "annotation-text")
      .attr("x", center[0] + offsetX + 5)
      .attr("y", center[1] + offsetY)
      .attr("dy", "0.35em")
      .text(annotationText);
  }
  
  // ANIMATE THE SPIKE MAP.
  let index = 0;
  const timer = d3.interval(() => {
    index++;
    if (index >= years.length) {
      timer.stop();
      updateSpikes(years[years.length - 1]);  // Ensure 2021 is rendered.
      setTimeout(annotateHighest, 300);
      // Once the spike map finishes, render the state-level maps.
      renderStateMaps();
    } else {
      updateSpikes(years[index]);
    }
  }, 300);
  
  // ==================== STATE-LEVEL SQUARE BIN MAPS ====================
  
  // --- New Layout Inspired by Squaire ---
  // This layout is an array of [col, row, stateAbbrev]
  const stateLayout = [
    [0,0,"AK"], [10,0,"ME"], [9,1,"VT"], [10,1,"NH"],
    [0,2,"WA"], [1,2,"ID"], [2,2,"MT"], [3,2,"ND"], [4,2,"MN"],
    [6,2,"MI"], [8,2,"NY"], [9,2,"MA"], [10,2,"RI"],
    [0,3,"OR"], [1,3,"UT"], [2,3,"WY"], [3,3,"SD"], [4,3,"IA"],
    [5,3,"WI"], [6,3,"IN"], [7,3,"OH"], [8,3,"PA"], [9,3,"NJ"],
    [10,3,"CT"], [0,4,"CA"], [1,4,"NV"], [2,4,"CO"], [3,4,"NE"],
    [4,4,"MO"], [5,4,"IL"], [6,4,"KY"], [7,4,"WV"], [8,4,"VA"],
    [9,4,"MD"], [10,4,"DE"], [1,5,"AZ"], [2,5,"NM"], [3,5,"KS"],
    [4,5,"AR"], [5,5,"TN"], [6,5,"NC"], [7,5,"SC"], [8,5,"DC"],
    [3,6,"OK"], [4,6,"LA"], [5,6,"MS"], [6,6,"AL"], [7,6,"GA"],
    [0,7,"HI"], [3,7,"TX"], [8,7,"FL"]
  ];
  
  // Mapping of full state names to their two-letter abbreviations.
  const stateAbbrev = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
    "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
    "District of Columbia": "DC", "Florida": "FL", "Georgia": "GA", "Hawaii": "HI",
    "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
    "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME",
    "Maryland": "MD", "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN",
    "Mississippi": "MS", "Missouri": "MO", "Montana": "MT", "Nebraska": "NE",
    "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM",
    "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
    "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI",
    "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX",
    "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA",
    "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY"
  };
  
  // Compute state-level aggregated data for a given year.
  // (Uses population-weighted death rate.)
  function computeStateData(year) {
    const stateAgg = {};
    csvData.filter(d => d.Year === year).forEach(d => {
      if (!stateAgg[d.State]) stateAgg[d.State] = { state: d.State, totalPop: 0, totalDeaths: 0 };
      stateAgg[d.State].totalPop += d.Population;
      stateAgg[d.State].totalDeaths += d.Population * d.deathRate / 100000;
    });
    return Object.values(stateAgg).map(d => {
      d.deathRate = (d.totalDeaths / d.totalPop) * 100000;
      return d;
    });
  }
  
  const stateData2003 = computeStateData(2003);
  const stateData2021 = computeStateData(2021);
  
  // Compute the difference (2021 minus 2003) for states that appear in both.
  const stateData2021Map = new Map(stateData2021.map(d => [d.state, d.deathRate]));
  const stateData2003Map = new Map(stateData2003.map(d => [d.state, d.deathRate]));
  const stateDataDiff = [];
  stateData2003.forEach(d => {
    const rate2021 = stateData2021Map.get(d.state);
    if (rate2021 !== undefined) {
      stateDataDiff.push({ state: d.state, diff: rate2021 - d.deathRate });
    }
  });
  
  // Set up color scales for the state maps.
  const allRates = stateData2003.concat(stateData2021).map(d => d.deathRate);
  const stateMinRate = d3.min(allRates);
  const stateMaxRate = d3.max(allRates);
  const stateColor = d3.scaleSequential(d3.interpolateReds)
      .domain([stateMinRate, stateMaxRate]);
  const diffExtent = d3.extent(stateDataDiff, d => d.diff);
  const maxAbs = Math.max(Math.abs(diffExtent[0]), Math.abs(diffExtent[1]));
  // For the difference map, use a diverging scale (with positive increases in red).
  const diffColor = d3.scaleDiverging()
      .domain([-maxAbs, 0, maxAbs])
      .interpolator(t => d3.interpolateRdBu(1 - t));
  
  // Render a square-bin state map using a custom layout.
  function renderStateSquareMap(containerId, data, valueAccessor, title, colorScale) {
    const cellSize = 50;
    // Compute grid dimensions from stateLayout.
    const maxCol = d3.max(stateLayout, d => d[0]);
    const maxRow = d3.max(stateLayout, d => d[1]);
    const svgWidth = (maxCol + 1) * cellSize;
    const svgHeight = (maxRow + 1) * cellSize;
    
    const container = d3.select(containerId);
    container.html(""); // Clear previous content.
    container.append("h3").text(title);
    
    const svg = container.append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight);
    
    // For each entry in the layout, try to find matching state data.
    stateLayout.forEach(layoutItem => {
      const [col, row, abbrev] = layoutItem;
      // Find the data object whose state (converted to abbreviation) matches.
      const stateData = data.find(d => {
        const abbr = stateAbbrev[d.state] || d.state; // fallback if already abbreviated
        return abbr === abbrev;
      });
      // Compute fill color; if no data, use a default light gray.
      const fill = stateData ? colorScale(valueAccessor(stateData)) : "#f3f3f3";
      
      // Draw the square.
      svg.append("rect")
        .attr("x", col * cellSize + 2)
        .attr("y", row * cellSize + 2)
        .attr("width", cellSize - 4)
        .attr("height", cellSize - 4)
        .attr("fill", fill)
        .attr("stroke", "#fff")
        .append("title")
        .text(stateData ? `${stateData.state}\n${valueAccessor(stateData).toFixed(1)}` : abbrev);
      
      // Add the state abbreviation label in the center.
      svg.append("text")
        .attr("x", col * cellSize + cellSize / 2)
        .attr("y", row * cellSize + cellSize / 2 + 4)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#333")
        .text(abbrev);
    });
  }
  
  // Render the three state maps.
  function renderStateMaps() {
    renderStateSquareMap("#state-map-2003", stateData2003, d => d.deathRate, "2003 Death Rate", stateColor);
    renderStateSquareMap("#state-map-2021", stateData2021, d => d.deathRate, "2021 Death Rate", stateColor);
    renderStateSquareMap("#state-map-diff", stateDataDiff, d => d.diff, "Change (2021 vs 2003)", diffColor);
  }
  
})
.catch(error => {
  console.error("Error loading data:", error);
});
