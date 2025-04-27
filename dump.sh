#!/bin/bash

# Check if password and dump path arguments were provided
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Error: Please provide both the Elasticsearch password and the dump path."
  echo "Usage: $0 <password> <dump_path>"
  exit 1
fi

# Check if the dump path is a directory
if [ ! -d "$2" ]; then
  echo "Error: The provided dump path '$2' is not a directory."
  exit 1
fi

# Dump songs index
docker run --rm --net=host -v "$(realpath "$2")":/tmp -e NODE_TLS_REJECT_UNAUTHORIZED=0 -ti elasticdump/elasticsearch-dump \
  --input=https://elastic:$1@localhost:9200/songs \
  --output=/tmp/songs_mapping.json \
  --type=mapping

docker run --rm --net=host -v "$2":/tmp -e NODE_TLS_REJECT_UNAUTHORIZED=0 -ti elasticdump/elasticsearch-dump \
  --input=https://elastic:$1@localhost:9200/songs \
  --output=/tmp/songs_data.json \
  --type=data

# Dump corpuses index
docker run --rm --net=host -v "$2":/tmp -e NODE_TLS_REJECT_UNAUTHORIZED=0 -ti elasticdump/elasticsearch-dump \
  --input=https://elastic:$1@localhost:9200/corpuses \
  --output=/tmp/corpuses_mapping.json \
  --type=mapping

docker run --rm --net=host -v "$2":/tmp -e NODE_TLS_REJECT_UNAUTHORIZED=0 -ti elasticdump/elasticsearch-dump \
  --input=https://elastic:$1@localhost:9200/corpuses \
  --output=/tmp/corpuses_data.json \
  --type=data

# Dump audio index
docker run --rm --net=host -v "$2":/tmp -e NODE_TLS_REJECT_UNAUTHORIZED=0 -ti elasticdump/elasticsearch-dump \
  --input=https://elastic:$1@localhost:9200/audio \
  --output=/tmp/audio_mapping.json \
  --type=mapping

docker run --rm --net=host -v "$2":/tmp -e NODE_TLS_REJECT_UNAUTHORIZED=0 -ti elasticdump/elasticsearch-dump \
  --input=https://elastic:$1@localhost:9200/audio \
  --output=/tmp/audio_data.json \
  --type=data

echo "Dump complete. Check '$2' for the output files."
