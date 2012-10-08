#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var readline = require('readline');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});

var dataFile, fd, start = 0;

module.exports = function(argv) {
    if(!argv.length) {
        return this.usage();
    }
    dataFile = argv[0];
    start = parseInt(argv[1] || '0');
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
}

function askFile(offset) {
    if(typeof offset != 'number') {
        offset = parseInt(offset.trim()) || start;
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
