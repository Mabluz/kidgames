const express = require('express');
const path = require('path');
const livereload = require('livereload');
const connectLivereload = require('connect-livereload');

const app = express();
const PORT = 8000;

// Create livereload server
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(__dirname);

// Add livereload middleware
app.use(connectLivereload());

app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Live reload enabled - page will refresh automatically when files change');
});