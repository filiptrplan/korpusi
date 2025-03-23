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

# Import songs index
docker run --rm --net=host -v "$2":/tmp -e NODE_TLS_REJECT_UNAUTHORIZED=0 -ti elasticdump/elasticsearch-dump \
  --input=/tmp/songs_mapping.json \
  --output=https://elastic:$1@localhost:9200/songs \
  --type=mapping

docker run --rm --net=host -v "$2":/tmp -e NODE_TLS_REJECT_UNAUTHORIZED=0 -ti elasticdump/elasticsearch-dump \
  --input=/tmp/songs_data.json \
  --output=https://elastic:$1@localhost:9200/songs \
  --type=data

# Import corpuses index
docker run --rm --net=host -v "$2":/tmp -e NODE_TLS_REJECT_UNAUTHORIZED=0 -ti elasticdump/elasticsearch-dump \
  --input=/tmp/corpuses_mapping.json \
  --output=https://elastic:$1@localhost:9200/corpuses \
  --type=mapping

docker run --rm --net=host -v "$2":/tmp -e NODE_TLS_REJECT_UNAUTHORIZED=0 -ti elasticdump/elasticsearch-dump \
  --input=/tmp/corpuses_data.json \
  --output=https://elastic:$1@localhost:9200/corpuses \
  --type=data

# Import audio index
docker run --rm --net=host -v "$2":/tmp -e NODE_TLS_REJECT_UNAUTHORIZED=0 -ti elasticdump/elasticsearch-dump \
  --input=/tmp/audio_mapping.json \
  --output=https://elastic:$1@localhost:9200/audio \
  --type=mapping

docker run --rm --net=host -v "$2":/tmp -e NODE_TLS_REJECT_UNAUTHORIZED=0 -ti elasticdump/elasticsearch-dump \
  --input=/tmp/audio_data.json \
  --output=https://elastic:$1@localhost:9200/audio \
  --type=data

echo "Import complete. Check your Elasticsearch instance for the imported data."
