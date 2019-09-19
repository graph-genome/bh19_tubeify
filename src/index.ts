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

    tileify(bin_json: any){
        let matrix = [];

        // Create reads for every contiguous segment of bins within a Path
        // For one Path
        bin_json.forEach((path) => {
            let temporary_reads = []
            let first_node_offset = 0;
            let previous_bin_id = 0;
            // Iterate bins and look at id
            path.bins.forEach(bin => {
                if (bin[0] === previous_bin_id + 1) {
                    // Contiguous from the previous bin.
                } else {
                    // Not contiguous
                    // Create a new read.
                    
                    // Placeholder of sequence_new.
                    let sequence_new = {
                        0: {
                            nodeName: "0",
                            mismatches: []
                        }
                    };
                    
                    // For each contiguous range, make a Read
                    temporary_reads.push({
                        firstNodeOffset: first_node_offset,
                        finalNodeCoverLength: previous_bin_id - first_node_offset,
                        mapping_quality: 60,
                        is_secondary: false,
                        sequence: ["Layout"], // Array.from(new Array(previous_bin_id - first_node_offset)).map((v, i) => i + first_node_offset),
                        sequenceNew: sequence_new,
                        type: "read",
                        read_id: path.id,
//                        name: bin.path_name, // + ":" + String(previous_id),
                        id: path.id,
                    });
                    first_node_offset = bin[0];
                }
                previous_bin_id = bin[0];
            });
            // Placeholder of sequence_new.
            let sequence_new = {
                0: {
                    nodeName: "0",
                    mismatches: []
                }
            };
            temporary_reads.push({
                firstNodeOffset: first_node_offset,
                finalNodeCoverLength: previous_bin_id - first_node_offset,
                mapping_quality: 60,
                is_secondary: false,
                sequence: ["Layout"],
                sequenceNew: sequence_new,
                type: "read",
                read_id: path.id,
                id: path.id,
            });


            // Links: inside of one read:   
            // Input Example:  [ 5, 10]  meaning bins 5 and 10 are connected
            path.links.forEach((link) => {
                let lower_bound = 0;
                let upper_bound = temporary_reads.length - 1;
                let index = -1;
                // Binary search
                while (true) {
                    let index = Math.floor((lower_bound + upper_bound) / 2);

                    let left = temporary_reads[index].firstNodeOffset;
                    let right = temporary_reads[index].firstNodeOffset + temporary_reads[index].finalNodeCoverLength;
                    
                    if (left <= link[0] && link[0] < right) {
                        break;
                    } else if (left > link[0]) {
                        upper_bound = index; 
                    } else {
                        lower_bound = index;
                    };
                }

                // Position = first bin_id -  firstNodeOffset relative coordinate   ex: 5 - 3 = 2
                // Query = second bin_id    ex: 10
                // Mismatch: type: “link”
                // 0: {type: "link", pos: 2, seq: "LINK", query: “10”}
                temporary_reads[index].sequenceNew[0].mismatches.push({
                    type: "link", pos: link[0] - temporary_reads[index].firstNodeOffset, seq: "L", query: link[1]
                })

                // 0: {type: "link", pos: 10, seq: "LINK", query: “5”}
            });
            matrix.concat(temporary_reads);
        })

        let tubemap_json = {};
        tubemap_json["nodes"] = [{"name": "Layout", "sequenceLength": this.max_bin}];
        tubemap_json["tracks"] = [{ id: 0, name: "REF", sequence: ["Layout"] }];
        tubemap_json["reads"] = matrix;

        return tubemap_json
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


        let previous_id = -1;
        let path_unique_id = -1;
        let previous_bin = -1;
        bin_json.forEach(bin => {
            bin.begins.forEach((begin, index) => {
                // let index = 0;
                if (previous_bin !== bin.path_name) {
                    previous_id = 0;
                    previous_bin = bin.path_name;
                    path_unique_id += 1;
                } else {
                    previous_id += 1;
                }
                let sequence_new = [{
                    nodeName: String(bin.bin_id),
                    mismatches: []
                }];
                // console.log(bin)
                if (bin.begins[index][0] + 1 !== bin.bin_id - 1 && bin.begins[index][0] !== -1) {
                    sequence_new[0].mismatches.push({
                        type: "link", pos: 0, seq: "L", query: bin.begins[index][0] + 1 // Dirty fix
                    });
                }
                if (bin.ends[index][0] + 1 !== bin.bin_id + 1 && bin.ends[index][0] !== -1) {
                    sequence_new[0].mismatches.push({
                        type: "link", pos: this.bin_length, seq: "L", query: bin.ends[index][0] + 1 // Dirty fix
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
                    read_id: previous_id,
                    name: bin.path_name, // + ":" + String(previous_id),
                    id: path_unique_id,
                });
            })
        });

        // Merging nodes:
        let previous_read_id = -1;
        let previous_path_unique_id = -1;
        let previous_reads = [];
        let new_reads = [];
        reads.forEach(read => {
            if ((read.id !== previous_path_unique_id || parseInt(read.sequence[0]) !== previous_read_id + 1) && previous_reads.length > 0) {
                new_reads.push({
                    firstNodeOffset: 0,
                    finalNodeCoverLength: previous_reads.length,
                    mapping_quality: 60,
                    is_secondary: false,
                    sequence: previous_reads.map(item => item.sequence[0]),
                    sequenceNew: previous_reads.map(item => item.sequenceNew[0]),
                    type: "read",
                    name: previous_reads[0]["name"],
                    id: previous_path_unique_id,
                })
                previous_path_unique_id = read.id;
                previous_reads = [read];
            } else if ((read.id !== previous_path_unique_id || parseInt(read.sequence[0]) !== previous_read_id + 1) ) {
                previous_path_unique_id = read.id;
                previous_reads = [read];
            } else {
                previous_reads.push(read);
            }
            previous_read_id = parseInt(read.sequence[0]);
        })
        if (previous_reads.length > 0) {
            new_reads.push({
                firstNodeOffset: 0,
                finalNodeCoverLength: this.bin_length * previous_reads.length,
                mapping_quality: 60,
                is_secondary: false,
                sequence: previous_reads.map(item => item.sequence[0]),
                sequenceNew: previous_reads.map(item => item.sequenceNew[0]),
                type: "read",
                name: previous_reads[0].name,
                id: previous_path_unique_id,
            });
        }
        reads = new_reads;

        let tubemap_json = {};
        const nodes = Array.from(new Array(this.max_bin)).map((v, i) => { return { name: String(i + 1), sequenceLength: this.bin_length } }
        );
        tubemap_json["nodes"] = nodes;
        tubemap_json["tracks"] = [{ id: 0, name: "REF", sequence: nodes.map(node => node.name) }];
        tubemap_json["reads"] = reads;

        return tubemap_json
    }

}
