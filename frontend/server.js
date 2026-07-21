import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve the static files from the Vite 'dist' folder
app.use(express.static(path.join(__dirname, 'dist')));

// UPDATED: Express v5 safe fallback for React Router / PWA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server on port 3005
app.listen(3005, () => {
  console.log('Frontend server is perfectly online on port 3005');
});