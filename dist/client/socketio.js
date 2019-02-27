$(function () {
    const $window = $(window);
    const $usernameInput = $('.usernameInput');
    const $loginPage = $('.login.page');
    const $startPage = $('.start.page');
    const $pongPage = $('.pong.gameboard');
    const $startButton = $('.button');
    const $startTitle = $('.starttitle');
    const $playerName = $('.playername');
    const $won = $('.won');
    const $lost = $('.lost');
    const $gameRounds = $('.gameRounds');
    const $gameOverPage = $('.gameover');
    const $victoryPage = $('.victory');
    const $return = $('.return');
    let ballRevert = 1;
    let leftpaddle = $('.paddleLeft').offset().left;
    $startPage.hide();
    $pongPage.hide();
    $gameOverPage.hide();
    $victoryPage.hide();
    let player;
    // Establish connection with socket.io server. Note that this just works
    // because `<script src="/socket.io/socket.io.js"></script>` is in index.html
    const socket = io();
    window.mysocket = socket;
    const keys = document.getElementById('keys');
    const ball = document.getElementById('ball');
    $window.keydown(function (event) {
        if (event.which === 13 && !player) {
            setPlayer();
        }
    });
    $startButton.click(function () {
        socket.emit('start game', document.documentElement.clientHeight, document.documentElement.clientWidth, $('#ball').outerHeight(true), $('#ball').outerWidth(true), $('.paddleLeft').width(), $('.paddleLeft').height(), leftpaddle, $gameRounds.val());
    });
    $return.click(function () {
        $victoryPage.hide();
        $gameOverPage.hide();
        $startPage.show();
    });
    function setPlayer() {
        player = { name: $usernameInput.val().toString().trim(), score: 0, won: 0, lost: 0 };
        if (player.name) {
            window.playerName = player.name;
            socket.emit('login', player);
        }
    }
    // Listeners --------------------------------------------------------
    socket.on('login success', function (code) {
        if (code == 2) {
            ballRevert = -1;
        }
        $loginPage.hide();
        $playerName.text(player.name.toString());
        $startPage.show();
    });
    socket.on('game started', function () {
        $startPage.hide();
        $pongPage.show();
    });
    socket.on('ArrowKey', code => {
        $('.paddleRight')[0].style.top = code + "px";
    });
    socket.on('ball', (x, y) => {
        $('#ball')[0].style.top = `${y}px`;
        if (-1 === ballRevert) {
            $('#ball')[0].style.right = `${x}px`;
        }
        else {
            $('#ball')[0].style.left = `${x}px`;
        }
    });
    socket.on('leftPoint', code => {
        if (-1 === ballRevert) {
            $('#pointsLeft').text(code);
        }
        else {
            $('#pointsRight').text(code);
        }
    });
    socket.on('rightPoint', code => {
        if (-1 === ballRevert) {
            $('#pointsRight').text(code);
        }
        else {
            $('#pointsLeft').text(code);
        }
    });
    socket.on('gameover', val => {
        let players = val;
        $pongPage.hide();
        if (players[0].name === player.name) {
            if (players[0].score > players[1].score) {
                $victoryPage.show();
                player.won++;
                $won.text(player.won);
            }
            else {
                $gameOverPage.show();
                player.lost++;
                $lost.text(player.lost);
            }
        }
        else {
            if (players[1].score > players[0].score) {
                $victoryPage.show();
                player.won++;
                $won.text(player.won);
            }
            else {
                $gameOverPage.show();
                player.lost++;
                $lost.text(player.lost);
            }
        }
        player.score = 0;
    });
});

//# sourceMappingURL=socketio.js.map
