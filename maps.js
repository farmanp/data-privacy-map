import { stateNames } from './state-names.js';
import { stateDataPrivacyLaws } from './state-data-privacy-laws.js';

// Width and height for the SVG
var width = 975;
var height = 610;

// Define SVG element
var svg = d3.select('#map').append('svg')
  .attr('viewBox', `0 0 ${width} ${height}`);

// Define projection and path generator
var projection = d3.geoAlbersUsa().fitSize([width, height], {type: "Sphere"});
var path = d3.geoPath().projection(projection);

var tooltip = d3.select("#tooltip");
var details = d3.select("#details");

d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json').then(function(us) {
  var states = topojson.feature(us, us.objects.states).features;

  svg.append('g')
    .attr('class', 'states')
    .selectAll('path')
    .data(states)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('fill', function(d) {                
      var stateId = parseInt(d, 10);
      return stateDataPrivacyLaws[stateId] ? '#90ee90' : '#ccc'; // Color states with laws in light green
    })
    .attr('stroke', '#fff')
    .attr('stroke-width', 0.5)
    .on('mouseover', function(event, d) {      
      var stateId = parseInt(d, 10);;
      console.log(stateId, stateNames[stateId])
      var tooltipText = "Quick Info: " + (stateNames[stateId] || "Missing name");
      
      tooltip
        .text(tooltipText)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px")
        .style("opacity", 1);
    })
    .on('mouseout', function(event, d) {
      tooltip.style("opacity", 0);
    })
    .on('click', function(event, d) {
      var stateId = parseInt(d, 10);
      var stateInfo = stateDataPrivacyLaws[stateId];
  
      // If there's no info for the state, display a default message
      if (!stateInfo) {
        details.html('<p>No detailed information available for this state.</p>')
          .style("display", "block");
        return;
      }
  
      // Build the details HTML content
      var detailsHtml = `<h2>${stateInfo.name}</h2>`;
  
      // Add laws in effect
      if (stateInfo.laws.length > 0) {
        detailsHtml += `<div><strong>Laws in Effect:</strong><ul>`;
        stateInfo.laws.forEach(law => {
          detailsHtml += `<li>${law}</li>`;
        });
        detailsHtml += `</ul></div>`;
      }
  
      // Add pending legislation
      if (stateInfo.pendingLegislation.length > 0) {
        detailsHtml += `<div><strong>Pending Legislation:</strong><ul>`;
        stateInfo.pendingLegislation.forEach(bill => {
          detailsHtml += `<li>${bill}</li>`;
        });
        detailsHtml += `</ul></div>`;
      }
  
      // Add recent settlements
      if (stateInfo.recentSettlements.length > 0) {
        detailsHtml += `<div><strong>Recent Settlements:</strong><ul>`;
        stateInfo.recentSettlements.forEach(settlement => {
          detailsHtml += `<li>${settlement}</li>`;
        });
        detailsHtml += `</ul></div>`;
      }
  
      // Add a close button to hide the details section
      detailsHtml += `<button class="close-btn" id="closeDetails">Close</button>`;
  
      // Set the inner HTML of the details div
      details.html(detailsHtml).style("display", "block");
      details.select("#closeDetails").on("click", function() {
      details.style("display", "none");    
      });
  
      // Scroll to the details section
      details.node().scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});