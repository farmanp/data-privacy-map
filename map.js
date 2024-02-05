import { stateNames } from "./state-names.js";
import { stateDataPrivacyLaws } from "./state-data-privacy-laws.js";

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

const maxScore = calculateMaxScore();
const intensity = d3
  .scaleLinear()
  .domain([0, maxScore])
  .range([LIGHT_GREEN, DARK_GREEN]);

d3.json(US_STATE_MAP_JSON).then(renderMap);

function calculateMaxScore() {
  return Object.values(stateDataPrivacyLaws).reduce(
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

function renderMap(us) {
  const states = topojson.feature(us, us.objects.states).features;

  svg
    .append("g")
    .attr("class", "states")
    .selectAll("path")
    .data(states)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("fill", (d) => getStateFillColor(d.id))
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .on("mouseover", handleMouseOver)
    .on("mouseout", () => tooltip.style("opacity", 0))
    .on("click", handleClick);
}

function getStateFillColor(stateId) {
  const stateData = stateDataPrivacyLaws[parseInt(stateId)];
  if (!stateData) return GRAY;

  const score =
    stateData.laws.length * 3 +
    stateData.pendingLegislation.length * 2 +
    stateData.recentSettlements.length;
  return intensity(score);
}

function handleMouseOver(event, d) {
  const stateId = d.toString();
  const stateData = stateDataPrivacyLaws[stateId] || {};
  const {
    laws = [],
    pendingLegislation = [],
    recentSettlements = [],
  } = stateData;
  const tooltipText = `Quick Info: ${
    stateNames[stateId] || "Missing name"
  }<br>Laws in Effect: ${laws.length}<br>Pending Legislation: ${
    pendingLegislation.length
  }<br>Recent Settlements: ${recentSettlements.length}`;

  tooltip
    .html(tooltipText)
    .style("left", `${event.pageX + 10}px`)
    .style("top", `${event.pageY + 10}px`)
    .style("opacity", 1);
}

function handleClick(event, d) {
  const stateId = d.toString();
  const stateInfo = stateDataPrivacyLaws[stateId];
  const detailsHtml = stateInfo
    ? buildDetailsHtml(stateInfo)
    : "<p>No detailed information available for this state.</p>";
  displayDetails(detailsHtml);
}

function buildDetailsHtml({
  name,
  laws,
  pendingLegislation,
  recentSettlements,
}) {
  let html = `<h2>${name}</h2>`;
  html += buildListHtml("Laws in Effect", laws);
  html += buildListHtml("Pending Legislation", pendingLegislation);
  html += buildListHtml("Recent Settlements", recentSettlements);
  html += `<button class="close-btn" id="closeDetails">Close</button>`;
  return html;
}

function buildListHtml(title, items) {
  if (items.length === 0) return "";
  const listItems = items
    .map(
      (item) =>
        `<li><a href="${item.link}" target="_blank">${item.name}</a>: ${item.description}</li>`
    )
    .join("");
  return `<div><strong>${title}:</strong><ul>${listItems}</ul></div>`;
}

function displayDetails(html) {
  details.html(html).style("display", "block");
  details
    .select("#closeDetails")
    .on("click", () => details.style("display", "none"));
  details.node().scrollIntoView({ behavior: "smooth", block: "start" });
}
