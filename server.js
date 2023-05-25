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
rl.on('line', async(line) => {
  // Process each line of the log file here
  try{
  
    const data =  await tailData(logFilePath)
    console.log(data);
    ws.send(data);
    console.log(line);

  }
    catch(err){
        console.log(err);
    }

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


const tailData =function (input_file_path) {
    const maxLineCount = 10;
    const encoding = "utf8";

    return new Promise((resolve, reject) => {
      let lines = [];
      let lineCount = 0;

      const rl = fs
        .createReadStream(input_file_path, { encoding: encoding })
        .on("data", (chunk) => {
          let chunkLines = chunk.split(/\r?\n/).reverse(); // Reverse the chunk lines to read the last lines first
          lines = [...chunkLines, ...lines]; // Concatenate the current chunk to the previous lines
          lineCount += chunkLines.length;

          if (lineCount > maxLineCount) {
            lines = lines.slice(0, maxLineCount); // Keep only the last 10 lines
            lineCount = maxLineCount;
          }
        })
        .on("close", () => {
          resolve(lines.join("\n"));
        })
        .on("error", (err) => {
          reject(err);
        });
    });
  };