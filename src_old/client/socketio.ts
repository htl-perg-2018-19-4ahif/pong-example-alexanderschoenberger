/**************************************************************************
  Demo for a socket.io client

  NOTE: This code has not been optimized for size or speed. It was written
        with ease of understanding in mind.
**************************************************************************/

$(function () {

  const $window = $(window);
  const $usernameInput = $('.usernameInput');
  const $loginPage = $('.login.page');
  const $startPage = $('.start.page');
  const $pongPage = $('.pong.gameboard');
  const $startButton = $('.button');
  const $startTitle = $('.starttitle');
  let ballRevert:number=1;
  let leftpaddle= $('.paddleLeft').offset().left;
  $startPage.hide();
  $pongPage.hide();


  interface IPlayer {
    name: string;
    // score: number;
  }
  let player: IPlayer;


  // Establish connection with socket.io server. Note that this just works
  // because `<script src="/socket.io/socket.io.js"></script>` is in index.html
  const socket = io();
  (<any>window).mysocket = socket;

  const keys = <HTMLUListElement>document.getElementById('keys');

  const ball = document.getElementById('ball');

  socket.emit("webpage", document);

  $window.keydown(function (event) {
    if (event.which === 38 || event.which === 40) { // 38 arrrowup, 40 arrowdown
      // Send ArrowKey message to server
    } else if (event.which === 13 && !player) {
      setPlayer();
    }
  });
  $startButton.click(function () {
    socket.emit('start game', document.documentElement.clientHeight, document.documentElement.clientWidth, $('#ball').outerHeight(true), $('#ball').outerWidth(true), $('.paddleLeft').width(), $('.paddleLeft').height(), leftpaddle);
  });

  function setPlayer() {
    player = { name: $usernameInput.val().toString().trim() }
    if (player.name) {
     (<any>window).playerName = player.name;
      socket.emit('login', player);
    }
    player = null;
  }

  socket.on('login success', function (code) {
    if(code==2){
      ballRevert=-1;
    }
    console.log(code);
    $loginPage.fadeOut();
    $startTitle.text("Welcome to PONG");
    $startPage.show();
  });

  socket.on('game started', function () {
    $startPage.fadeOut();
    $pongPage.show();
  });

  socket.on('ArrowKey', code => {
    console.log(code);
    $('.paddleRight')[0].style.top = code + "px";
  });
  socket.on('ball', (x, y) => {
    $('#ball')[0].style.top = `${y}px`;
    if(-1 === ballRevert){
      $('#ball')[0].style.right = `${x}px`;
    }else {
      $('#ball')[0].style.left = `${x}px`;
    }
  });
  socket.on('leftPoint', code => {
    $('#pointsLeft').text(code);
  })
  socket.on('rightPoint', code => {
    $('#pointsRight').text(code);
  })
});


