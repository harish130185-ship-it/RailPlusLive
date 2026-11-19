// Website uses the same-origin Node backend; never insert RailKit API keys here.
// file:// preview stays in demo mode until the website is hosted.
window.RAIL_APP_CONFIG = {
  apiBaseUrl: window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? window.location.origin : ''
};
