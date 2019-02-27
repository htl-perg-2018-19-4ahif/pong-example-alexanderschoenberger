/**************************************************************************
  NOTE: Take a look at ball-animation-concept.svg/.png to get a better
        understanding of the calculation logic of the ball movement.

        This code has not been optimized for size or speed. It was written
        with ease of understanding in mind.
**************************************************************************/
import server = require('./app');
let leftPaddle:number;
let rightPaddle:number;
let ballFunction = function (clientHeight: number, clientWidth: number, balHeight: number, ballWidth: number, paddleWidth: number, paddleHeight: number, paddleLeft: number) {
  /** Represents a 2d point */
  interface Point {
    x: number;
    y: number
  };

  /** Represents the size of a 2d object */
  interface Size {
    width: number;
    height: number;
  }

  /** Represents directions  */
  enum Direction { top, right, bottom, left, leftPaddle, rightPaddle };


  // Get some information about the browser window and the ball. This information will
  // never change. So it makes sense to get it only once to make the rest of the program faster.
  // const ball = document.getElementById('ball');
  //console.log(ball.outerHeight(true)); //TypeError: ball.outerHeight is not a function
  const ballSize: Size = { width: ballWidth, height: balHeight };
  const ballHalfSize = splitSize(ballSize, 2);
  const clientSize: Size = { width: clientWidth, height: clientHeight };
  const clientHalfSize = splitSize(clientSize, 2);
  let leftPoint = 0;
  let rightPoint = 0;
  
  game();
  function reset(): Point {
    return { x: clientHalfSize.width, y: clientHalfSize.height };
  }
  async function game() {
    console.log('reset ball');
    // Move ball to center of the screen
    let ballCurrentPosition: Point = reset();
    moveBall(ballCurrentPosition);

    // Calculate the random angle that the ball should initially travel.
    // Should be an angle between 27.5 and 45 DEG (=PI/8 and PI/4 RAD)
    const angle = Math.PI / 8 + Math.random() * Math.PI / 8;

    // Calculate the random quadrant into which the ball should initially travel.
    // 0 = upper right, 1 = lower right, 2 = lower left, 3 = upper left
    let quadrant = Math.floor(Math.random() * 4);
    let outside: boolean = false;
    do {
      // Calculate target.
      // X-coordinate iw either right or left border of browser window (depending on
      //              target quadrant)
      // y-coordinate is calculated using tangens angle function of angle
      //              (note: tan(angle) = delta-y / delta-x). The sign depends on
      //              the target quadrant)
      const targetX = (quadrant === 0 || quadrant === 1) ? clientSize.width - ballSize.width : 0;
      const targetBallPosition: Point = {
        x: targetX,
        y: ballCurrentPosition.y + Math.tan(angle) * Math.abs(targetX - ballCurrentPosition.x) * ((quadrant === 0 || quadrant === 3) ? -1 : 1)
      };

      // Animate ball to calculated target position
      /* let number = collisionAgainstPaddle(ballCurrentPosition);
       if(number !== undefined){
         quadrant = number;
       }*/

      const borderTouch = await animateBall(ballCurrentPosition, targetBallPosition);
      // Based on where the ball touched the browser window, we change the new target quadrant.
      // Note that in this solution the angle stays the same.
      outside = false;
      switch (borderTouch.touchDirection) {
        case Direction.left:
          rightPoint++;
          server.sendRightPoints(rightPoint);
          outside = true;
          break;
        case Direction.right:
          leftPoint++;
          server.sendLeftPoints(leftPoint);
          outside = true;
          break;
        case Direction.top:
          quadrant = (quadrant === 0) ? 1 : 2;
          break;
        case Direction.bottom:
          quadrant = (quadrant === 2) ? 3 : 0;
          break;
        case Direction.leftPaddle:
          quadrant = (quadrant === 2) ? 1 : 0
          break;
        case Direction.rightPaddle: quadrant = (quadrant === 0) ? 3 : 2; break;
        default:
          throw new Error('Invalid direction, should never happen');

      }

      // The touch position is the new current position of the ball.
      // Note that we fix the position here slightly in case a small piece of the ball has reached an area
      // outside of the visible browser window.
      ballCurrentPosition.x = Math.min(Math.max(borderTouch.touchPosition.x - ballHalfSize.width, 0) + ballHalfSize.width, clientSize.width);
      ballCurrentPosition.y = Math.min(Math.max(borderTouch.touchPosition.y - ballHalfSize.height, 0) + ballHalfSize.height, clientSize.height);
    } while (!outside);
    game();
  }

  /**
   * Animate the ball from the current position to the target position. Stops
   * animation if border of browser window is reached.
   * @returns Position and direction where ball touched the border of the browser window
   *          at the end of the animation
   */

  function animateBall(currentBallPosition: Point, targetBallPosition: Point): Promise<{ touchPosition: Point, touchDirection: Direction }> {
    // Calculate x and y distances from current to target position
    const distanceToTarget: Size = subtractPoints(targetBallPosition, currentBallPosition);

    // Use Pythagoras to calculate distance from current to target position
    const distance = Math.sqrt(distanceToTarget.width * distanceToTarget.width + distanceToTarget.height * distanceToTarget.height);

    // Variable defining the speed of the animation (pixels that the ball travels per interval)
    const pixelsPerInterval = 1;

    // Calculate distance per interval
    const distancePerInterval = splitSize(distanceToTarget, distance * pixelsPerInterval);

    // Return a promise that will resolve when animation is done
    return new Promise<{ touchPosition: Point, touchDirection: Direction }>(res => {
      // Start at current ball position
      let animatedPosition: Point = currentBallPosition;

      // Move point every 4ms
      const interval = setInterval(() => {
        // Move animated position by the distance it has to travel per interval
        animatedPosition = movePoint(animatedPosition, distancePerInterval);

        // Move the ball to the new position
        moveBall(animatedPosition);

        // Check if the ball touches the browser window's border
        let touchDirection: Direction;
        /* if (((currentBallPosition.y - ballHalfSize.height) < animatedPosition.y + ballHalfSize.height) && ((currentBallPosition.y - ballHalfSize.height) > animatedPosition.y)) {
           touchDirection = Direction.leftPaddle;
           console.log('Paddle Left');
         }*/
        if (overlaps(leftPaddle,animatedPosition, paddleWidth, paddleHeight, paddleLeft, ballSize)) {
          console.log('left');
          touchDirection = Direction.leftPaddle;
        }
        if (overlaps(rightPaddle,animatedPosition, paddleWidth, paddleHeight, (clientWidth-paddleLeft), ballSize)) {
          console.log('right');
          touchDirection = Direction.rightPaddle;
        }
        if ((animatedPosition.x - ballHalfSize.width) < 0) { touchDirection = Direction.left; }
        if ((animatedPosition.y - ballHalfSize.height) < 0) { touchDirection = Direction.top; }
        if ((animatedPosition.x + ballHalfSize.width) > clientSize.width) { touchDirection = Direction.right; }
        if ((animatedPosition.y + ballHalfSize.height) > clientSize.height) { touchDirection = Direction.bottom; }
        //    console.log(touchDirection);
        if (touchDirection !== undefined) {
          // Ball touches border -> stop animation
          clearInterval(interval);
          res({ touchPosition: animatedPosition, touchDirection: touchDirection });
        }
      }, 4);
    });
  }

  /** Move the center of the ball to given position **/
  function moveBall(targetPosition: Point): void {
    // Note the 'px' at the end of the coordinates for CSS. Don't
    // forget it. Without the 'px', it doesn't work.
    const leftPos = targetPosition.x - ballHalfSize.width;
    const topPos = targetPosition.y - ballHalfSize.height;

    //  console.log('move'+leftPos+' '+topPos);
    // if (ball.position().left !== leftPos && ball.position().top !== topPos) {
    // ball.style.setProperty('left', leftPos);
    server.sendBallPosition(leftPos, topPos);
    // }

    /*if (ball.style.top !== topPos) {
      ball.style.setProperty('top', topPos);
    }*/
  }

  /** Subtracts two points and returns the size between them */
  function subtractPoints(a: Point, b: Point): Size {
    return {
      width: a.x - b.x,
      height: a.y - b.y
    };
  }

  /** Moves a point by the given size */
  function movePoint(p: Point, s: Size): Point {
    return {
      x: p.x + s.width,
      y: p.y + s.height
    };
  }

  /** Divides the width and height of the given size by the given divider */
  function splitSize(s: Size, divider: number): Size {
    return {
      width: s.width / divider,
      height: s.height / divider
    };
  }
};
let overlaps = (function () {
  function getPositions(top:number, width:number, height:number, left:number) {
    return [[left, left + width], [top, top + height]];
  }

  function comparePositions(p1, p2) {
    let r1, r2;
    r1 = p1[0] < p2[0] ? p1 : p2;
    r2 = p1[0] < p2[0] ? p2 : p1;
    return r1[1] > r2[0] || r1[0] === r2[0];
  }

  return function (a, b, width, height, left, ballSize) {
    /*console.log(a, width, height, left);
    console.log(b.y, ballSize.width, ballSize.height,b.x);*/
    let pos1 = getPositions(a, width, height, left),
      pos2 = getPositions(b.y, ballSize.width, ballSize.height,b.x);
    return comparePositions(pos1[0], pos2[0]) && comparePositions(pos1[1], pos2[1]);
  };
})();
export function setLeftPaddle(code) {
  console.log('leftPaddle');
  leftPaddle = code;
}

export function setRightPaddle(code) {
  console.log('rightPaddle');
  rightPaddle = code;
}
export { ballFunction };