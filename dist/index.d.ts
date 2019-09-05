export declare class Tubeify {
    private tile;
    private max_bin;
    private bin_length;
    tiles_range: number[];
    constructor(tile: number, max_bin: number, bin_length: number);
    tiles(bin: number): number;
    tubeify(bin_json: any): {};
}
