#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var readline = require('readline');

if(process.argv.length<3) {
    console.error('\tUsage : %s filename [startOffset]', process.argv[1]);
    process.exit(1);
}

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});

var dataFile = process.argv[2];
var fd = undefined; //
var start = process.argv[3] || 0, offset;

rl.question('Open file ['+dataFile+']: ', function(res) {
    res = (res||'').trim();
    if(res) {
        dataFile = res;
    }
    fd = fs.openSync(dataFile, 'r');
    var stat = fs.fstatSync(fd);
    console.log('\tOpened file %s of size %d', dataFile, stat.size);
    rl.question('Start at offset ['+(start||0).toString()+']: ', askFile);
});

function askFile(start) {
    var offset = 0;
    if(typeof start == 'number') {
        offset = start;
    }
    else {
        offset = parseInt(start.trim());
    }
    var bLength = new Buffer(4);
    fs.readSync(fd, bLength, 0, 4, offset); offset+=4;
    var length = bLength.readUInt32LE(0);
    fs.readSync(fd, bLength, 0, 4, offset); offset+=4;
    var lName = bLength.readUInt32LE(0);
    var bName = new Buffer(lName);
    fs.readSync(fd, bName, 0, lName, offset); offset+=lName;
    rl.question('Extract file '+bName.toString('utf8')+' ? [Yes]: ',
        doExtractFile.bind(null, bName.toString('utf8'), offset, length))
}

function doExtractFile(name, offset, length, res) {
    res = (res||'y').toLowerCase();
    if(res[0] == 'y' || res[0] == 'o') {
        extract_to(name, fd, offset, length);
        fd = fs.openSync(dataFile, 'r');
    }
    else {
        process.nextTick(askFile.bind(null, offset+length));
    }
}

function extract_to(name, file, from, length) {
    var nParts = name.split('/');
    name = process.cwd();
    for(var i=0; i<nParts.length-1; i++) {
        name += '/'+nParts[i];
        if(!fs.existsSync(name)) {
            fs.mkdirSync(name);
        }
    }
    name += '/'+nParts[nParts.length-1];
    var src = fs.createReadStream(undefined, {
        fd: file,
        start: from,
        end: from+length-1
    });
    var dst = fs.createWriteStream(name);
    src.pipe(dst);
    src.on('end', askFile.bind(null, from+length));
}
