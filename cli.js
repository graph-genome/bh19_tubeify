#!/usr/bin/env node

/**
 * Module dependencies.
 */

const program = require('commander');
const tubeify = require('./dist/index.js');
const fs = require('fs');
const parse = require('parse-jsonp');

// This is a testing method.
/*
let tubes = new tubeify.Tubeify(30, 300, 1000);
console.log(tubes.tiles_range);
console.log(tubes.tiles(0)) // 0
console.log(tubes.tiles(1)) // 0
console.log(tubes.tiles(9)) // 0
console.log(tubes.tiles(10)) //1
console.log(tubes.tiles(11)) //1
console.log(tubes.tiles(290)) //29
console.log(tubes.tiles(300)) //289
*/
program
    .option('-b, --bins <bins>', '(optional) # of bins are provided in total', defaultValue=1)
    .option('-t, --tiles <tiles>', '# of tiles, default: -1 (one bin equals one tile)')
    .option('-l, --bin_length <length>', 'Length of nucleotide sequence per bin')
    .option('-j, --json <file>', 'odgi-bin JSON file')
    .option('-k, --tile_json <file>', 'tile JSON file')
    .version('0.0.1', '-v, --version')
    .parse(process.argv);

function readLines(input, interpret_func, callback) {
    var remaining = '';

    input.on('data', function (data) {
        remaining += data;
        remaining = remaining.replace('\r', '');
        var index = remaining.indexOf('\n');
        var last = 0;
        while (index > -1) {
            var line = remaining.substring(last, index);
            last = index + 1;
            interpret_func(line);
            index = remaining.indexOf('\n', last);
        }

        remaining = remaining.substring(last);
    });

    input.on('end', function () {
        if (remaining.length > 0) {
            interpret_func(remaining);
        }
        callback()
    });
}

// console.log(program)
// If an input file is JSON.
// const data = JSON.parse(fs.readFileSync(program.json, 'utf8'));

// If an input file is JSONP.
global.data = [];

function interpreter(line) {
    let chunk = JSON.parse(line);
    global.data.push(chunk)
}

function convertToTile() {
    let data = global.data;
    let converter = new tubeify.Tubeify(parseInt(program.tiles), parseInt(program.bin_length), parseInt(program.bins));
    let json = converter.tileify(data);
    let out = JSON.stringify(json, null, 2);
    if(program.tile_json){
        fs.writeFile(program.tile_json, out);
    }else{
        fs.writeFile('tests/recent.json', out);
    }
    // console.log(out);

}

var input_data = fs.createReadStream(program.json);
readLines(input_data, interpreter, convertToTile);

/*

let data = global.data

let input = []
data.forEach(item => {
    item.bin_id = parseInt(item.bin_id)
    item.begins = JSON.parse(item["begins"])
    item.ends = JSON.parse(item["ends"])
});
let tube = new tubeify.Tubeify(parseInt(program.tiles), parseInt(program.bin_length),  parseInt(program.bins));
// let tube = new tubeify.Tubeify(30, 300, 1000); For given 300 bins, we would like to have 30 tiles.
let json = tube.tubeify(data);
console.log(JSON.stringify(json))
*/