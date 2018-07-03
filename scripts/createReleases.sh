#!/bin/bash

# This script creates Sentinl 6 packages for the releases below.
# Example:
#     ./createReleases.sh ~/Downloads/6/

releases=(
"6.0.0"
"6.0.1"
"6.1.0"
"6.1.1"
"6.1.2"
"6.1.3"
"6.2.0"
"6.2.1"
"6.2.2"
"6.2.3"
"6.2.4"
)

for i in "${releases[@]}"
do
	gulp package --version=$i && mv ../target/gulp/sentinl* $1
	# gulp package_nochrome --version=$i && mv ../target/gulp/sentinl* $1
done
