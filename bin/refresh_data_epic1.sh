#!/bin/bash

# Assumes nih-cfde/api running on localhost
API=http://localhost:5000
OUTPUT_DIR=$1

if [ -z $OUTPUT_DIR ]; then
  echo "$0 <output dir>"
  exit
fi

# JSON files with DCC summary info
DCCS=(
  HMP
  LINCS
  4DN
  Metabolomics
  KidsFirst
)

for DCC in "${DCCS[@]}"; do
    mkdir ${OUTPUT_DIR}/${DCC}
    ENDPOINT=dcc/${DCC}
    echo $API/$ENDPOINT
    curl -s -X GET $API/$ENDPOINT > ${OUTPUT_DIR}/${DCC}/${DCC}-summary.json
    ENDPOINT=dcc/${DCC}/projects
    echo $API/$ENDPOINT
    curl -s -X GET $API/$ENDPOINT > ${OUTPUT_DIR}/${DCC}/${DCC}-projects.json
    ENDPOINT=dcc/${DCC}/filecount
    echo $API/$ENDPOINT
    curl -s -X GET $API/$ENDPOINT > ${OUTPUT_DIR}/${DCC}/${DCC}-filecount.json
    ENDPOINT=dcc/${DCC}/linkcount
    echo $API/$ENDPOINT
    curl -s -X GET $API/$ENDPOINT > ${OUTPUT_DIR}/${DCC}/${DCC}-linkcount.json
done

# Retrieve ~80 JSON files for stacked bar graphs and donut charts

MAX1=12
MAX2=5

VARS=(
  files
  volume
  samples
  subjects
)

DIMENSIONS=(
  dcc
  data_type
  anatomy
  assay
  species
)

for VAR in "${VARS[@]}"; do
  for D1 in "${DIMENSIONS[@]}"; do
     for D2 in "${DIMENSIONS[@]}"; do
        if [ $D1 != $D2 ]; then
	    # limit max groups1/groups2
            ENDPOINT=stats/${VAR}/${D1}/${MAX1}/${D2}/${MAX2}
	    # no max limit on groups1/groups2
	    #ENDPOINT=stats/${VAR}/${D1}/${D2}
            echo $API/$ENDPOINT
            curl -s -X GET $API/$ENDPOINT > ${OUTPUT_DIR}/${VAR}-${D1}-${D2}.json
        fi
    done
  done
done
