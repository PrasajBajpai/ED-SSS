# ED-SSS
### Event Driven Smart Surveillance System

ED-SSS is a neuromorphic-inspired smart surveillance platform designed to process only meaningful visual events instead of continuously analyzing every video frame.

Unlike traditional CCTV systems that process 100% of incoming frames, ED-SSS generates event streams based on scene activity, reducing redundant computation while improving surveillance efficiency.

The system features real-time event detection, adaptive threshold learning, spike burst analysis, dynamic power scaling, threat assessment, event heatmap generation, and live camera monitoring through asynchronous WebSocket streaming.

## Key Features

- Event-Driven Video Processing
- Real-Time Live Camera Monitoring
- Adaptive Learning Thresholds
- Neuromorphic Memory Layer
- Dynamic Power Scaling
- Threat Assessment Engine
- Event Heatmap Generation
- Spike Burst Detection
- WebSocket-Based Event Streaming
- Interactive Analytics Dashboard

## Problem Statement

Traditional surveillance systems continuously process every frame regardless of whether meaningful activity is present. This leads to unnecessary computation, higher power consumption, and inefficient resource utilization.

ED-SSS addresses this challenge by adopting a neuromorphic-inspired event-driven approach where only significant visual changes generate processing events, enabling smarter and more efficient surveillance.

## Tech Stack

### Frontend
- React.js
- Axios
- CSS

### Backend
- FastAPI
- OpenCV
- NumPy
- WebSockets

## System Pipeline

Video Stream
→ Motion Difference Engine
→ Event Generator
→ Spike Encoder
→ Adaptive Learning Layer
→ Threat Assessment Engine
→ Dashboard & Heatmap Visualization

## Future Enhancements

- Spiking Neural Networks (SNN)
- Multi-Camera Surveillance
- Edge AI Deployment
- YOLO-Based Object Detection
- Neuromorphic Hardware Integration

## Development Team

ED-SSS was designed and developed by:

### Team Members

- Prasaj Bajpai
- Rajat Yadav
- Shantanu Rathod

### Contributions

- **Prasaj Bajpai** – Project Architecture, Full-Stack Development, Neuromorphic System Design, Event Processing Pipeline, Dashboard Development, Integration & Deployment
- **Rajat Yadav** – Research, Literature Review, Problem Analysis, Feature Ideation, Documentation Support
- **Shantanu Rathod** – Testing, Validation, Debugging, System Implementation Support, Performance Evaluation


Project developed as a collaborative hackathon submission focused on Neuromorphic-Inspired Event-Driven Surveillance Systems.

