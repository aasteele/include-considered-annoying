#!/usr/bin/env bash
# Handle ctrl-c for killing process
trap "kill 0" EXIT

if [ ! -z "$1" ]
then
  # Run yanger with the input file $1
  dir=$(dirname $1)
  fname=$(basename $1 .yang)

  yanger -p $dir -f jsoninfo -o jsoninfo.json $1
fi

python3 -m http.server 8000 &

if [[ "$OSTYPE" == "linux-gnu" ]]; then
  xdg-open http://localhost:8000
elif [[ "$OSTYPE" == "darwin"* ]]; then
  open http://localhost:8000
fi

wait
