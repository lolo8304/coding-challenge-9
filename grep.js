#!/usr/bin/env node

const { program } = require('commander');

const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const readline = require('readline');


program.version('1.0.0');

program
  .arguments('<pattern> [files...]')
  .option('-r')
  .description('grep from code challenge')
  .action((pattern, files, options, commands) => {
    var promise = grep(pattern, files, options, readStreamFromFilesOrConsole(files, options));
    promise
    .then((result) => {
    if (result && result.length > 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
    
  });

program.parse(process.argv);


function iterateFiles(dir, filePatterns, options, callback) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const isDirectory = fs.statSync(filePath).isDirectory();

    if (options.r && isDirectory) {
      // Recursively iterate over subfolders
      iterateFiles(filePath, filePatterns, options, callback);
    } else {
      // Check if the file matches any of the specified patterns
      const matchesPattern = filePatterns.some((pattern) => {
        const regex = new RegExp(pattern);
        return regex.test(file);
      });

      if (matchesPattern) {
        // Perform operations on the matched file
        callback(filePath);
      }
    }
  });
}


function readStreamFromFilesOrConsole(files, options) {
  if (files && files.length > 0) {
    var filteredFiles =[]
   
   iterateFiles("", filePatterns, options, (file) => {
    filteredFiles.push(file)
   });

   return filteredFiles.map((file) => {
     name: file,
     stream: fs.createReadStream(file)
   })
  } else {
    const stream = new Readable({
      read(size) {
        const chunk = process.stdin.read(size);
        if (chunk !== null) {
          this.push(chunk);
        } else {
          this.push(null);
        }
      }
    });
    return [{name: "console", stream: stream}];
  }
}



function readLinesFromStream(streamObj, callback) {
  const rl = readline.createInterface({
    input: streamObj.stream,
    crlfDelay: Infinity
  });
  
  var lines = [];

  return new Promise((resolve, reject) => {
    rl.on('line', (line) => {
      if (callback(line)) {
        lines.push(line)
      }
    });

    rl.on('close', () => {
      resolve(lines);
    });

    rl.on('error', (err) => {
      reject(err);
    });
  });
}



function grep(pattern, files, options, streams){
  var logName = files && files.length > 1
  
  return readLinesFromStream(streams[0], (line) => {
    const found = containsPattern(pattern, line);
    if (found) {
      if (logName) {
        console.log(streamObj.name+":"+line)
      } else {
        console.log(line);
      }
    }
     return found;
})
}

function containsPattern(pattern, line) {
  if (pattern) {
    return line.includes(pattern)
  } else {
    return true;
  }
}


