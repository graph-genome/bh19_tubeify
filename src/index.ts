
export class Tubeify {
    private tile: number; // # of tiles in output. One tile corresponds to one bin if tiles === -1.
    private max_bin: number; // # of bins in input.
    private bin_length: number; // Nucleotide length of each bins.

    constructor(tile: number, bin_length: number, max_bin: number) {
        this.tile = tile;
        this.max_bin = max_bin;
        this.bin_length = bin_length || 0;
    }

    tileify(bin_json: any){
        let matrix: Read[] = [];
        let id_count = 0;
        // Create reads for every contiguous segment of bins within a Path
        bin_json.forEach((
            path: {"sample_name":string,"path_name":string,
                "bins": number[][], "links": [number,number][]}, path_i: number) =>
        { // For one Path
            let temporary_reads: Read[] = [];
            let first_node_offset = path.bins[0][0];
            let previous_bin_id = path.bins[0][0] - 1;

            // Iterate bins and look at id
            path.bins.forEach(bin => {
                // For each contiguous range, make a Read
                if (bin[0] === previous_bin_id + 1) {// Contiguous from the previous bin: do nothing
                } else {// Not contiguous: Create a new read.
                    temporary_reads.push(newRead(first_node_offset, previous_bin_id, path, id_count++));
                    first_node_offset = bin[0];
                }
                previous_bin_id = bin[0];
                this.max_bin = Math.max(this.max_bin, previous_bin_id + 1);  // make sure it's correct.
                //TODO: if this.max_bin ever updates, we need to recompute tiles_range
            });
            temporary_reads.push(newRead(first_node_offset, previous_bin_id, path, id_count++));

            // Links: inside of one read:   
            // Input Example:  [ 5, 10]  meaning bins 5 and 10 are connected
            path["links"].forEach((link) => {
                let distance = Math.abs(link[0] - link[1]);
                if(distance > 20) { //Don't create internal links, that defeats the point of binning
                    //if(link[0] > link[1]) { //less common case of links going against the grain
                    let index = binary_search(link[0], temporary_reads);
                    temporary_reads[index].sequenceNew[0].mismatches.push({
                        type: "link", query: link[1], seq: "L",
                        pos: link[0]  //absolute - temporary_reads[index].firstNodeOffset
                    });
                    //make second link bidirectional
                    if (link[0] !== 0 && link[1] !== 0) {
                        let buddy = binary_search(link[1], temporary_reads);
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
            nodes: [{"name": "Layout", "sequenceLength": this.max_bin}],
            tracks: [{id: 0, name: "REF", indexOfFirstBase: 0, sequence: ["Layout"]}],
            reads: matrix
        };

        function newRead(first_node_offset: number, previous_bin_id: number, path: {path_name:string}, path_i: number): Read {
            // Placeholder of sequence_new.
            let stub = [{nodeName: "Layout", mismatches: []}];

            return {
                firstNodeOffset: first_node_offset,
                finalNodeCoverLength: previous_bin_id ,//absolute within one node //- first_node_offset +1, //inclusive
                mapping_quality: hashCode(path.path_name) % 100,// first_node_offset % 100, //stable color
                is_secondary: false,
                sequence: ["Layout"],
                sequenceNew: stub,
                type: "read",
                name: path.path_name,
                id: path_i
            };
        }
        function binary_search(target: number, sorted_data: Read[]){
            // d=data, t=target, s=start, e=end, m=middle
            function binarySearch(d: Read[], t: number, s: number, e: number): number {
                //d[i][0] is the bin_id we are sorted and searching for
                const m = Math.floor((s + e) / 2);
                if (t === d[m].firstNodeOffset || m === e) return m;
                if (e - 1 === s) return d[e].firstNodeOffset === t ? e : s;  //return first read, unless e is exact match
                if (t > d[m].firstNodeOffset) return binarySearch(d, t, m, e);
                if (t < d[m].firstNodeOffset) return binarySearch(d, t, s, m);
                return -1; // should be unreachable if data is populated
            }
            return binarySearch(sorted_data, target, 0, sorted_data.length-1)
        }

    }
/*
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
*/
}

export function hashCode(obj: string): number{
    //https://stackoverflow.com/a/8076436/3067894
    var hash = 0;
    for (var i = 0; i < obj.length; i++) {
        var character = obj.charCodeAt(i);
        hash = ((hash<<5)-hash)+character;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}