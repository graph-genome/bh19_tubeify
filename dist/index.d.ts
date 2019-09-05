export declare class Tubeify {
    private tile;
    private max_bin;
    private bin_length;
    private tiles_range;
    constructor(tile: number, max_bin: number, bin_length: number);
    tiled(bin: number): void;
    tubeify(bin_json: any): {};
}
