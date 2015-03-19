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
  var self = this;
  
    this.finishedLoading = function(bufferList){
      currentBufferList = bufferList;
      self.playTheme();
  };
  
  bufferLoader = new BufferLoader(
          audioCtx, ['Sound/clickity.wav',
                     'Sound/chillaxin.mp3'
          ], this.finishedLoading);
  bufferLoader.load();
  
  this.playClick = function(){
      var clickSound = audioCtx.createBufferSource();
      clickSound.buffer = currentBufferList[0];
      clickSound.connect(audioCtx.destination);
      clickSound.start(0);
  };
  
  this.playTheme = function(){
    var theme = audioCtx.createBufferSource();
    theme.buffer = currentBufferList[1];
    theme.connect(audioCtx.destination);
    theme.start(0);
    theme.onended = self.playTheme;
  };
};

PlaymolaAudio.prototype = Object.create(PlaymolaAudio);