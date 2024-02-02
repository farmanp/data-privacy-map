import { stateNames } from './state-names.js';
import { stateDataPrivacyLaws } from './state-data-privacy-laws.js';

// Width and height for the SVG
const width = 975;
const height = 610;
const LIGHT_GREEN = '#90ee90';
const GRAY = '#ccc';

// Define SVG element
const svg = d3.select('#map').append('svg')
  .attr('viewBox', `0 0 ${width} ${height}`);

// Define projection and path generator
const projection = d3.geoAlbersUsa().fitSize([width, height], { type: "Sphere" });
const path = d3.geoPath().projection(projection);

const tooltip = d3.select("#tooltip");
const details = d3.select("#details");

d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json').then(us => {
  const states = topojson.feature(us, us.objects.states).features;

  svg.append('g')
    .attr('class', 'states')
    .selectAll('path')
    .data(states)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('fill', d => {
      const stateId = parseInt(d.id, 10);           
      return stateDataPrivacyLaws[stateId] ? LIGHT_GREEN : GRAY; // Color states with laws in light green
    })
    .attr('stroke', '#fff')
    .attr('stroke-width', 0.5)
    .on('mouseover', (event, d) => {
      // convert d to string    
      const stateId = d.toString();
      const tooltipText = `Quick Info: ${stateNames[stateId] || "Missing name"}`;
      
      tooltip
        .text(tooltipText)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY + 10}px`)
        .style("opacity", 1);
    })
    .on('mouseout', () => {
      tooltip.style("opacity", 0);
    })
    .on('click', handleClick);
});


const buildDetailsHtml = stateInfo => {
  let detailsHtml = `<h2>${stateInfo.name}</h2>`;
  detailsHtml += buildListHtml("Laws in Effect", stateInfo.laws);
  detailsHtml += buildListHtml("Pending Legislation", stateInfo.pendingLegislation);
  detailsHtml += buildListHtml("Recent Settlements", stateInfo.recentSettlements);
  detailsHtml += `<button class="close-btn" id="closeDetails">Close</button>`;
  return detailsHtml;
}

const buildListHtml = (title, items) => {
  if (items.length === 0) return '';
  let html = `<div><strong>${title}:</strong><ul>`;
  items.forEach(item => {
    html += `<li>${item}</li>`;
  });
  html += `</ul></div>`;
  return html;
}

const displayDetails = detailsHtml => {
  details.html(detailsHtml).style("display", "block");
  details.select("#closeDetails").on("click", () => details.style("display", "none"));
  details.node().scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const handleClick = (event, d) => {
  const stateId = d.toString();
  const stateInfo = stateDataPrivacyLaws[stateId];

  if (!stateInfo) {
    displayDetails('<p>No detailed information available for this state.</p>');
    return;
  }

  const detailsHtml = buildDetailsHtml(stateInfo);
  displayDetails(detailsHtml);
}