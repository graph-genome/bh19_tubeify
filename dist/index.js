"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Tubeify = /** @class */ (function () {
    function Tubeify(tile, bin_length, max_bin) {
        this.tile = tile;
        this.max_bin = max_bin;
        this.bin_length = bin_length || 0;
    }
    Tubeify.prototype.tileify = function (bin_json) {
        var _this = this;
        var matrix = [];
        var id_count = 0;
        // Create reads for every contiguous segment of bins within a Path
        bin_json.forEach(function (path, path_i) {
            var temporary_reads = [];
            var first_node_offset = path.bins[0][0];
            var previous_bin_id = path.bins[0][0] - 1;
            // Iterate bins and look at id
            path.bins.forEach(function (bin) {
                // For each contiguous range, make a Read
                if (bin[0] === previous_bin_id + 1) { // Contiguous from the previous bin: do nothing
                }
                else { // Not contiguous: Create a new read.
                    temporary_reads.push(newRead(first_node_offset, previous_bin_id, path, id_count++));
                    first_node_offset = bin[0];
                }
                previous_bin_id = bin[0];
                _this.max_bin = Math.max(_this.max_bin, previous_bin_id + 1); // make sure it's correct.
                //TODO: if this.max_bin ever updates, we need to recompute tiles_range
            });
            temporary_reads.push(newRead(first_node_offset, previous_bin_id, path, id_count++));
            // Links: inside of one read:   
            // Input Example:  [ 5, 10]  meaning bins 5 and 10 are connected
            path["links"].forEach(function (link) {
                var distance = Math.abs(link[0] - link[1]);
                if (distance > 20) { //Don't create internal links, that defeats the point of binning
                    //if(link[0] > link[1]) { //less common case of links going against the grain
                    var index = binary_search(link[0], temporary_reads);
                    temporary_reads[index].sequenceNew[0].mismatches.push({
                        type: "link", query: link[1], seq: "L",
                        pos: link[0] //absolute - temporary_reads[index].firstNodeOffset
                    });
                    //make second link bidirectional
                    if (link[0] !== 0 && link[1] !== 0) {
                        var buddy = binary_search(link[1], temporary_reads);
                        temporary_reads[buddy].sequenceNew[0].mismatches.push({
                            type: "link", seq: "L", query: link[0],
                            pos: link[1] //- temporary_reads[buddy].firstNodeOffset
                        });
                    }
                }
            });
            matrix = matrix.concat(temporary_reads);
        });
        return {
            nodes: [{ "name": "Layout", "sequenceLength": this.max_bin }],
            tracks: [{ id: 0, name: "REF", indexOfFirstBase: 0, sequence: ["Layout"] }],
            reads: matrix
        };
        function newRead(first_node_offset, previous_bin_id, path, path_i) {
            // Placeholder of sequence_new.
            var stub = [{ nodeName: "Layout", mismatches: [] }];
            return {
                firstNodeOffset: first_node_offset,
                finalNodeCoverLength: previous_bin_id,
                mapping_quality: hashCode(path.path_name) % 100,
                is_secondary: false,
                sequence: ["Layout"],
                sequenceNew: stub,
                type: "read",
                name: path.path_name,
                id: path_i
            };
        }
        function binary_search(target, sorted_data) {
            // d=data, t=target, s=start, e=end, m=middle
            function binarySearch(d, t, s, e) {
                //d[i][0] is the bin_id we are sorted and searching for
                var m = Math.floor((s + e) / 2);
                if (t === d[m].firstNodeOffset || m === e)
                    return m;
                if (e - 1 === s)
                    return d[e].firstNodeOffset === t ? e : s; //return first read, unless e is exact match
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
function hashCode(obj) {
    //https://stackoverflow.com/a/8076436/3067894
    var hash = 0;
    for (var i = 0; i < obj.length; i++) {
        var character = obj.charCodeAt(i);
        hash = ((hash << 5) - hash) + character;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}
exports.hashCode = hashCode;
//# sourceMappingURL=index.js.map