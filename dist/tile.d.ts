interface BinRun {
    id: number;
    start: number;
    end: number;
    orientation: boolean;
    before: number;
    after: number;
}
interface Path {
    id: number;
    bin_run: BinRun[];
}
interface Tile {
    tile_id: number;
    paths: Path[];
}
