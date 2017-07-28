#!/bin/bash

# This script creates Sentinl 5 packages for the releases below.
# Example:
#     ./createReleases.sh ~/Downloads/5-release/

releases=(
"5.5.0"
"5.5.1"
)

for i in "${releases[@]}"
do
	gulp package --version=$i && mv ../target/gulp/sentinl* $1
done
