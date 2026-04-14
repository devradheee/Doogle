import { useRouter } from "next/router";
import { useCallback, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import useSocket from "../../hooks/useSocket";

const ICE_SERVERS = {
  iceServers: [
    {
      urls: "stun:openrelay.metered.ca:80",
    },
  ],
};

const Room = () => {
  useSocket();

  const router = useRouter();
  const userVideoRef = useRef();
  const peerVideoRef = useRef();
  const rtcConnectionRef = useRef(null);
  const socketRef = useRef();
  const userStreamRef = useRef();
  const hostRef = useRef(false);

  const { id: roomName } = router.query;

  const handleTrackEvent = useCallback((event) => {
    peerVideoRef.current.srcObject = event.streams[0];
  }, []);

  const handleICECandidateEvent = useCallback(
    (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice-candidate", event.candidate, roomName);
      }
    },
    [roomName]
  );

  const createPeerConnection = useCallback(() => {
    const connection = new RTCPeerConnection(ICE_SERVERS);
    connection.onicecandidate = handleICECandidateEvent;
    connection.ontrack = handleTrackEvent;
    return connection;
  }, [handleICECandidateEvent, handleTrackEvent]);

  const handleRoomCreated = useCallback(() => {
    hostRef.current = true;
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: { width: 500, height: 500 },
      })
      .then((stream) => {
        userStreamRef.current = stream;
        userVideoRef.current.srcObject = stream;
        userVideoRef.current.onloadedmetadata = () => {
          userVideoRef.current.play();
        };
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const handleRoomJoined = useCallback(() => {
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: { width: 500, height: 500 },
      })
      .then((stream) => {
        userStreamRef.current = stream;
        userVideoRef.current.srcObject = stream;
        userVideoRef.current.onloadedmetadata = () => {
          userVideoRef.current.play();
        };
        socketRef.current.emit("ready", roomName);
      })
      .catch((err) => {
        console.log("error", err);
      });
  }, [roomName]);

  const initiateCall = useCallback(() => {
    if (!hostRef.current) {
      return;
    }

    rtcConnectionRef.current = createPeerConnection();
    rtcConnectionRef.current.addTrack(
      userStreamRef.current.getTracks()[0],
      userStreamRef.current
    );
    rtcConnectionRef.current.addTrack(
      userStreamRef.current.getTracks()[1],
      userStreamRef.current
    );

    rtcConnectionRef.current
      .createOffer()
      .then((offer) => {
        rtcConnectionRef.current.setLocalDescription(offer);
        socketRef.current.emit("offer", offer, roomName);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [createPeerConnection, roomName]);

  const handleReceivedOffer = useCallback(
    (offer) => {
      if (hostRef.current) {
        return;
      }

      rtcConnectionRef.current = createPeerConnection();
      rtcConnectionRef.current.addTrack(
        userStreamRef.current.getTracks()[0],
        userStreamRef.current
      );
      rtcConnectionRef.current.addTrack(
        userStreamRef.current.getTracks()[1],
        userStreamRef.current
      );
      rtcConnectionRef.current.setRemoteDescription(offer);

      rtcConnectionRef.current
        .createAnswer()
        .then((answer) => {
          rtcConnectionRef.current.setLocalDescription(answer);
          socketRef.current.emit("answer", answer, roomName);
        })
        .catch((error) => {
          console.log(error);
        });
    },
    [createPeerConnection, roomName]
  );

  const handleAnswer = useCallback((answer) => {
    rtcConnectionRef.current
      .setRemoteDescription(answer)
      .catch((err) => console.log(err));
  }, []);

  const handlerNewIceCandidateMsg = useCallback((incoming) => {
    const candidate = new RTCIceCandidate(incoming);
    rtcConnectionRef.current
      .addIceCandidate(candidate)
      .catch((e) => console.log(e));
  }, []);

  const onPeerLeave = useCallback(() => {
    hostRef.current = true;
    if (peerVideoRef.current.srcObject) {
      peerVideoRef.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());
    }

    if (rtcConnectionRef.current) {
      rtcConnectionRef.current.ontrack = null;
      rtcConnectionRef.current.onicecandidate = null;
      rtcConnectionRef.current.close();
      rtcConnectionRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!roomName) {
      return;
    }

    socketRef.current = io();
    socketRef.current.emit("join", roomName);
    socketRef.current.on("created", handleRoomCreated);
    socketRef.current.on("joined", handleRoomJoined);
    socketRef.current.on("ready", initiateCall);
    socketRef.current.on("leave", onPeerLeave);
    socketRef.current.on("full", () => {
      window.location.href = "/";
    });
    socketRef.current.on("offer", handleReceivedOffer);
    socketRef.current.on("answer", handleAnswer);
    socketRef.current.on("ice-candidate", handlerNewIceCandidateMsg);

    return () => socketRef.current.disconnect();
  }, [
    handleAnswer,
    handleReceivedOffer,
    handleRoomCreated,
    handleRoomJoined,
    handlerNewIceCandidateMsg,
    initiateCall,
    onPeerLeave,
    roomName,
  ]);

  const leaveRoom = () => {
    socketRef.current.emit("leave", roomName);

    if (userVideoRef.current.srcObject) {
      userVideoRef.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());
    }
    if (peerVideoRef.current.srcObject) {
      peerVideoRef.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());
    }

    if (rtcConnectionRef.current) {
      rtcConnectionRef.current.ontrack = null;
      rtcConnectionRef.current.onicecandidate = null;
      rtcConnectionRef.current.close();
      rtcConnectionRef.current = null;
    }

    router.push("/");
  };

  return (
    <div>
      <video autoPlay ref={userVideoRef} />
      <video autoPlay ref={peerVideoRef} />
      <button onClick={leaveRoom} type="button">
        Leave
      </button>
    </div>
  );
};

export default Room;
