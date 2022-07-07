// Setup basic express server
const express = require('express');
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log('ecoute sur le port %d', port);
});

app.use(express.static(path.join(__dirname, 'public')));

let numUsers = 0;

io.on('connection', (socket) => {
  let addedUser = false;

  
  socket.on('new message', (data) => {
    // diffuse (broadcast) le message à toutes les sockets 
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // message adduser du client
  socket.on('add user', (username) => {
    if (addedUser) return;

    // socket comme une session peu avoir une cle valeur
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });


    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});
