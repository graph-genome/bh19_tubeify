# bh19_tubeify

This repository serves as a temporary storage for the backend part developed at the BioHackathon 2019.

## How to run

Tubeify can use as both a CLI tool and a JavaScript library.

```bash
node install -g csv2json
csv2json -t tests/test.tsv  > tests/test.json
npm run build
node cli.js -j tests/test.json -b 25 -l 1000 -t -1
```
