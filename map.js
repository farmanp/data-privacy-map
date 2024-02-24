// Assuming stateNames and staticStateDataPrivacyLaws are available, e.g., through imports or defined in this script
import { stateNames } from "./state-names.js";
import { stateDataPrivacyLaws } from "./state-data-privacy-laws.js";
let dynamicStateDataPrivacyLaws = {};

// The URL to your API endpoint
const API_URL = "http://localhost:3000/api/state-laws";

const US_STATE_MAP_JSON =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const width = 975,
  height = 610;
const LIGHT_GREEN = "#90ee90",
  DARK_GREEN = "#008000",
  GRAY = "#ccc";

const svg = d3
  .select("#map")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`);
const projection = d3
  .geoAlbersUsa()
  .fitSize([width, height], { type: "Sphere" });
const path = d3.geoPath().projection(projection);

const tooltip = d3.select("#tooltip");
const details = d3.select("#details");

// Async function to fetch and process state laws data
async function fetchStateLaws() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    dynamicStateDataPrivacyLaws = processFetchedData(data);
    console.log("Fetched dynamic data successfully.");
    return dynamicStateDataPrivacyLaws;
  } catch (error) {
    console.error("Error fetching state laws:", error);
    // Fallback to static data if fetch fails
    console.log("Falling back to static data.");
    return stateDataPrivacyLaws; // Assume this is your static data
  }
}

// Function to process fetched data into the required format
function processFetchedData(fetchedData) {
  return fetchedData.reduce(
    (acc, { state_name, law_name, law_description, law_link }) => {
      if (!acc[state_name]) {
        acc[state_name] = {
          name: state_name,
          laws: [],
          pendingLegislation: [],
          recentSettlements: [],
        };
      }
      acc[state_name].laws.push({
        name: law_name,
        description: law_description,
        link: law_link,
      });
      return acc;
    },
    {}
  );
}

// Function to calculate max score based on dynamic or static data
function calculateMaxScore(dataPrivacyLaws) {
  return Object.values(dataPrivacyLaws).reduce(
    (max, { laws, pendingLegislation, recentSettlements }) => {
      const score =
        laws.length * 3 +
        pendingLegislation.length * 2 +
        recentSettlements.length;
      return Math.max(max, score);
    },
    0
  );
}

// Function to render map with dynamic or static data
function renderMap(us, dataPrivacyLaws) {
  const maxScore = calculateMaxScore(dataPrivacyLaws);
  const intensity = d3
    .scaleLinear()
    .domain([0, maxScore])
    .range([LIGHT_GREEN, DARK_GREEN]);

  const states = topojson.feature(us, us.objects.states).features;
  svg
    .append("g")
    .attr("class", "states")
    .selectAll("path")
    .data(states)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", (d) => {
      const stateData = dataPrivacyLaws[d.properties.name];
      if (!stateData) return GRAY;
      const score =
        stateData.laws.length * 3 +
        stateData.pendingLegislation.length * 2 +
        stateData.recentSettlements.length;
      return intensity(score);
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .on("mouseover", handleMouseOver)
    .on("mouseout", () => tooltip.style("opacity", 0))
    .on("click", handleClick);
}

// Call fetchStateLaws then render the map with dynamic or fallback data
fetchStateLaws().then((dynamicOrFallbackData) => {
  d3.json(US_STATE_MAP_JSON).then((us) => {
    renderMap(us, dynamicOrFallbackData);
  });
});

// Functions handleMouseOver, handleClick, buildDetailsHtml, etc., remain unchanged

function getStateFillColor(stateId, stateData) {
  const stateDataEntry = stateData[parseInt(stateId)] || stateData[stateId]; // Adjust based on your ID mapping
  if (!stateDataEntry) return GRAY;

  const score =
    (stateDataEntry.laws ? stateDataEntry.laws.length * 3 : 0) +
    (stateDataEntry.pendingLegislation
      ? stateDataEntry.pendingLegislation.length * 2
      : 0) +
    (stateDataEntry.recentSettlements
      ? stateDataEntry.recentSettlements.length
      : 0);
  return intensity(score);
}

function handleMouseOver(event, d, stateData) {
  const stateId = d.id.toString(); // Adjust if necessary to match IDs with your data structure
  const stateDataEntry = stateData[stateId] || {};
  const {
    laws = [],
    pendingLegislation = [],
    recentSettlements = [],
  } = stateDataEntry;
  const tooltipText = `Quick Info: ${stateNames[stateId] || "Missing name"}
<br>Laws in Effect: ${laws.length}
<br>Pending Legislation: ${pendingLegislation.length}
<br>Recent Settlements: ${recentSettlements.length}`;

  tooltip
    .html(tooltipText)
    .style("left", `${event.pageX + 10}px`)
    .style("top", `${event.pageY + 10}px`)
    .style("opacity", 1);
}

function handleClick(event, d, stateData) {
  // Ensure the stateId matches your data identification scheme
  const stateId = d.id.toString(); // Adjust if necessary to match IDs with your data structure
  const stateInfo = stateData[stateId];

  const detailsHtml = stateInfo
    ? buildDetailsHtml(stateInfo)
    : "<p>No detailed information available for this state.</p>";
  displayDetails(detailsHtml);
}

function buildDetailsHtml({
  name,
  laws = [],
  pendingLegislation = [],
  recentSettlements = [],
}) {
  let html = `<h2>${name}</h2>`;
  if (laws.length > 0) html += buildListHtml("Laws in Effect", laws);
  if (pendingLegislation.length > 0)
    html += buildListHtml("Pending Legislation", pendingLegislation);
  if (recentSettlements.length > 0)
    html += buildListHtml("Recent Settlements", recentSettlements);
  html += `<button class="close-btn" id="closeDetails">Close</button>`;
  return html;
}

// Adjusted to handle an empty or non-existent items array gracefully
function buildListHtml(title, items) {
  if (!items || items.length === 0) return ""; // Check if items exist and are not empty
  const listItems = items
    .map(
      (item) =>
        `<li><a href="${item.link}" target="_blank">${item.name}</a>: ${item.description}</li>`
    )
    .join("");
  return `<div><strong>${title}:</strong><ul>${listItems}</ul></div>`;
}
