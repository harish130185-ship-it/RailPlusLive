
import { createApp } from '../server.mjs';

const app = createApp();

export default function handler(req, res) {
  return new Promise((resolve, reject) => {
    res.once('finish', resolve);
    res.once('close', resolve);
    res.once('error', reject);

    app.emit('request', req, res);
  });
}
