import React, {useEffect, useCallback,useState} from 'react'
import ReactPlayer from 'react-player'
import { useSocket } from '../Context/SocketProvider'
import peer from "../service/Peer"
function RoomPage() {
    const socket = useSocket();
    const [remoteSocketId, setRemoteSocketId] = useState(null)
    const [myStream , setMyStream] = useState()
    const [remoteStream , setRemoteStream] = useState()

    const handleUserJoined = useCallback(({email , id}) => {
        console.log(`Email ${email} Joined room`);
        setRemoteSocketId(id)
    }, [])

    const handleCallUser = useCallback (async() => {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            
            audio: true,
            video: true
        });
        const offer = await peer.getOffer();
        socket.emit("user:call", {to: remoteSocketId, offer})
        setMyStream(stream)
    }, [remoteSocketId, socket])

    const handleIncomingCall = useCallback( async({ from, offer}) => { 
         setRemoteSocketId(from);
        const stream = await navigator.mediaDevices.getUserMedia({ 
            
            audio: true,
            video: true
        });
        setMyStream(stream)
        console.log(`Incoming call` , from , offer);
        const ans = await peer.getAnswer(offer)
        socket.emit('call:accepted', {to: from, ans})
    }, [socket])

    const sendStreams = useCallback(() => {
for (const track of myStream.getTracks()){
   peer.peer.addTrack(track, myStream)
}}, [myStream])
    const handleCallAccepted = useCallback(({ from, ans }) => {
peer.setLocalDescription(ans)
console.log("call accepted");
sendStreams();

    }, [sendStreams]);

const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
     socket.emit('peer:nego:needed', {offer, to: remoteSocketId})

  }, [remoteSocketId, socket])

useEffect(() => {
peer.peer.addEventListener('negotiationneeded', handleNegoNeeded )
return () => {
  peer.peer.removeEventListener('negotiationneeded', handleNegoNeeded )

}
},[handleNegoNeeded])
const handleNegoNeedIncoming = useCallback(async ({from, offer}) => {
const ans = await peer.getAnswer(offer);
socket.emit("peer:nego:done", {to: from, ans})
}, [socket])
const handleNegoNeedFinal  = useCallback( async({ans}) => {
await peer.setLocalDescription(ans)
},[])
    useEffect(() => {
peer.peer.addEventListener('track', async (ev) => {
  const remoteStream = ev.streams;
  console.log("got tracks")
  setRemoteStream(remoteStream[0])
})
    },[])

    useEffect(() => {
        socket.on('user:joined', handleUserJoined )
        socket.on('incoming:call', handleIncomingCall)
        socket.on('call:accepted', handleCallAccepted)
        socket.on('peer:nego:needed', handleNegoNeedIncoming)
        socket.on('peer:nego:final', handleNegoNeedFinal)
     return () => {
        socket.off('user:joined', handleUserJoined)
        socket.off('incoming:call', handleIncomingCall)
        socket.off('call:accepted', handleCallAccepted)
         socket.off('peer:nego:needed', handleNegoNeedIncoming)
        socket.off('peer:nego:final', handleNegoNeedFinal)

     }
    }, [socket, handleUserJoined, handleIncomingCall, handleCallAccepted, handleNegoNeedIncoming, handleNegoNeedFinal])
  return (
    <div>
      Room
      <h4>{remoteSocketId ? "Connected" : "No one in room"} </h4>
      {
        myStream && <button onClick={sendStreams}>Send Stream</button>
      }
      {
        remoteSocketId && <button onClick={handleCallUser}>Call</button> 
      }
      {
        myStream && (<> <h1>My STREAM</h1> <ReactPlayer playing height="500px" width="500px" url={myStream} /> </>)
      }
       {
        remoteStream && (<> <h1>REMOTE STREAM</h1> <ReactPlayer playing  height="500px" width="500px" url={remoteStream} /> </>)
      }
    </div>
  )
}

export default RoomPage
