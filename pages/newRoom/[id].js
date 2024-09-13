import { useRouter } from "next/router";
import Pusher from "pusher-js";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import {
  Mic,
  MicOff,
  Phone,
  Camera,
  CameraOff,
  MonitorUp,
  MonitorOff,
  SkipForward,
  SendHorizontal,
  MessageCircleCode,
} from "lucide-react";

const ICE_SERVERS = {
  iceServers: [
    {
      urls: "stun:openrelay.metered.ca:80",
    },
    {
      urls: "stun:stun.l.google.com:19302",
    },
    {
      urls: "stun:stun2.l.google.com:19302",
    },
  ],
};

export default function Room({ userName, roomName }) {
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const router = useRouter();

  const host = useRef(false);
  const pusherRef = useRef();
  const channelRef = useRef();
  const rtcConnection = useRef();
  const userStream = useRef();
  const userVideo = useRef(null);
  const partnerVideo = useRef(null);

  useEffect(() => {
    pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      authEndpoint: "/api/pusher/auth",
      auth: {
        params: { username: userName },
      },
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });
    channelRef.current = pusherRef.current.subscribe(`presence-${roomName}`);

    channelRef.current.bind("pusher:subscription_succeeded", (members) => {
      if (members.count === 1) {
        host.current = true;
      }

      if (members.count > 2) {
        router.push("/");
      }
      handleRoomJoined();
    });

    channelRef.current.bind("pusher:member_removed", () => {
      handlePeerLeaving();
    });

    channelRef.current.bind("client-offer", (offer) => {
      if (!host.current) {
        handleReceivedOffer(offer);
      }
    });

    channelRef.current.bind("client-ready", () => {
      initiateCall();
    });

    channelRef.current.bind("client-answer", (answer) => {
      if (host.current) {
        handleAnswerReceived(answer);
      }
    });

    channelRef.current.bind("client-ice-candidate", (iceCandidate) => {
      handlerNewIceCandidateMsg(iceCandidate);
    });

    channelRef.current.bind("client-message", (message) => {
      receiveMessage(message);
    });

    return () => {
      if (pusherRef.current)
        pusherRef.current.unsubscribe(`presence-${roomName}`);
    };
  }, [userName, roomName]);

  const handleRoomJoined = () => {
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: { width: 1280, height: 720 },
      })
      .then((stream) => {
        userStream.current = stream;
        userVideo.current.srcObject = stream;
        userVideo.current.onloadedmetadata = () => {
          userVideo.current.play();
        };
        if (!host.current) {
          channelRef.current.trigger("client-ready", {});
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const createPeerConnection = () => {
    const connection = new RTCPeerConnection(ICE_SERVERS);

    connection.onicecandidate = handleICECandidateEvent;
    connection.ontrack = handleTrackEvent;
    connection.onicecandidateerror = (e) => console.log(e);

    if (screenShareActive) {
      navigator.mediaDevices
        .getDisplayMedia({ video: true }) // Get screen sharing stream
        .then((stream) => {
          stream.getTracks().forEach((track) => {
            connection.addTrack(track, stream); // Add screen sharing track to connection
          });
        })
        .catch((err) => {
          console.error("Error accessing screen sharing:", err);
        });
    }

    return connection;
  };

  const initiateCall = () => {
    // Create RTCPeerConnection
  rtcConnection.current = createPeerConnection();

  // Add local audio and video tracks
  userStream.current.getTracks().forEach((track) => {
    rtcConnection.current.addTrack(track, userStream.current);
  });

  // Include screen share track if active
  if (screenShareActive) {
    userStream.current.getTracks().forEach((track) => {
      if (track.kind === "video" && track.label === "screen") {
        rtcConnection.current.addTrack(track, userStream.current);
      }
    });
  }

  // Create offer
  rtcConnection.current
    .createOffer()
    .then((offer) => {
      rtcConnection.current.setLocalDescription(offer);

      // Send offer through signaling channel (e.g., Pusher)
      channelRef.current.trigger("client-offer", offer);
    })
    .catch((error) => {
      console.error("Error creating offer:", error);
    });
  };

  const handleReceivedOffer = (offer) => {
    rtcConnection.current = createPeerConnection();
    userStream.current?.getTracks().forEach((track) => {
      rtcConnection.current?.addTrack(track, userStream.current);
    });

    rtcConnection.current.setRemoteDescription(offer);
    rtcConnection.current
      .createAnswer()
      .then((answer) => {
        rtcConnection.current.setLocalDescription(answer);
        channelRef.current.trigger("client-answer", answer);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleAnswerReceived = (answer) => {
    rtcConnection.current.setRemoteDescription(answer);
  };

  const handleICECandidateEvent = async (event) => {
    if (event.candidate) {
      channelRef.current.trigger("client-ice-candidate", event.candidate);
    }
  };

  const handlerNewIceCandidateMsg = (incoming) => {
    const candidate = new RTCIceCandidate(incoming);
    rtcConnection.current
      .addIceCandidate(candidate)
      .catch((error) => console.log(error));
  };

  const handleTrackEvent = (event) => {
    partnerVideo.current.srcObject = event.streams[0];
  };

  const toggleMediaStream = (type) => {
    if (type === "screen") {
    if (screenShareActive) {
      console.log("Screen sharing stopped ", screenShareActive);
      stopScreenShare();
    } else {
      navigator.mediaDevices
        .getDisplayMedia({ video: true })
        .then((stream) => {
          userVideo.current.srcObject = stream;
          userStream.current = stream;

          // Include the screen share track in the RTCPeerConnection
          if (rtcConnection.current) {
            stream.getTracks().forEach((track) => {
              rtcConnection.current.addTrack(track, stream);
            });
          } else {
            console.warn("RTC peer connection not yet established for screen sharing.");
          }

          setScreenShareActive(!screenShareActive);
          console.log("Screen sharing started", screenShareActive);
        })
        .catch((error) => {
          console.error("Error accessing screen sharing:", error);
        });
    }
    } else if (type === "video") {
      userStream.current?.getTracks().forEach((track) => {
        if (track.kind === "video") {
          track.enabled = !track.enabled;
        }
      });
      setCameraActive((prev) => !prev);
    }
  };

  const handlePeerLeaving = () => {
    host.current = true;
    if (partnerVideo.current?.srcObject) {
      partnerVideo.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());
    }

    if (rtcConnection.current) {
      rtcConnection.current.ontrack = null;
      rtcConnection.current.onicecandidate = null;
      rtcConnection.current.close();
      rtcConnection.current = null;
    }
  };

  const leaveRoom = () => {
    if (userVideo.current?.srcObject) {
      userVideo.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    if (partnerVideo.current?.srcObject) {
      partnerVideo.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());
    }

    if (rtcConnection.current) {
      rtcConnection.current.ontrack = null;
      rtcConnection.current.onicecandidate = null;
      rtcConnection.current.close();
      rtcConnection.current = null;
    }

    router.push("/");
  };

  const toggleMic = () => {
    toggleMediaStream("audio", micActive);
    setMicActive((prev) => !prev);
  };

  const toggleCamera = () => {
    toggleMediaStream("video", cameraActive);
    setCameraActive((prev) => !prev);
  };

  const stopScreenShare = () => {
    if (screenShareActive) {
      userVideo.current.srcObject = userStream.current;
      userStream.current.getTracks().forEach((track) => {
        if (track.kind === "video" && track.label === "screen") {
          track.stop(); // Stop screen sharing track
          rtcConnection.current.getSenders().forEach((sender) => {
            if (sender.track === track) {
              rtcConnection.current.removeTrack(sender); // Remove screen sharing track from RTC connection
            }
          });
        }
      });
      setScreenShareActive(false);
    }
  };

  const sendMessage = () => {
    if (message.trim() === "") return;
    const newMessage = {
      user: userName,
      text: message.trim(),
    };
    setMessages([...messages, newMessage]);
    channelRef.current.trigger("client-message", newMessage);
    setMessage("");
  };

  const receiveMessage = (message) => {
    setMessages([...messages, message]);
  };

  return (
    <section className="relative w-screen h-screen bg-[#1A1A1A] ">
      <div className="mx-auto max-w-screen-2xl p-4">
        <Image
          height={100}
          width={200}
          src="/Doogle.svg"
          alt="logo"
          className="absolute self-start h-12 w-[6rem] lg:h-16 lg:w-32"
        />

        <div className="flex gap-4 h-[90vh]  w-[93vw] items-center">
          <div className="rounded flex-1  ">
            <video
              autoPlay
              ref={userVideo}
              muted
              className="border-2 
              width-auto
              border-purple-900 rounded-2xl h-[42vh]"
            />
          </div>
          <div className="rounded flex-1 ">
            <video
              autoPlay
              ref={partnerVideo}
              className="border-2 border-purple-900 rounded-2xl h-[42vh]"
            />
          </div>
          {/* chat */}
          {showChat ? (
            <div className="flex flex-col justify-between bg-purple-100 h-[90vh]  rounded-sm p-4  w-[15vw]">
              <div>
                <div className="mb-2 self-end">
                  <X onClick={() => setShowChat(!showChat)} />
                </div>
                <div style={{ overflowY: "scroll", height: "200px" }}>
                  {messages.map((msg, index) => (
                    <div key={index} className="flex flex-col gap-2">
                      <div>
                        <strong>{msg.user} </strong>
                      </div>
                      <div>
                        <span className="rounded-sm my-1 shadow-2xl text-black bg-white px-6 py-1 ">
                          {msg.text}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative h-12">
                <Input
                  className="bg-purple-200"
                  placeholder="Send a message"
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                />
                <button
                  className="absolute right-2 top-2 text-gray-600"
                  onClick={sendMessage}
                >
                  <SendHorizontal />
                </button>
              </div>
            </div>
          ) : (
            <div className="absolute bottom-[10%] right-10  text-white "></div>
          )}
        </div>
        <div className="absolute bottom-[2rem] left-[40%] flex items-center justify-center gap-3 mx-auto rounded-full h-14  max-w-md backdrop-grayscale  text-white   px-16 p-2">
          <button
            onClick={toggleCamera}
            type="button"
            className="rounded-full bg-white/10 p-3"
          >
            {cameraActive ? <CameraOff /> : <Camera />}
          </button>
          <button
            onClick={toggleMic}
            type="button"
            className="rounded-full bg-white/10 p-3"
          >
            {micActive ? <Mic /> : <MicOff />}
          </button>
          <button
            onClick={() => toggleMediaStream("screen")}
            type="button"
            className="rounded-full bg-white/10 p-3"
          >
            {screenShareActive ? <MonitorOff /> : <MonitorUp />}
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            type="button"
            className="rounded-full bg-white/10 p-3"
          >
            <MessageCircleCode />
          </button>
          <button type="button" className="rounded-full bg-white/10 p-3">
            <SkipForward />
          </button>
          <button
            onClick={leaveRoom}
            type="button"
            className="rounded-full bg-[#EA4335] p-3"
          >
            <Phone className="fill-white stroke-white rotate-25" />
          </button>
        </div>
      </div>
    </section>
  );
}
