#!/usr/bin/env node

const { program } = require('commander');

const fs = require('fs');
const { Readable } = require('stream');
const readline = require('readline');


program.version('1.0.0');

program
  .arguments('<pattern> [file]')
  .description('grep from code challenge')
  .action((pattern, file) => {
    grep(pattern, readStreamFromFileOrConsole(file))
  });

program.parse(process.argv);






function readStreamFromFileOrConsole(file = null) {
  if (file) {
    const stream = fs.createReadStream(file);
    return stream;
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
    return stream;
  }
}



function readLinesFromStream(stream, callback) {
  const rl = readline.createInterface({
    input: stream,
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



function grep(pattern, stream){
  readLinesFromStream(stream, (line) => {
    const found = containsPattern(pattern, line);
    if (found) {
      console.log(line);
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


