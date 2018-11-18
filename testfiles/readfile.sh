#!/usr/bin/env bash

httpc get "http://localhost:8080/file_input" -v
sleep 8
httpc get "http://localhost:8080/file_input" -v
