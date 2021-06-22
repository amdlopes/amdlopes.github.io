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

// This code is adapted from
// https://cdn.rawgit.com/Miguelao/demos/master/imagecapture.html

// window.isSecureContext could be used for Chrome
var isSecureOrigin = location.protocol === 'https:' ||
location.host === 'localhost';
if (!isSecureOrigin) {
  alert('getUserMedia() must be run from a secure origin: HTTPS or localhost.' +
    '\n\nChanging protocol to HTTPS');
  location.protocol = 'HTTPS';
}

var constraints;
var imageCapture;
var mediaStream;
var videoTrack;

var streamButton = document.querySelector('button#stream');
var torchButton = document.querySelector('button#torch');

var canvas = document.querySelector('canvas');
var img = document.querySelector('img');
var video = document.querySelector('video');
var videoSelect = document.querySelector('select#videoSource');

streamButton.onclick = runStream;
torchButton.onclick = setTorch;
videoSelect.onchange = getStream;

// Get a list of available media input (and output) devices
// then get a MediaStream for the currently selected input device
navigator.mediaDevices.enumerateDevices()
  .then(gotDevices)
  .catch(error => {
    console.log('enumerateDevices() error: ', error);
    document.getElementById('log').textContent += 'enumerateDevices() error: ' + error + '\n';
  })
  .then(getStream)

// From the list of media devices available, set up the camera source <select>,
// then get a video stream from the default camera source.
function gotDevices(deviceInfos) {
  for (var i = 0; i !== deviceInfos.length; ++i) {
    var deviceInfo = deviceInfos[i];
    console.log('Found media input or output device: ', deviceInfo);
    document.getElementById('log').textContent += 'Found media input or output device: ' + deviceInfo + '\n';
    var option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || 'Camera ' + (videoSelect.length + 1);
      videoSelect.appendChild(option);
    }
  }
}

// Get a video stream from the currently selected camera source.
function getStream() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => {
      track.stop();
    });
  }
  var videoSource = videoSelect.value;
  constraints = {
    video: {deviceId: videoSource ? {exact: videoSource} : undefined}
  };
  await navigator.mediaDevices.getUserMedia(constraints)
    .then(gotStream)
    .catch(error => {
      console.log('getUserMedia error: ', error);
      document.getElementById('log').textContent += 'getUserMedia error: '+ error + '\n';
    });
}

// Display the stream from the currently selected camera source, and then
// create an ImageCapture object, using the video from the stream.
function gotStream(stream) {
  console.log('getUserMedia() got stream: ', stream);
  document.getElementById('log').textContent += 'getUserMedia() got stream: '+ stream + '\n';
  mediaStream = stream;
  video.srcObject = stream;
  //video.classList.remove('hidden');
  videoTrack = stream.getVideoTracks()[0];
  imageCapture = new ImageCapture(videoTrack);
  getCapabilities();
}

// Get the PhotoCapabilities for the currently selected camera source.
function getCapabilities() {
  imageCapture.getPhotoCapabilities().then(function(capabilities) {
    console.log('Camera capabilities:', capabilities);
    document.getElementById('log').textContent += 'Camera capabilities:' + capabilities + '\n';
  }).catch(function(error) {
    console.log('getCapabilities() error: ', error);
    document.getElementById('log').textContent += 'getCapabilities() error: '+ error + '\n';
  });
}

// Get an ImageBitmap from the currently selected camera source and
// display this with a canvas element.
function grabFrame() {
  imageCapture.grabFrame().then(function(imageBitmap) {
    console.log('Grabbed frame:', imageBitmap);
    document.getElementById('log').textContent += 'Grabbed frame:' + imageBitmap + '\n';
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    canvas.getContext('2d').drawImage(imageBitmap, 0, 0);

    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
      data[i]     = 255 - data[i];     // red
      data[i + 1] = 255 - data[i + 1]; // green
      data[i + 2] = 255 - data[i + 2]; // blue
    }
    ctx.putImageData(imageData, 0, 0);

    canvas.classList.remove('hidden');
  }).catch(function(error) {
    console.log('grabFrame() error: ', error);
    document.getElementById('log').textContent += 'grabFrame() error: '+ error + '\n';
  });
}

function setTorch() {
  videoTrack.applyConstraints({
    advanced: [{torch: true}]
  }).catch(function(error) {
    console.log('setTorch() error: ', error);
    document.getElementById('log').textContent += 'setTorch() error: '+ error + '\n';
  });
}

function printConstraints() {
  var constraints = navigator.mediaDevices.getSupportedConstraints();
  document.getElementById('constraintsLabel').innerHTML = JSON.stringify(constraints);
}

function runStream() {
  setInterval(grabFrame, 50);
}