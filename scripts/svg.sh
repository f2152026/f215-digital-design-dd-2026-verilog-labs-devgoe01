#!/usr/bin/env bash
set -e

LAB="$1"
NAME="$2"

if [ -z "$LAB" ] || [ -z "$NAME" ]; then
  echo "Usage: svg.sh <lab-folder> <artefact-name>"
  exit 1
fi

VCD="artefacts/${LAB}/${NAME}.vcd"
SVG="artefacts/${LAB}/${NAME}.svg"

if [ ! -f "$VCD" ]; then
  echo "Error: $VCD not found"
  exit 1
fi

vcd2svg "$VCD" "$SVG"
echo "Generated $SVG"
