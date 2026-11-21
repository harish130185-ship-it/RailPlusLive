import fs from 'fs';

let html = fs.readFileSync('website/index.html', 'utf8');

// Update route-from-input
html = html.replace(
  `<input \n                        id="route-from-input" \n                        type="text" `,
  `<input \n                        id="route-from-input" \n                        class="station-autocomplete" \n                        type="text" `
);

// Update route-to-input
html = html.replace(
  `<input \n                        id="route-to-input" \n                        type="text" `,
  `<input \n                        id="route-to-input" \n                        class="station-autocomplete" \n                        type="text" `
);

// Remove hidden from suggestions divs
html = html.replace(
  `<div id="route-from-suggestions" class="autocomplete-dropdown" hidden></div>`,
  `<div id="route-from-suggestions" class="autocomplete-dropdown"></div>`
);

html = html.replace(
  `<div id="route-to-suggestions" class="autocomplete-dropdown" hidden></div>`,
  `<div id="route-to-suggestions" class="autocomplete-dropdown"></div>`
);

html = html.replace(
  `<div id="seats-from-suggestions" class="autocomplete-dropdown" hidden></div>`,
  `<div id="seats-from-suggestions" class="autocomplete-dropdown"></div>`
);

html = html.replace(
  `<div id="seats-to-suggestions" class="autocomplete-dropdown" hidden></div>`,
  `<div id="seats-to-suggestions" class="autocomplete-dropdown"></div>`
);

html = html.replace(
  `<div id="fare-from-suggestions" class="autocomplete-dropdown" hidden></div>`,
  `<div id="fare-from-suggestions" class="autocomplete-dropdown"></div>`
);

html = html.replace(
  `<div id="fare-to-suggestions" class="autocomplete-dropdown" hidden></div>`,
  `<div id="fare-to-suggestions" class="autocomplete-dropdown"></div>`
);

html = html.replace(
  `<div id="seats-train-suggestions" class="autocomplete-dropdown" hidden></div>`,
  `<div id="seats-train-suggestions" class="autocomplete-dropdown"></div>`
);

html = html.replace(
  `<div id="train-number-suggestions" class="autocomplete-dropdown" hidden></div>`,
  `<div id="train-number-suggestions" class="autocomplete-dropdown"></div>`
);

html = html.replace(
  `<div id="fare-train-suggestions" class="autocomplete-dropdown" hidden></div>`,
  `<div id="fare-train-suggestions" class="autocomplete-dropdown"></div>`
);

fs.writeFileSync('website/index.html', html);
console.log('Successfully updated station inputs in website/index.html');
