
var fs = require('fs');
var path = require('path');

var Step = require('step');

module.exports = function(argv) {
    if(!argv.length) {
        this.usage();
    }
    var filename = argv[0];
    if(!fs.existsSync(filename)) {
        return console.error("File %s doesn't exists!", filename);
    }
    var nBuf = new Buffer(4);
    var fd = fs.openSync(filename, 'r');
    var stat = fs.fstatSync(fd);
    fs.readSync(fd, nBuf, 0, 4, 0);
    var entBuf = new Buffer(nBuf.readUInt32LE(0)*4);
    fs.readSync(fd, entBuf, 0, entBuf.length, 4);
    var fRead = [];
    for(var i=0; i<entBuf.length; i+=4) {
        var offset = entBuf.readUInt32LE(i);
        if(offset>0) {
            fRead.push(wrap(filename, fd, offset));
        }
    }
    console.log('Going to extract %d files from %s...', fRead.length, filename);
    fRead.push(function(err) {
        console.log('Success!');
    });
    Step.apply(Step, fRead);
}

function wrap(filename, fd, offset) {
    return function(err) {
        if(err) {
            return console.error('Error processing archive %s :', filename, err);
        }
        else {
            readFileEntry(filename, fd, offset, this);
        }
    }
}

function readFileEntry(filename, fd, offset, cb) {
    fs.read(fd, new Buffer(8), 0, 8, offset, function(err, bytesRead, nBuf) {
        if(err) {
            return console.error('Error reading entry length:', err);
        }
        var fLength = nBuf.readUInt32LE(0);
        var nLength = nBuf.readUInt32LE(4);
        fs.read(fd, new Buffer(nLength), 0, nLength, offset+8,
            function(err, bytesRead, nBuf) {
                if(err) {
                    return console.log('Error reading entry name:', err);
                }
                process.nextTick(extractFileEntry.bind(null, 
                    nBuf.toString('utf8'), filename, offset+8+nLength, fLength, cb));
        });
    });
}

function extractFileEntry(filename, source, from, length, cb) {
    console.log('Extracting %s from %s @ %d', filename, source, from);
    var nParts = filename.split('/');
    name = process.cwd();
    for(var i=0; i<nParts.length-1; i++) {
        name += '/'+nParts[i];
        if(!fs.existsSync(name)) {
            fs.mkdirSync(name);
        }
    }
    var r = fs.createReadStream(source, {
        start: from,
        end: from+length-1
    });
    r.pipe(
        fs.createWriteStream(filename, { flags: 'w+' })
    ).on('close', function() {
        //console.log('\tExtracted %s', filename);
        cb(null);
    });
}
