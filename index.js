import 'babel-polyfill'

import * as faceAPI from 'face-api.js';
import './style.css';

const video = document.querySelector('video');
const [videoCanvas, drawCanvas] = document.querySelectorAll('canvas');
const videoCtx = videoCanvas.getContext('2d');
const drawCtx = drawCanvas.getContext('2d');

let lastTime = 0;

let backgroundHue = 0;
const root = document.documentElement;

(async () => {
    const webcam = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
    });

    await faceAPI.nets.ssdMobilenetv1.loadFromUri('/models/ssd_mobilenetv1');
    await faceAPI.nets.faceExpressionNet.loadFromUri('/models/face_expression');

    video.srcObject = webcam;
    video.play();

    requestAnimationFrame(drawFrame);
})()

let detections = [];

const emojiMap = {
    angry: '😡',
    disgusted: '🤮',
    fearful: '🐱‍🐉',
    happy: '💩',
    neutral: '😐',
    sad: '😢',
    surprised: '🙀'
};

const drawFrame = (time) => {
    const dt = time - lastTime;
    lastTime = time;
    requestAnimationFrame(drawFrame);

    backgroundHue += dt * 0.0000001;
    root.style.setProperty('--backgroundColorHue', `${backgroundHue}deg`);

    const {videoWidth: width, videoHeight: height} = video;
    if (width === 0 || height === 0) {
        return;
    }

    videoCanvas.width = width;
    videoCanvas.height = height;

    drawCanvas.width = width;
    drawCanvas.height = height;

    faceAPI.matchDimensions(videoCanvas, {width, height});
    
    videoCtx.drawImage(video, 0, 0, width, height);
  
    faceAPI.detectAllFaces(videoCanvas).withFaceExpressions().then(newDetections => {
        detections = newDetections;
    });

    detections.forEach(({detection, expressions}) => {
        const {box: {x, y, width}} = detection;
        drawCtx.font = `${width * 1.5}px wingdings`;
        const [highestExpression] = Object.entries(expressions).reduce(([maxKey, maxVal], [curKey, curVal]) => curVal > maxVal ? [curKey, curVal] : [maxKey, maxVal], ['none', 0]);
        const emoji = emojiMap[highestExpression];
        drawCtx.fillText(emoji, x - width / 2, y + width);
    })
}