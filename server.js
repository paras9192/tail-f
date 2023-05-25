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
  console.log(line);
  try{
  
    const data =  await tailData(logFilePath, 1, "utf8")
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


const tailData =async (input_file_path, maxLineCount, encoding)=> {

    const NEW_LINE_CHARACTERS = ["\n"];

    if (encoding == null) {
        encoding = "utf8";
    }

    const readPreviousChar = function( stat, file, currentCharacterCount) {
        return fs.readFileSync(file, Buffer.alloc(1), 0, 1, stat.size - 1 - currentCharacterCount)
            .then((bytesReadAndBuffer) => {
                return String.fromCharCode(bytesReadAndBuffer[1][0]);
            });
    };

    return new Promise((resolve, reject) => {
        let self = {
            stat: null,
            file: null,
        };

        fs.exists(input_file_path)
            .then((exists) => {
                if (!exists) {
                    throw new Error("file does not exist");
                }

            }).then(() => {
                let promises = [];

                // Load file Stats.
                promises.push(
                    fs.stat(input_file_path)
                        .then(stat => self.stat = stat));

                // Open file for reading.
                promises.push(
                    fs.open(input_file_path, "r")
                        .then(file => self.file = file));

                return Promise.all(promises);
            }).then(() => {
                let chars = 0;
                let lineCount = 0;
                let lines = "";

                const do_while_loop = function() {
                    if (lines.length > self.stat.size) {
                        lines = lines.substring(lines.length - self.stat.size);
                    }

                    if (lines.length >= self.stat.size || lineCount >= maxLineCount) {
                        if (NEW_LINE_CHARACTERS.includes(lines.substring(0, 1))) {
                            lines = lines.substring(1);
                        }
                        fs.close(self.file);
                        if (encoding === "buffer") {
                            return resolve(Buffer.from(lines, "binary"));
                        }
                        return resolve(Buffer.from(lines, "binary").toString(encoding));
                    }

                    return readPreviousChar(self.stat, self.file, chars)
                        .then((nextCharacter) => {
                            lines = nextCharacter + lines;
                            if (NEW_LINE_CHARACTERS.includes(nextCharacter) && lines.length > 1) {
                                lineCount++;
                            }
                            chars++;
                        })
                        .then(do_while_loop);
                };
                return do_while_loop();

            }).catch((reason) => {
                if (self.file !== null) {
                    fs.close(self.file).catch(() => {
                        // We might get here if the encoding is invalid.
                        // Since we are already rejecting, let's ignore this error.
                    });
                }
                return reject(reason);
            });
    });
};