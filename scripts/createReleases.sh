#!/bin/bash

# This script creates Sentinl 6 packages for the releases below.
# Example:
#     ./createReleases.sh ~/Downloads/6/

releases=(
"6.5.0"
"6.5.1"
"6.5.2"
"6.5.3"
)

for i in "${releases[@]}"
do
	gulp package --version=$i && mv ../target/gulp/sentinl* $1
	# gulp package_nochrome --version=$i && mv ../target/gulp/sentinl* $1
done
