#!/bin/bash

httpc get "http://localhost:8080/file_input" -v
sleep 10
httpc post -d "Hey, I'm unavailable at the moment. Leave your number after the thing." "http://localhost:8080/file_input" -v