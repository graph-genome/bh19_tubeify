interface BinRun {
  id: number;
  start: number;
  end: number;
  orientation: boolean;
  before: number;
  after: number;
}

interface Path {
  id: number; // Global ID
  bin_run: BinRun[];
}

interface Tile {
  tile_id: number;
  paths: Path[];
}

interface Read {
  firstNodeOffset: number;
  finalNodeCoverLength: number;
  mapping_quality: number;
  is_secondary: boolean;
  sequence: ["Layout"];
  sequenceNew: any;
  type: "read";
  read_id: number;
  id: number;
}
  