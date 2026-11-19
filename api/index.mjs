import { createApp } from '../server.mjs';

const app = createApp();
const handleRequest = app.listeners('request')[0];

export default function handler(req, res) {
  return handleRequest(req, res);
}