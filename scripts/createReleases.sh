#!/bin/bash

# This script creates Sentinl 6 packages for the releases below.
# Example:
#     ./createReleases.sh ~/Downloads/6/

releases=(
"6.3.0"
"6.3.1"
"6.3.2"
)

for i in "${releases[@]}"
do
	gulp package --version=$i && mv ../target/gulp/sentinl* $1
	# gulp package_nochrome --version=$i && mv ../target/gulp/sentinl* $1
done
