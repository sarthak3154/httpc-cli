#!/bin/bash

httpc post -d "{hello test post}" "http://localhost:8080/file_input" -v
httpc post -d "{Hey, what's up buddy?}" "http://localhost:8080/file_input" -v