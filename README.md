# Sauerbraten demo expositor

Uses demo-parser JSON results to get some demo info. Can be used as a
library as well.

## Build

Use node.js/npm commands.

## Usage

`main input.json > output.json`

## Output example
```
{
  "players": [
    {
      "cn": 4,
      "names": [
        "=DK=coc"
      ],
      "frags": 16,
      "score": 0
    },
    {
      "cn": 12,
      "names": [
        "|RB|Esca"
      ],
      "frags": 18,
      "score": 2
    },
    {
      "cn": 8,
      "names": [
        "|RB|r4ge"
      ],
      "frags": 15,
      "score": 3
    },
    {
      "cn": 2,
      "names": [
        "=DK=Alkfly"
      ],
      "frags": 6,
      "score": 0
    },
    {
      "cn": 5,
      "names": [
        "=DK=toro"
      ],
      "frags": 9,
      "score": 0
    },
    {
      "cn": 6,
      "names": [
        "|RB|Partizan"
      ],
      "frags": 14,
      "score": 5
    }
  ],
  "map": "luna",
  "mode": "effic ctf",
  "gametime": 528,
  "teams": [
    {
      "team": "good",
      "frags": 31,
      "players": [
        "=DK=Alkfly",
        "=DK=toro",
        "=DK=coc"
      ],
      "score": 0
    },
    {
      "team": "evil",
      "frags": 47,
      "players": [
        "|RB|Partizan",
        "|RB|r4ge",
        "|RB|Esca"
      ],
      "score": 10
    }
  ],
  "file": "json/october-ectf-2022/eu2/2022_10_30_18_10-efficctf-luna.dmo"
}
```
