import fs from 'fs';

const css = fs.readFileSync('website/styles.css', 'utf8');

function findCss(sel) {
  const idx = css.indexOf(sel);
  if (idx !== -1) {
    console.log(`=== CSS for ${sel} ===`);
    console.log(css.slice(idx, idx + 600));
  } else {
    console.log(`NOT FOUND: ${sel}`);
  }
}

findCss('.site-header');
findCss('.site-footer');
findCss('.header-inner');
findCss('.footer-inner');
findCss('.brand-details');
findCss('.header-brand');
findCss('.header-actions');
