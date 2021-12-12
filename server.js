const express = require('express')
const app = express()
const { v4:uuidv4 } = require('uuid')
const server = require('http').Server(app)
const io = require('socket.io')(server);
const  { ExpressPeerServer } = require('peer');
const { isNullOrUndefined } = require('util');
const Window = require('window');
const peerServer = ExpressPeerServer(server,{
    debug:true
});
let date_ob = new Date();
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users')

const window = new Window();

app.set('view engine','ejs')
app.use(express.static('public'))
app.use('/peerjs',peerServer)

app.get('/',(req,res)=>{
    // res.redirect(`/${uuidv4()}`)
    // res.render('room',{ roomID: req.params }
    // res.send(req.params)
    res.redirect('/login.html')
})

app.get('/thankyou',(req,res)=>{
    res.render('thankyou')
})

app.get('/login',(req,res)=>{
    res.render('login')
})

// app.get('/:room',(req,res)=>{
//     res.render('room',{ roomID: req.params.room })
// })
 
io.on('connection',(socket)=>{
    
    socket.on('join-room',(details,userID)=>{   
        const username = details.username
        const roomID = details.roomID
        
        socket.join(roomID)
        addUser(roomID,userID,username)
        const userList = getUsersInRoom(roomID) 
        const userCurr = getUser(userID)
        console.log(userList)
        console.log(userCurr)
        // socket.on('connection-request',(roomID,username,userID)=>{
       socket.broadcast.to(roomID).emit('user-connected',username,userID)
       socket.broadcast.to(roomID).emit('user-connection-notification',' has joined!',username)
        console.log('Done broadcasting to: ',roomID,date_ob.getMinutes(),date_ob.getSeconds())
        // })
        // messages
        socket.on('message', (message) => {
        //send message to the same room
        io.to(roomID).emit('createMessage', message.textSent,message.createdAt,username)
    })
    socket.on('getUserRequest',(roomID)=>{
        console.log('getUserRequest server',roomID)
        socket.emit('getUserResponse',userList)
        socket.broadcast.to(roomID).emit('getUserResponseCurr',userCurr)
    })
    socket.on('disconnect', () => {
        socket.broadcast.to(roomID).emit('user-disconnected', userID)
        socket.broadcast.to(roomID).emit('user-connection-notification',' has left!',username)
        removeUser(userID)
        const userList = getUsersInRoom(roomID) 
        io.emit('getUserResponseRem',username)
      })
    socket.on('leave',()=>{
        socket.broadcast.to(roomID).emit('user-disconnected', userID) 
        // socket.broadcast.to(roomID).emit('user-connection-notification',' has left!',username)
        removeUser(userID)
        const userList = getUsersInRoom(roomID) 
        io.emit('getUserResponseRem',username)       
    })
    })
})


server.listen(process.env.PORT || 3000,()=>{
    console.log("Server Up")
})
