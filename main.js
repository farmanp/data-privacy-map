import { renderUnitedStatesMap } from "./us/map.js";
import { US_STATE_MAP_JSON } from "./constants/constants.js";

// Load the TopoJSON data
d3.json(US_STATE_MAP_JSON)
  .then((us) => {
    // Initialize the application with the loaded data
    renderUnitedStatesMap(us);
  })
  .catch((error) => {
    console.error("Error loading US map data:", error);
  });
