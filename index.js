#!/usr/bin/env node

var argv = process.argv;

var commands = {
    help: {
        des: 'show usage info',
        usage: ''
    },
    extract: {
        file: 'extract.js',
        des: 'extract .dat file (FTL game\'s format)',
        usage: '<filename> [startOffset]'
    }
}

if(argv.length < 3 || argv[2] == 'help') {
    console.error('Usage : bin-tools <command> [arguments...]');
    console.error('\tAvailable commands:');
    for(var cmd in commands) {
        console.error('\t- %s : %s', cmd, commands[cmd].desc);
        console.error('\t\tbin-tools %s %s', cmd, commands[cmd].usage);
    }
}
else if(argv[2] in commands) {
    var cmd = require(__dirname+'/'+commands[argv[2]].file);
    cmd.call(new Helper(argv[2]), argv.slice(3));
}

function Helper(cmd) {
    this.cmd = cmd;
}

Helper.prototype = {
    usage: function() {
        console.error('Usage : bin-tools %s %s', this.cmd, commands[this.cmd].usage);
    }
}
