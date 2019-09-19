"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Tubeify = /** @class */ (function () {
    function Tubeify(tile, bin_length, max_bin) {
        this.tile = tile;
        this.max_bin = max_bin;
        this.tiles_range = tile === -1 ?
            Array.from(new Array(this.max_bin)).map(function (v, i) { return i; }) :
            Array.from(new Array(tile)).map(function (v, i) { return Math.round(max_bin * i / tile); });
        this.bin_length = bin_length || 0;
    }
    Tubeify.prototype.tiles = function (bin) {
        // Find the tile ID by binary search on tiled_range.
        // let flag = false; // It should be replaced with a binary search at least.
        var tile_index = this.tiles_range.length;
        this.tiles_range.forEach(function (range, i) {
            if (range <= bin) {
                tile_index = i;
                return;
            }
        });
        return tile_index;
    };
    Tubeify.prototype.tileify = function (bin_json) {
        var matrix = [];
        // Create reads for every contiguous segment of bins within a Path
        bin_json.forEach(function (path) {
            var temporary_reads = [];
            var first_node_offset = 0;
            var previous_bin_id = 0;
            // Iterate bins and look at id
            path.bins.forEach(function (bin) {
                // For each contiguous range, make a Read
                if (bin[0] === previous_bin_id + 1) { // Contiguous from the previous bin: do nothing
                }
                else { // Not contiguous: Create a new read.
                    temporary_reads.push(newRead(first_node_offset, previous_bin_id, path.id));
                    first_node_offset = bin[0];
                }
                previous_bin_id = bin[0];
            });
            temporary_reads.push(newRead(first_node_offset, previous_bin_id, path.id));
            // Links: inside of one read:   
            // Input Example:  [ 5, 10]  meaning bins 5 and 10 are connected
            path["links"].forEach(function (link) {
                var index = binary_search(link[0], temporary_reads);
                // Pos uses relative coordinates = first bin_id -  firstNodeOffset
                temporary_reads[index].sequenceNew[0].mismatches.push({
                    type: "link", pos: link[0] - temporary_reads[index].firstNodeOffset, seq: "L", query: link[1]
                });
                //make second link bidirectional
                var buddy = binary_search(link[1], temporary_reads);
                temporary_reads[buddy].sequenceNew[0].mismatches.push({
                    type: "link", pos: link[1] - temporary_reads[buddy].firstNodeOffset, seq: "L", query: link[0]
                });
            });
            matrix = matrix.concat(temporary_reads);
        });
        var tubemap_json = {
            nodes: [{ "name": "Layout", "sequenceLength": this.max_bin }],
            tracks: [{ id: 0, name: "REF", sequence: ["Layout"] }],
            reads: matrix
        };
        return tubemap_json;
        function newRead(first_node_offset, previous_bin_id, path_id) {
            // Placeholder of sequence_new.
            var stub = [{ nodeName: "Layout", mismatches: [] }];
            return {
                firstNodeOffset: first_node_offset,
                finalNodeCoverLength: previous_bin_id - first_node_offset,
                mapping_quality: 60,
                is_secondary: false,
                sequence: ["Layout"],
                sequenceNew: stub,
                type: "read",
                read_id: path_id,
                id: path_id
            };
        }
        function binary_search(target, sorted_data) {
            // d=data, t=target, s=start, e=end, m=middle
            function binarySearch(d, t, s, e) {
                //d[i][0] is the bin_id we are sorted and searching for
                var m = Math.floor((s + e) / 2);
                if (t == d[m].firstNodeOffset || m === e)
                    return m;
                if (e - 1 === s)
                    return d[e].firstNodeOffset == t ? e : s; //return first read, unless e is exact match
                if (t > d[m].firstNodeOffset)
                    return binarySearch(d, t, m, e);
                if (t < d[m].firstNodeOffset)
                    return binarySearch(d, t, s, m);
                return -1; // should be unreachable if data is populated
            }
            return binarySearch(sorted_data, target, 0, sorted_data.length - 1);
        }
    };
    return Tubeify;
}());
exports.Tubeify = Tubeify;
//# sourceMappingURL=index.js.map