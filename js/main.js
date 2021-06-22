/*
Copyright 2017 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict';

// window.isSecureContext could be used for Chrome
var isSecureOrigin = location.protocol === 'https:' ||
location.host === 'localhost';
if (!isSecureOrigin) {
  alert('getUserMedia() must be run from a secure origin: HTTPS or localhost.' +
    '\n\nChanging protocol to HTTPS');
  location.protocol = 'HTTPS';
}

var constraints;
var mediaStream;
var videoTrack;

var torchButton = document.getElementById('torch');
var canvas = document.getElementById('canvas');
var video = document.getElementById('video');

torchButton.onclick = setTorch;
window.screen.orientation.lock('portrait');
window.onload = runStream();

async function startCamera(){
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => {
      track.stop();
    });
  }
  constraints = {
    audio: false,
    video: {
      facingMode: "environment",
      width: { ideal: 640 },
      height: { ideal: 480 }
    }
  };
  await navigator.mediaDevices.getUserMedia(constraints)
    .then(gotStream)
    .catch(error => {
      console.log('getUserMedia error: ', error);
      document.getElementById('log').textContent += 'getUserMedia error: '+ error;
    });
}

function gotStream(stream) {
  console.log('getUserMedia() got stream: ', stream);
  document.getElementById('log').textContent += 'getUserMedia() got stream: '+ stream;
  mediaStream = stream;
  video.srcObject = stream;
  videoTrack = stream.getVideoTracks()[0];
  const videoSettings = stream.getVideoTracks()[0].getSettings();
  canvas.width = videoSettings.width;
  canvas.height = videoSettings.height;
  console.log('gotStream() width: ', canvas.width);
  console.log('gotStream() height: ', canvas.height);
  document.getElementById('log').textContent += 'gotStream() resolution: '+ canvas.width + ',' + canvas.height;
}

function grabFrame() {
  try{
    console.log('grabFrame() new image');

    canvas.getContext("2d").drawImage(video, 0, 0);

    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
      data[i]     = 255 - data[i];     // red
      data[i + 1] = 255 - data[i + 1]; // green
      data[i + 2] = 255 - data[i + 2]; // blue
    }
    ctx.putImageData(imageData, 0, 0);

  } catch(error) {
    console.log('grabFrame() error: ', error);
    document.getElementById('log').textContent += 'grabFrame() error: '+ error;
  }
}

function setTorch() {
  videoTrack.applyConstraints({
    advanced: [{torch: true}]
  }).catch(function(error) {
    console.log('setTorch() error: ', error);
    document.getElementById('log').textContent += 'setTorch() error: '+ error;
  });
}

async function runStream() {
  await startCamera();
  setInterval(grabFrame, 50);
}