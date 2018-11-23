#!/bin/bash

# This script creates Sentinl 6 packages for the releases below.
# Example:
#     ./createReleases.sh ~/Downloads/6/

releases=(
"5.6.0"
"5.6.1"
"5.6.2"
"5.6.3"
"5.6.4"
"5.6.5"
"5.6.6"
"5.6.7"
"5.6.8"
"5.6.9"
)

for i in "${releases[@]}"
do
	gulp package --version=$i && mv ../target/gulp/sentinl* $1
	# gulp package_nochrome --version=$i && mv ../target/gulp/sentinl* $1
done
