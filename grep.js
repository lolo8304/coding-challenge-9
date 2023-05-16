#!/usr/bin/env node

const { program } = require('commander');

const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const readline = require('readline');


program.version('1.0.0');


async function actionMethod (pattern, files, options, commands) {
    var totalCount = await grep(pattern, files, options, readStreamFromFilesOrConsole(files, options));
    if (totalCount > 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  }

program
  .arguments('<pattern> [files...]')
  .option('-r, --recursive')
  .option('-v, --invert-match')
  .option('--debug')
  .description('grep from code challenge')
  .action(actionMethod);

program.parse(process.argv);

function wildcardToRegExp(wildcard) {
  const escapedWildcard = wildcard.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = escapedWildcard.replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${regex}$`);
}

function iterateOverFileNamesOrPatterns(fileNamesOrPatterns, options, callback) {
  for(const fileNameOrPath of fileNamesOrPatterns) {
    const filePath = path.dirname(fileNameOrPath);
    const baseName = path.basename(fileNameOrPath);
    if (!filePath) {
      filePath = "./"
    }
    //console.log("search "+filePath+" name "+baseName)
    iterateFiles(filePath, [baseName], options, callback)
  }
}


function iterateFiles(dir, filePatterns, options, callback) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const isDirectory = fs.statSync(filePath).isDirectory();
    //console.log(filePath);

    if (options.recursive && isDirectory) {
      // Recursively iterate over subfolders
      iterateFiles(filePath, filePatterns, options, callback);
    } else {
      //console.log("--------")
      // Check if the file matches any of the specified patterns
      const matchesPattern = filePatterns.some((pattern) => {
        const regex = new RegExp(wildcardToRegExp(pattern));
        return regex.test(file);
      });

      if (matchesPattern) {
        callback(filePath);
      }
    }
  });
}


function readStreamFromFilesOrConsole(files, options) {
  if (files && files.length > 0) {
    var filteredFiles =[]
   
   iterateOverFileNamesOrPatterns(files, options, (file) => {
    filteredFiles.push(file)
   });

   const filteredStreams = filteredFiles.map((file) => {
     const fsStream = fs.createReadStream(file);
     return {
       name: file,
       stream: fsStream
     }
   });
   return filteredStreams;
  } else {
    return [
      {
        name: "console", 
        stream: process.stdin 
      }
    ];
  }
}



function readLinesFromStream(streamObj, callback) {
  //console.log("read from "+streamObj.name)
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



async function grep(pattern, files, options, streams) {
  var logName = files && files.length > 1
  
  var totalFound=0;
  for(const stream of streams) {
    var mypromise = readLinesFromStream(stream, (line) => {
      const found = containsPattern(options, pattern, line);
      if (found) {
        if (logName) {
          console.log(stream.name+":"+line)
        } else {
          console.log(line);
        }
      }
    })
    
    var resultList = await mypromise;
    totalFound += resultList.length
  }
  return totalFound
}

function containsPattern(options, pattern, line) {
  if (options.debug) { 
    console.log("test: "+line) 
  }
  var found = pattern && line.includes(pattern)
if (options.invertMatch) {
    return !found
  } else {
    return found
  }
}


