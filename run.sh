#!/usr/bin/env bash
# Handle ctrl-c for killing process
trap "kill 0" EXIT

if [[ ! -z "$1" ]]; then
  # Run yanger with the input file $1
  dir=$(dirname $1)
  fname=$(basename $1 .yang)
  path=${dir}

  # Make sure we're messing with directories at all
  if [[ ! -z "$2" ]]; then
    # If we want to recursively include every single folder in the third argument
    if [[ $2 = "-r" ]]; then
      du_dir=$(du $3)
      for i in ${du_dir}; do
        # Check if it's a number, if so ignore it
        re='^[0-9]+$'
        if ! [[ ${i} =~ $re ]]; then
          path="${path}:${i}"
        fi
      done
    else
      # Just include the directories that the user lists
      # Get all args except the first
      for i in "${@:2}"; do
         path="${path}:${i}"
      done
    fi
  fi

  yanger -p ${path} -f jsoninfo $1 > jsoninfo.json
fi

python3 -m http.server 8000 &

if [[ "$OSTYPE" == "linux-gnu" ]]; then
  xdg-open http://localhost:8000
elif [[ "$OSTYPE" == "darwin"* ]]; then
  open http://localhost:8000
fi

wait
