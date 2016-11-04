(function(){
    'use strict';

    angular.module('myApp', [])
    .controller('MainController', MainController);

    function  MainController() {
        var vm = this;

        var socket = io();
        var localStream;
        var configuration = {'iceServers': [{'url': 'stun:stun.1.google.com.19302'}]};
        var pc = new webkitRTCPeerConnection(configuration);

        vm.login = login;
        vm.username = '';
        vm.createOffer = createOffer;
        vm.peerID = '';

        function login() {
            socket.emit('login', {username: vm.username});
            console.log('login');
        }

        function createOffer() {
            console.log('create offer');
            console.log(localStream);
            pc.addStream(localStream);
            pc.onicecandidate = function(event) {
                console.log('event');
                // console.log(event.candidate);
                if (event.candidate != null) {
                    socket.emit('sendCandidate', {type: 'candidate', candidate: event.candidate});
                }
            };
            pc.onaddStream = function(event) {
                console.log("got remote stream");
                console.log(event.stream);
                var peervideo = document.getElementById('remoteVid');
                peervideo.src = URL.createObjectURL(event.stream);
            }

            pc.createOffer().then(function(offer){
                console.log('creating offer');
                pc.setLocalDescription(offer, function(){
                    socket.emit('sendOffer', {type: 'offer', offer: offer, peerID: vm.peerID, user: vm.username});
                    console.log('offer sent to', vm.peerID);
                });
            });
        }

        socket.on('receiveOffer', function(data) {
            console.log('recieved offer');
            console.log(localStream);
            pc.addStream(localStream);
            pc.onicecandidate = function(event) {
                console.log('event');
                console.log(event.candidate);
                if (event.candidate != null) {
                    socket.emit('sendCandidate', {type: 'candidate', candidate: event.candidate});
                }
            };
            pc.onaddStream = function(event) {
                console.log("got remote stream");
                console.log(event.stream);
                var video = document.getElementById('remoteVid');
                video.src = URL.createObjectURL(event.stream);
            }

            pc.setRemoteDescription(new RTCSessionDescription(data.offer), function(){
                console.log('setRemoteDescription');
                // console.log(data.offer);
                pc.createAnswer().then(function(answer){
                    console.log('createAnswer');
                    // pc.setLocalDescription(answer, function(){
                    //     console.log('setLocalDescription');
                       
                    //     console.log('send answer to', data.user);
                    // });
                    pc.setLocalDescription(answer);
                     socket.emit('sendAnswer', {
                            type: 'answer', 
                            answer: answer, 
                            peerID: data.user
                        });
                },function(error){
                    console.log(error);
                });
            });
        });

        socket.on('userAnswer', function(data){
            console.log('user answer');
            // console.log(data);
            pc.setRemoteDescription(new RTCSessionDescription(data.answer), function(){
                console.log('User answer');
            });
        });

        socket.on('sendCandidate', function(data){
            console.log('candidate');
            // console.log(data.candidate);
            pc.addIceCandidate(new RTCIceCandidate(data.candidate), function(){
                console.log(' addIceCandidate success');
            }, function(error) {
                console.log(' failed to add ICE Candidate' + error.toString());
            });
        });
        

        function hasUserMedia() {
            navigator.getUserMedia = navigator.getUserMedia || 
            navigator.webkitGetUserMedia || 
            navigator.mozGetUserMedia || 
            navigator.msGetUserMedia;

            return !!navigator.getUserMedia;
        }

        if (hasUserMedia()) {
            // navigator.getUserMedia = navigator.getUserMedia ||
            // navigator.webkitGetUserMedia || 
            // navigator.mozGetUserMedia || 
            // navigator.msGetUserMedia;

            navigator.getUserMedia({video: true, audio: true}, function(mediaStream){
                localStream = mediaStream;
                var video = document.getElementById('localVid');

                video.src = window.URL.createObjectURL(localStream);
            }, function (err){});
        } else {
            alert('Error: WebRTC is not supported');
        }
    }
})();