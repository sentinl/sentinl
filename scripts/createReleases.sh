#!/bin/bash

# This script creates Sentinl 5 packages for the releases below.
# Example:
#     ./createReleases.sh ~/Downloads/5-release/

releases=(
"5.0.0"
"5.0.1"
"5.0.1"
"5.0.2"
"5.1.1"
"5.1.2"
"5.2.0"
"5.2.1"
"5.2.2"
"5.3.0"
"5.3.1"
"5.3.2"
"5.3.3"
"5.4.0"
"5.4.1"
"5.4.2"
"5.5.1"
)

for i in "${releases[@]}"
do
	gulp package --version=$i && mv ../target/gulp/sentinl* $1
done
