export class Tubeify {
    private tile: number; // # of tiles in output. One tile corresponds to one bin if tiles === -1.
    private max_bin: number; // # of bins in input.
    private bin_length: number; // Nucleotide length of each bins.
    private tiles_range: number[]; // e.g. [0, 5, 10, 15, 20] according to max_bin and tile.

    constructor(tile: number, max_bin: number, bin_length: number) {
        this.tile = tile;
        this.max_bin = max_bin;
        this.tiles_range = tile === -1 ? 
            Array.from(new Array(this.max_bin)).map((v,i) => i) : 
            Array.from(new Array(tile)).map((v,i) => Math.round(max_bin * i / tile));
        this.bin_length = bin_length || 0;

    }

    tubeify(bin_json: any) {
        let reads = []
        let paths = {}
        let path_starts = {}
        bin_json.forEach(bin => {
            if (paths[bin.name] === undefined) {
                paths[bin.name] = {}
            }
            paths[bin.name][bin.bin] = bin
            if (bin.prev_bin[0] === -1) {
                path_starts[bin.name] = bin.bin
            }
        });

        Object.keys(paths).forEach(path_name => {
            let path_hash = paths[path_name];
            let current_bin = -1;
        })


        let previous_id = -1;
        let previous_bin = -1;
        bin_json.forEach(bin => {
            if (previous_bin !== bin.path_name) {
                previous_id = 0
                previous_bin = bin.path_name
            } else { 
                previous_id += 1
            }
            let sequence_new = []
            // console.log(bin)
            if (bin.prev_bin[0] !== bin.bin - 1) {
                sequence_new.push({type: "link", pos:0, seq: "translocation", query: bin.prev_bin[0] })
            }
            if (bin.next_bin[0] !== bin.bin + 1) {
                sequence_new.push({type: "link", pos:this.bin_length, seq: "translocation", query: bin.next_bin[0] })
            }
            reads.push({
                firstNodeOffset: 0,
                finalNodeCoverLength: this.bin_length,
                sequenceQuality: 60,
                is_secondary: false,
                Sequence: [bin.bin],
                Sequence_new: sequence_new,
                type: "read",
                name: bin.path_name,
                id: previous_id
           })
       })

        let tubemap_json = {};
        const nodes = Array.from(new Array(this.max_bin)).map((v,i) => 
            {return {name: String(i+1), sequenceLength: this.bin_length}}
        )
        tubemap_json["nodes"] = nodes;
        tubemap_json["paths"] = [{id: 0, name: "1", sequence: nodes.map(node => node.name)}]
        tubemap_json["reads"] = reads;

        return tubemap_json
    }

}
