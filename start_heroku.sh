#!/bin/bash

echo "Starting AI Engine internally on port 8000..."
cd ai_engine
# Use uvicorn directly. Since Java uses $PORT, we hardcode Python to 8000.
uvicorn main:app --host 0.0.0.0 --port 8000 &
cd ..

echo "Starting Java Backend on $PORT with memory constraints..."
java -Xmx300m -Xss512k -XX:CICompilerCount=2 -Dfile.encoding=UTF-8 -Dserver.port=$PORT -jar backend/target/medisync-0.0.1-SNAPSHOT.jar
