
var fs = require('fs');
var path = require('path');

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
    var fRead = 0;
    for(var i=0; i<entBuf.length; i+=4) {
        var offset = entBuf.readUInt32LE(i);
        if(offset>0) {
            process.nextTick(readFileEntry.bind(null, filename, offset));
            fRead++;
        }
    }
    console.log('Going to extract %d files from %s...', fRead, filename);
}

function readFileEntry(archive, offset) {
    fs.open(archive, 'r', function(err, fd) {
        // TODO cleaning + Error management ?
        var nBuf = new Buffer(8);
        fs.read(fd, nBuf, 0, 8, offset, function() {
            var fLength = nBuf.readUInt32LE(0);
            var nLength = nBuf.readUInt32LE(4);
            nBuf = new Buffer(nLength);
            fs.read(fd, nBuf, 0, nLength, offset+8, function() {
                process.nextTick(extractFileEntry.bind(null, 
                    nBuf.toString('utf8'), fd, offset+8+nLength, fLength));
            });
        });
    });
}

function extractFileEntry(filename, fd, from, length) {
    var nParts = filename.split('/');
    name = process.cwd();
    for(var i=0; i<nParts.length-1; i++) {
        name += '/'+nParts[i];
        if(!fs.existsSync(name)) {
            fs.mkdirSync(name);
        }
    }
    var r = fs.createReadStream(null, {
        fd: fd,
        start: from,
        end: from+length-1
    });
    r.pipe(fs.createWriteStream(filename, {
        flags: 'w+'
    }));
    r.on('end', console.log.bind(console, '\tExtracted %s', filename));
}
