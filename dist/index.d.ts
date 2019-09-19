export declare class Tubeify {
    private tile;
    private max_bin;
    private bin_length;
    tiles_range: number[];
    constructor(tile: number, bin_length: number, max_bin?: number);
    tiles(bin: number): number;
    tileify(bin_json: any): {};
    tubeify(bin_json: any): {};
}
