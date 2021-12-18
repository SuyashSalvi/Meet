const socket = io('/')
let date_ob = new Date();

//get the div from html
const videoGrid = document.getElementById('video-grid')

//creates an HTML element with tag name
const myVideo = document.createElement('video')
myVideo.muted = true

//get data from query
const { username, roomID } = Qs.parse(location.search, { ignoreQueryPrefix: true })
const userDetail = { username,roomID }

let userLists = []


//PeerJS defination
// var mypeer = new Peer()
var mypeer = new Peer('',{
    path:'/peerjs',
    host:'/',    //localhost
    port:'443'  //443
})

const peers = {}





// getUserMedia() method prompts the user for permission to use a media input which produces a MediaStream 
//with tracks containing the requested types of media.
let myVideoStream
navigator.mediaDevices.getUserMedia({
    video:true,
    audio:true
}).then((stream)=>{
  //add own video stream
    myVideoStream =  stream
    addVideoStream(myVideo,stream)
  //ans A/V stream
mypeer.on('call', (call)=> {
  call.answer(stream) // Answer the call with an A/V stream.
  const video = document.createElement('video')
  console.log('Answer call')
  call.on('stream', userVideoStream=>{
      addVideoStream(video,userVideoStream)
  })
})
    //'user-connected' of all the other client is called in which all the other clients call the new client
    socket.on('user-connected',(username,userID)=>{
      console.log(username,'connected!',date_ob.getMinutes(),date_ob.getSeconds())
      console.log(peers)
      // connectNewUser(userID,stream)
      setTimeout(connectNewUser,3000,userID,stream)
      socket.emit('getUserRequest',roomID)
    })
    //collecting users to display participants
    
     
    
    
    socket.on('getUserResponse',(usersList)=>{
      console.log(usersList)
      userLists = usersList
      console.log(userLists)
      for (const u in usersList){
        $("ol").append(`<li id="${usersList[u].username}" class="message">${usersList[u].username} </li>`);
        }
    })
    socket.on('getUserResponseRem',(username)=>{
      const ID = '#'.concat(username)
      console.log('removeeeeeeeeeeeeeee',ID)
        $(ID).remove();
    })
    socket.on('getUserResponseCurr',(userCurr)=>{
      console.log(userCurr.username)
        $("ol").append(`<li id="${userCurr.username}" class="message">${userCurr.username} </li>`);
        
    })
  // Chat:input value
  let text = $("input");
  // when press enter send message
  $('html').keydown(function (e) {
    if (e.which == 13 && text.val().length !== 0) {
      const DT = new Date().getTime()
      const time = moment(DT).format('h:mm a')
            // console.log(time)
      socket.emit('message',{
         textSent : text.val(),
        createdAt : time
        })
      text.val('')
    }
  })
  //Creating msg to html
  socket.on("createMessage", (message,time,userID) => {
    $("ul").append(`<li class="message"><b>${userID}</b> &nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;<small>${time}</small><br/>${message}</li>`);
    scrollToBottom()
  })
   //Creating msg to html
   socket.on("user-connection-notification", (message,username) => {
    const DT = new Date().getTime()
    const time = moment(DT).format('h:mm a') 
    $("ul").append(`<li class="message"><b>Notification</b> &nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;<small>${time}</small><br/>${username} ${message}</li>`);
    scrollToBottom()
  })
})

//---------------------------------------------------
//Remove peer when disconnected
socket.on('user-disconnected', username => {
  if (peers[username]) peers[username].close()
  console.log(peers,username,'disconnect')
})
 //mypeer join room
 mypeer.on('open',(id)=>{
  socket.emit('join-room',{ username, roomID },id)
})
//connect new user to ready stream
const connectNewUser = (userID,stream)=>{
    const call = mypeer.call(userID,stream)
    const video = document.createElement('video')
    console.log('Inside connected user')
    call.on('stream',userVideoStream=>{
      console.log('Inside connected user callon')
        setTimeout(addVideoStream(video,userVideoStream), 1000)
    })
    call.on('close', () => {
      video.remove()
    })
    peers[userID] = call
    console.log(peers,call)
}

//The loadedmetadata event is fired when the metadata(Video in this case) has been loaded. 
const addVideoStream = (video,stream)=>{
  console.log('Inside addVideoStream')
    video.srcObject = stream
    video.addEventListener('loadedmetadata',()=>{
        video.play()
    })
    videoGrid.append(video)
}

  
//Scroll functionality for chat window
  const scrollToBottom = () => {
    var d = $('.main_chat_window');
    d.scrollTop(d.prop("scrollHeight"));
  }

  //Mute Audio
  const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getAudioTracks()[0].enabled = false;
      setUnmuteButton();
    } else {
      setMuteButton();
      myVideoStream.getAudioTracks()[0].enabled = true;
    }
  }
  
//Leave meet
const leaveMeet = ()=>{
      socket.emit('leave',()=>{
        console.log('user left')
      })
      window.location.href='/thankyou'
      // window.onbeforeunload = function() { return "Your work will be lost."; };
      
}

  //Pause Video
  const playStop = () => {
    
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getVideoTracks()[0].enabled = false;
      setPlayVideo()
    } else {
      setStopVideo()
      myVideoStream.getVideoTracks()[0].enabled = true;
    }
  }
  
  //Change mic symbol to mute
  const setMuteButton = () => {
    const html = `
      <i class="fas fa-microphone"></i>
      <span>Mute</span>
    `
    document.querySelector('.main_mute_button').innerHTML = html;
  }
  
   //Change mic symbol to unmute
  const setUnmuteButton = () => {
    const html = `
      <i class="unmute fas fa-microphone-slash"></i>
      <span>Unmute</span>
    `
    document.querySelector('.main_mute_button').innerHTML = html;
  }
  
   //Change video symbol to stop
  const setStopVideo = () => {
    const html = `
      <i class="fas fa-video"></i>
      <span>Stop Video</span>
    `
    document.querySelector('.main_video_button').innerHTML = html;
  }
  
   //Change video symbol to play
  const setPlayVideo = () => {
    const html = `
    <i class="stop fas fa-video-slash"></i>
      <span>Play Video</span>
    `
    document.querySelector('.main_video_button').innerHTML = html;
  }
//-------------------------------------------------

var modal = document.getElementById("myModal");

// Get the button that opens the modal
var btn = document.getElementById("myBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal
const modalfnc = function() {
modal.style.display = "block";
}



// When the user clicks on <span> (x), close the modal
span.onclick = function() {
modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
if (event.target == modal) {
    modal.style.display = "none";
}
}