#!/usr/bin/env node

/**
 * Module dependencies.
 */

const program = require('commander')
const tubeify = require('./dist/index.js')
const fs = require('fs')

program
    .option('-b, --bins <bins>', '# of bins are provided in total')
    .option('-t, --tiles <tiles>', '# of tiles, default: -1 (one bin equals one tile)')
    .option('-l, --bin_length <length>', 'Length of nucleotide sequence per bin')
    .option('-j, --json <file>', 'odgi-bin JSON file')
    .version('0.0.1', '-v, --version')
    .parse(process.argv);

//console.log(program)

const data = JSON.parse(fs.readFileSync(program.json, 'utf8'));
let input = []
data.forEach(item => {
    item.path_name = item["path.name"]
    item.bin = parseInt(item.bin)
    item.prev_bin = JSON.parse(item["prev.bin"])
    item.next_bin = JSON.parse(item["next.bin"])
});
let tube = new tubeify.Tubeify(parseInt(program.tiles), parseInt(program.bins), parseInt(program.bin_length));
let json = tube.tubeify(data);
console.log(JSON.stringify(json))
