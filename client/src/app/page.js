"use client"
import { useEffect, useRef, useState, useCallback } from 'react';
import io from 'socket.io-client';

const socket = io("http://localhost:8000");

const WebRTC = () => {

  const user1VideoRef = useRef(null);
  const user2VideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const [roomCode, setroomCode] = useState('');

  // =============================== Init ===============================
  // =========================== Step 1 ===========================
  const init = async () => {
    const pc = new RTCPeerConnection();
    // setPeerConnection(pc);
    peerConnectionRef.current = pc;
    console.log("My Id: ", socket.id);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });
    user1VideoRef.current.srcObject = stream;

    const remoteStream = new MediaStream();
    user2VideoRef.current.srcObject = remoteStream;

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };
  };

  // =========================== Step 3 ===========================
  const start = () => {
    socket.emit('Send_RoomJoin_Req', roomCode);
  }



  // =========================== Create Offer ===========================
  // =========================== Step 5 ===========================
  const createOffer = async (id) => {
    console.log("Create Offer");
    // console.log(`remoteid: ${remoteId}`)
    let run = false;
    peerConnectionRef.current.onicecandidate = async (event) => {
      if (event.candidate) {
        const Offer = JSON.stringify(peerConnectionRef.current.localDescription);
        if (!run) {
          socket.emit('Send_Offer', { remoteId: id, Offer });
          // console.log('Send_Offer run');
          run = true;
        }
      }
    };

    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
  };

  // =========================== Create Answer ===========================
  // =========================== Step 7 ===========================
  const createAnswer = useCallback(async ({ id, Offer }) => {
    console.log("Create Ans");
    const receivedOffer = JSON.parse(Offer);
    // console.log("Offer: ", receivedOffer)
    let run = false;
    peerConnectionRef.current.onicecandidate = async (event) => {
      if (event.candidate) {
        if (!run) {
          // console.log('Adding answer candidate...:', event.candidate);
          const Ans = JSON.stringify(peerConnectionRef.current.localDescription);
          socket.emit('Send_Ans', { id, Ans });
          run = true;
        }
      }
    };
    await peerConnectionRef.current.setRemoteDescription(receivedOffer);

    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);
  }, []);

  // =========================== Add Answer ===========================
  // =========================== Step 9 ===========================
  const addAnswer = useCallback(async (Ans) => {
    console.log("Add Ans");
    const receivedAnswer = JSON.parse(Ans);
    // console.log('Add answer triggered');
    // console.log('answer:', receivedAnswer);
    if (!peerConnectionRef.current.remoteDescription) {
      peerConnectionRef.current.setRemoteDescription(receivedAnswer);
    }
  }, []);

  useEffect(() => {
    init();
    socket.on("User_Join", createOffer);
    socket.on("Get_Offer", createAnswer);
    socket.on("Get_Ans", addAnswer);
    return () => {
      socket.off("User_Join", createOffer);
      socket.off("Get_Offer", createAnswer);
      socket.off("Get_Ans", addAnswer);
    }
  }, [socket]);

  return (
    <div>
      <video width="320" height="240" ref={user1VideoRef} autoPlay playsInline />
      <video width="320" height="240" ref={user2VideoRef} autoPlay playsInline />

      {/* =========================== Step 2 =========================== */}
      <input type="text" value={roomCode} onChange={(e) => { setroomCode(e.target.value) }} placeholder='Enter Room Code' />
      <button onClick={start}>Start</button>
    </div>
  );
};

export default WebRTC;