#!/usr/bin/env bash

if [ ! -z "$1" ]
then
  # Run yanger with the input file $1
  dir=$(dirname $1)
  fname=$(basename $1 .yang)

  yanger -p $dir -f jsoninfo -o $jsoninfo.json $1
fi

python -m SimpleHTTPServer 8000 &

open http://localhost:8000
