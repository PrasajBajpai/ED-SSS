from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import cv2
import os
import asyncio
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

neuromorphic_memory = {
    "total_videos_analyzed": 0,
    "total_events_seen": 0,
    "avg_motion_threshold": 10.0,
    "learned_baseline": 0.0,
}


@app.get("/")
def home():
    return {"message": "ED-SSS Backend Running"}


@app.get("/heatmap")
def get_heatmap():
    heatmap_path = os.path.join(UPLOAD_FOLDER, "heatmap.jpg")
    if os.path.exists(heatmap_path):
        return FileResponse(heatmap_path)
    return {"error": "Heatmap not found"}


@app.get("/memory")
def get_memory():
    return neuromorphic_memory


@app.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json({"status": "connecting", "message": "Camera starting..."})
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    if not cap.isOpened():
        await websocket.send_json({"error": "Camera Not Found"})
        await websocket.close()
        return
    await websocket.send_json({"status": "connecting", "message": "Camera opened..."})
    total_frames = 0
    events = 0
    prev = None
    for _ in range(5):
        ret, prev = cap.read()
        if ret and prev is not None:
            break
        await asyncio.sleep(0.3)
    if prev is None:
        await websocket.send_json({"error": "Cannot Read Camera"})
        await websocket.close()
        cap.release()
        return
    await websocket.send_json({"status": "connecting", "message": "Live stream starting..."})
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                await asyncio.sleep(0.1)
                continue
            total_frames += 1
            gray1 = cv2.cvtColor(prev, cv2.COLOR_BGR2GRAY)
            gray2 = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            diff = cv2.absdiff(gray1, gray2)
            motion_score = float(diff.mean())
            event_detected = motion_score > 10
            if event_detected:
                events += 1
            reduction = ((total_frames - events) / total_frames) * 100
            await websocket.send_json({
                "frames_processed": total_frames,
                "events_detected": events,
                "spikes_generated": events,
                "event_detected": event_detected,
                "motion_score": round(motion_score, 2),
                "energy_saved": round(reduction * 0.9, 2),
                "reduction_percent": round(reduction, 2)
            })
            prev = frame
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        print("CLIENT DISCONNECTED")
    except Exception as e:
        print("WS ERROR:", str(e))
    finally:
        cap.release()
        print("CAMERA RELEASED")


@app.post("/analyze")
async def analyze_video(file: UploadFile = File(...)):
    global neuromorphic_memory

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(filepath, "wb") as buffer:
        buffer.write(await file.read())

    cap = cv2.VideoCapture(filepath)
    total_frames = 0
    events = 0
    motion_scores = []
    spike_timeline = []

    ret, prev = cap.read()
    if not ret:
        cap.release()
        return {"error": "Unable to read video"}

    gray_prev = cv2.cvtColor(prev, cv2.COLOR_BGR2GRAY)
    heatmap = np.zeros_like(gray_prev, dtype=np.float32)
    adaptive_threshold = neuromorphic_memory["avg_motion_threshold"]

    spike_bursts = 0
    consecutive_events = 0
    burst_log = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        total_frames += 1
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        diff = cv2.absdiff(gray_prev, gray)
        motion_score = float(diff.mean())
        motion_scores.append(motion_score)
        heatmap += diff

        spike_timeline.append({
            "frame": total_frames,
            "score": round(motion_score, 2),
            "spike": motion_score > adaptive_threshold
        })

        if motion_score > adaptive_threshold:
            events += 1
            consecutive_events += 1
            if consecutive_events >= 3:
                spike_bursts += 1
                burst_log.append(total_frames)
        else:
            consecutive_events = 0

        gray_prev = gray

    cap.release()

    avg_motion = float(np.mean(motion_scores)) if motion_scores else 0

    if avg_motion < 5:
        power_mode = "ULTRA LOW POWER"
        power_usage = 10
    elif avg_motion < 15:
        power_mode = "LOW POWER"
        power_usage = 30
    elif avg_motion < 30:
        power_mode = "MEDIUM POWER"
        power_usage = 60
    else:
        power_mode = "HIGH POWER"
        power_usage = 90

    power_saved = 100 - power_usage

    # Threat Level
    spike_ratio = (events / total_frames) if total_frames > 0 else 0
    if spike_ratio < 0.1:
        threat_level = "LOW"
    elif spike_ratio < 0.3:
        threat_level = "MEDIUM"
    elif spike_ratio < 0.6:
        threat_level = "HIGH"
    else:
        threat_level = "CRITICAL"

    heatmap = cv2.normalize(heatmap, None, 0, 255, cv2.NORM_MINMAX)
    heatmap = heatmap.astype(np.uint8)
    heatmap_color = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
    heatmap_path = os.path.join(UPLOAD_FOLDER, "heatmap.jpg")
    cv2.imwrite(heatmap_path, heatmap_color)

    reduction = ((total_frames - events) / total_frames * 100) if total_frames > 0 else 0

    neuromorphic_memory["total_videos_analyzed"] += 1
    neuromorphic_memory["total_events_seen"] += events
    neuromorphic_memory["learned_baseline"] = round(avg_motion, 2)
    neuromorphic_memory["avg_motion_threshold"] = round(
        (neuromorphic_memory["avg_motion_threshold"] * 0.7) + (avg_motion * 0.3), 2
    )

    # Timeline sample — har frame nahi bhejenge, max 100 points
    step = max(1, total_frames // 100)
    sampled_timeline = spike_timeline[::step]

    return {
        "frames_processed": total_frames,
        "events_detected": events,
        "spikes_generated": events,
        "energy_saved": round(reduction * 0.9, 2),
        "reduction_percent": round(reduction, 2),
        "heatmap_url": "http://127.0.0.1:8000/heatmap",
        "spike_bursts": spike_bursts,
        "burst_frames": burst_log[:5],
        "power_mode": power_mode,
        "power_usage_percent": power_usage,
        "power_saved_percent": power_saved,
        "adaptive_threshold": round(adaptive_threshold, 2),
        "videos_analyzed": neuromorphic_memory["total_videos_analyzed"],
        "learned_baseline": neuromorphic_memory["learned_baseline"],
        "memory_updated": True,
        "threat_level": threat_level,
        "spike_timeline": sampled_timeline
    }