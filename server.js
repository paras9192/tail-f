const express = require('express');
const http = require('http');
const fs = require('fs');
const readline = require('readline');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.get('/',(req,res)=>{
    res.send('Hello World');
} );

// Specify the path to your log file
const logFilePath = './test.txt';

wss.on('connection', (ws) => {
    // Create a readline interface
    const rl = readline.createInterface({
      input: fs.createReadStream(logFilePath),
      output: process.stdout,
      terminal: false
    });


// Event listener for new lines in the log file
rl.on('line', (line) => {
  // Process each line of the log file here
  ws.send(line);
  console.log(line);
});

// Event listener for the end of the file
rl.on('close', () => {
  console.log('End of log file');
});
});

app.get('/log',(req,res)=>{
    res.sendFile(__dirname + '/index.html');

});
server.listen(5002,()=>{
    console.log('Server is running on port 5002');
});

