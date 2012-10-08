# Binary-tools

Tools for manipulating binary files

## Installation

```sh
npm install bin-tools -g
```

## Usage

```sh
bin-tools <command> [arguments...]
```

## Commands

### extract <filename> [startOffset]

Extract a .dat file in the current working directory

Caveats :

 * Support the FTL game's .dat format
 * You must specify the offset of the first entry

