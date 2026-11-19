import { createApp } from '../server.mjs';

const app = createApp();

export default function handler(req, res) {
  app.emit('request', req, res);
}
