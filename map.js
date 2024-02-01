import { stateNames } from './state-names.js';
import { stateDataPrivacyLaws } from './state-data-privacy-laws.js';

// JavaScript: map.js

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

    // Draw the states
    svg.append('g')
        .attr('class', 'states')
        .selectAll('path')
        .data(states) // Use the original states data to draw paths
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', '#ccc')
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .on('mouseover', function(event, d) {
            // Assuming d.id or d.properties.id contains the state ID
            var stateId = d; // Ensure conversion to string
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
          var stateId = d;
          var detailedInfo = "Detailed Info: " + (stateDataPrivacyLaws[stateId] || "No detailed information available.");
          details.html(detailedInfo)
                 .style("display", "block"); // Make sure the details are visible
        
          // Optional: Smooth scroll to the details section
          details.node().scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        
});
