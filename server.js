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

wss.on('connection', async(ws) => {
//     // Create a readline interface
//     const rl = readline.createInterface({
//       input: fs.createReadStream(logFilePath),
//       output: process.stdout,
//       terminal: false
//     });


// // Event listener for new lines in the log file
// rl.on('line', async(line) => {
//   // Process each line of the log file here
//     const data = line.toString();
//     const tailData = data.split('\n').reverse().slice(0,10).reverse().join('\n');
//     ws.send(data);

// });

// // Event listener for the end of the file
// rl.on('close', () => {
//   console.log('End of log file');
// });
// });
const stream = fs.createReadStream(logFilePath);
const rl = readline.createInterface({
  input: stream,
  crlfDelay: Infinity
});

let lines = [];
for await (const line of rl) {
  lines.push(line);

  // Process a batch of lines
  if (lines.length >= 1000) {
    const data = lines.join('\n');
    ws.send(data);
    lines = [];
  }
}

// Process any remaining lines
if (lines.length > 0) {
  const data = lines.join('\n');
  ws.send(data);
}
});

app.get('/log',(req,res)=>{
    res.sendFile(__dirname + '/index.html');

});
server.listen(5002,()=>{
    console.log('Server is running on port 5002');
});


const tailData = function(input_file_path) {
    const maxLineCount = 10;
    const encoding = "utf8";
  
    return new Promise((resolve, reject) => {
      const rl = fs.createReadStream(input_file_path, { encoding: 'utf8' });
      const lines = [];
      let lineCount = 0;
  
      rl.on('data', (chunk) => {
        const data = chunk.toString();
        console.log(data);
        const chunkLines = data.split('\n').filter(Boolean);
        for (const line of chunkLines) {
          lines.push(line);
          lineCount++;
          if (lineCount > maxLineCount) {
            lines.shift();
            lineCount--;
          }
        }
      });
  
      rl.on('end', () => {
        console.log('End of file');
        resolve(lines.join('\n'));
      });
  
      rl.on('error', (error) => {
        reject(error);
      });
    });
  };