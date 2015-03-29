/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;
  this.currentTrack;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  // Load buffer asynchronously
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var loader = this;

  request.onload = function() {
    // Asynchronously decode the audio file data in request.response
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length)
          loader.onload(loader.bufferList);
      },
      function(error) {
        console.error('decodeAudioData error', error);
      }
    );
  }

  request.onerror = function() {
    alert('BufferLoader: XHR error');
  }

  request.send();
}

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.urlList.length; ++i)
  this.loadBuffer(this.urlList[i], i);
}


PlaymolaAudio = function(){
  var AudioContext = window.AudioContext || window.webkitAudioContext;  
  var audioCtx = new AudioContext();
  var bufferLoader;
  var currentBufferList;
  var weldSound;
  var self = this;
  
    this.finishedLoading = function(bufferList){
      currentBufferList = bufferList;
      self.playTheme();
  };
  
  bufferLoader = new BufferLoader(
          audioCtx, ['Sound/clickity.wav',
                     'Sound/chillaxin.mp3',
                     'Sound/weld.mp3',
                     'Sound/clinkclonk.mp3',
                     'Sound/ERROR.wav'
          ], this.finishedLoading);
  bufferLoader.load();
  
  this.playClick = function(){
      var clickSound = audioCtx.createBufferSource();
      clickSound.buffer = currentBufferList[0];
      clickSound.connect(audioCtx.destination);
      clickSound.start(0);
  };
  
  this.playWelding = function(){
      weldSound = audioCtx.createBufferSource();
      weldSound.buffer = currentBufferList[2];
      weldSound.connect(audioCtx.destination);
      weldSound.start(0);
  }
  
  this.stopWelding = function(){
      weldSound.stop(0);
  }
  
    this.playError = function(){
      var errorSound = audioCtx.createBufferSource();
      errorSound.buffer = currentBufferList[4];
      errorSound.connect(audioCtx.destination);
      errorSound.start(0);
  }
  
  this.stopMusic = function(){
      self.currentTrack.onended = null;
      self.currentTrack.stop();
  };
  
  this.playTheme = function(){
    var theme = audioCtx.createBufferSource();
    theme.buffer = currentBufferList[1];
    theme.connect(audioCtx.destination);
    theme.start(0);
    self.currentTrack = theme;
    theme.onended = self.playTheme;
  };
  
  this.playSimulate = function() {
    var simulTune = audioCtx.createBufferSource();
    simulTune.buffer = currentBufferList[3];
    simulTune.connect(audioCtx.destination);
    simulTune.start(0);
    self.currentTrack = simulTune;
    simulTune.onended = self.playSimulate;
  };
  
  
};

PlaymolaAudio.prototype = Object.create(PlaymolaAudio);