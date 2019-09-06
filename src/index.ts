interface Bin {
    path_name: string,

}

export class Tubeify {
    private tile: number; // # of tiles in output. One tile corresponds to one bin if tiles === -1.
    private max_bin: number; // # of bins in input.
    private bin_length: number; // Nucleotide length of each bins.
    tiles_range: number[]; // e.g. [0, 5, 10, 15, 20] according to max_bin and tile.

    constructor(tile: number, bin_length: number, max_bin?: number) {
        this.tile = tile;
        this.tiles_range = tile === -1 ?
            Array.from(new Array(this.max_bin)).map((v, i) => i) :
            Array.from(new Array(tile)).map((v, i) => Math.round(max_bin * i / tile));
        this.bin_length = bin_length || 0;
        this.max_bin = Number.isNaN(max_bin) ? -1 : max_bin;
    }

    tiles(bin: number) {
        // Find the tile ID by binary search on tiled_range.
        // let flag = false; // It should be replaced with a binary search at least.
        let tile_index = this.tiles_range.length;
        this.tiles_range.forEach((range, i) => {
            if (range <= bin) {
                tile_index = i;
                return
            }
        });
        return tile_index
    }

    tubeify(bin_json: any) {
        let reads = [];
        let paths = {};
        let path_starts = {};
        let max_bin_id = 0;

        bin_json.forEach(bin => {
            if (paths[bin.name] === undefined) {
                paths[bin.name] = {};
            }
            paths[bin.name][bin.bin_id] = bin;
            if (bin.begins[0][0] === -1) {
                path_starts[bin.name] = bin.bin_id;
            }
            if (max_bin_id < bin.bin_id) {
                max_bin_id = bin.bin_id; 
            }
        });

        if (this.max_bin === -1) {
            this.max_bin = max_bin_id;
        }
        /*
        Object.keys(paths).forEach(path_name => {
            let path_hash = paths[path_name];
            let current_tile = -1;
            let sequential_id = 0;
            let tmp = [];
            let current_pos = path_starts[path_name];

            while(current_pos !== -1) {
                let bin = path_hash[current_pos];
                if (current_tile !== tiles(bin.bin)) {
                    let sequence_new = tmp.map(a => a.);
                    
                    // Output as a single bin.
                    let firstNodeOffset = tmp[0].bin - this.tiles_range[current_tile]; 
                    if (firstNodeOffset > 0) {
                        sequence_new.push({type: "link", pos: firstNodeOffset, seq: "translocation", query: bin.bin });
                    }
                    if (bin.bin - 1 !== tmp[-1].bin ) {
                        sequence_new.push({type: "link", pos:(tmp.length) * this.bin_length, seq: "translocation", query: bin.bin });
                    }

                    reads.push({
                        firstNodeOffset: firstNodeOffset * this.bin_length,
                        finalNodeCoverLength: (tmp.length) * this.bin_length,
                        mapping_quality: 60,
                        is_secondary: false,
                        Sequence: tmp.map(item => String(item.bin_id)),
                        Sequence_new: sequence_new,
                        type: "read",
                        name: bin.path_name,
                        id: sequential_id
                   });

                    sequential_id += 1;
                    current_tile = tiles(bin.bin);

                    tmp = [bin];
                } else {
                    tmp.push(bin);
                }
                bin.
                current_pos = bin.next_bin[0];
            }
            // Clean up bins

            reads.push({
                firstNodeOffset: firstNodeOffset * this.bin_length,
                finalNodeCoverLength: (tmp.length) * this.bin_length,
                mapping_quality: 60,
                is_secondary: false,
                Sequence: tmp.map(item => item.bin),
                Sequence_new: sequence_new,
                type: "read",
                name: bin.path_name,
                id: sequential_id
            });
        })
        */


        let previous_id = -1;
        let previous_bin = -1;
        bin_json.forEach(bin => {
            bin.begins.forEach((begin, index) => {
                if (previous_bin !== bin.path_name) {
                    previous_id = 0;
                    previous_bin = bin.path_name;
                } else {
                    previous_id += 1;
                }
                let sequence_new = [{
                    nodeName: String(bin.bin_id),
                    mismatches: []
                }];
                // console.log(bin)
                if (bin.begins[index][0] !== bin.bin_id - 1 && bin.begins[index][0] !== -1) {
                    sequence_new[0].mismatches.push({
                        type: "link", pos: 0, seq: "LINK", query: bin.begins[index][0]
                    });
                }
                if (bin.ends[index][0] !== bin.bin_id + 1 && bin.ends[index][0] !== -1) {
                    sequence_new[0].mismatches.push({
                        type: "link", pos: this.bin_length, seq: "LINK", query: bin.ends[index][0] 
                    });
                }
                reads.push({
                    firstNodeOffset: 0,
                    finalNodeCoverLength: this.bin_length,
                    mapping_quality: 60,
                    is_secondary: false,
                    sequence: [String(bin.bin_id)],
                    sequenceNew: sequence_new,
                    type: "read",
                    name: bin.path_name,
                    id: previous_id
                });
            })
        })

        let tubemap_json = {};
        const nodes = Array.from(new Array(this.max_bin)).map((v, i) => { return { name: String(i + 1), sequenceLength: this.bin_length } }
        );
        tubemap_json["nodes"] = nodes;
        tubemap_json["paths"] = [{ id: 0, name: "REF", sequence: nodes.map(node => node.name) }];
        tubemap_json["reads"] = reads;

        return tubemap_json
    }

}
