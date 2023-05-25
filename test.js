const fs = require("fs");

const tailData = function (input_file_path) {
    const NEW_LINE_CHARACTERS = ["\n"];
    const maxLineCount = 10;
    const encoding = "utf8";

    const readPreviousChar = function (stat, file, currentCharacterCount) {
      const buffer = Buffer.alloc(1);
      return fs
        .readSync(file, buffer, 0, 1, stat.size - 1 - currentCharacterCount)
        .then(() => {
          return String.fromCharCode(buffer[0]);
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
            throw new Error("File does not exist");
          }
        })
        .then(() => {
          let promises = [];

          // Load file Stats.
          promises.push(
            fs.stat(input_file_path).then((stat) => (self.stat = stat))
          );

          // Open file for reading.
          promises.push(
            fs.open(input_file_path, "r").then((file) => (self.file = file))
          );

          return Promise.all(promises);
        })
        .then(() => {
          let chars = 0;
          let lineCount = 0;
          let lines = "";

          const do_while_loop = function () {
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
                if (
                  NEW_LINE_CHARACTERS.includes(nextCharacter) &&
                  lines.length > 1
                ) {
                  lineCount++;
                }
                chars++;
              })
              .then(do_while_loop);
          };
          return do_while_loop();
        })
        .catch((reason) => {
          if (self.file !== null) {
            fs.close(self.file).catch(() => {
              // We might get here if the encoding is invalid.
              // Since we are already rejecting, let's ignore this error.
            });
          }
          return reject(reason);
        });
    });
  }


const test = async ()=>

{
    try{
    const data =  await tailData("./test.txt")
    console.log(data);

    }
    catch(err){
        console.log(err);
    }

}
test();
