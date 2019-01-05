"use strict";

// Initialize canvas and 2d context
// let canvas = document.getElementById("canvas");
// let ctx = canvas.getContext("2d");
let bcanvas = document.getElementById("backcanvas");
let bctx = bcanvas.getContext("2d");
// myEntity.offscreenCanvas = document.createElement('canvas');
// myEntity.offscreenCanvas.width = myEntity.width;
// myEntity.offscreenCanvas.height = myEntity.height;

// myEntity.offscreenContext = myEntity.offscreenCanvas.getContext('2d');
// myEntity.render(myEntity.offscreenContext);
let laps = document.querySelector("#laps");
let speed = document.querySelector("#speed");


const WIDTH = bcanvas.width;
const HEIGHT = bcanvas.height;
const CARLENGTH = WIDTH / 8;
const CARWIDTH = WIDTH / 20;
const TRACKSEMIWIDTH = WIDTH > HEIGHT ? WIDTH / 40 : HEIGHT / 40;
const MAXFSPEED = 3;
const MAXBSPEED = 1.5;
const MAXACCEL = 0.05;
const MAXDCCEL = 0.1;
var OBSTACLE_WH = 10;

// Acessory function to create random integers between two values
function getRandomBetweenMinAndMax(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

// Generate random points within the canvas from 10% to 90% of the WIDTH and HEIGHT
function generateRandom(n) {
    let arr = new Array;
    for (let i = 0; i < n; i++) {
        let track = new Object;
        track.x = getRandomBetweenMinAndMax(0 + 0.2 * WIDTH, WIDTH - 0.2 * WIDTH);
        track.y = getRandomBetweenMinAndMax(0 + 0.3 * HEIGHT, HEIGHT - 0.32 * HEIGHT);
        arr.push(track);
    }
    return arr;
}

// Create a group of 15 points
let testTrack = generateRandom(55);


// let track1 = [{ x: 50, y: 50 }, { x: 50, y: 75 }, { x: 75, y: 150 }, { x: 45, y: 165 }, { x: 30, y: 180 }, { x: 50, y: 250 }, { x: 150, y: 225 }, { x: 130, y: 150 }, { x: 140, y: 120 }, { x: 160, y: 95 }, { x: 170, y: 110 }, { x: 190, y: 140 }, { x: 275, y: 150 }, { x: 220, y: 45 }, { x: 120, y: 50 }, { x: 70, y: 50 }];


var convexhull = new function () {

    // Returns a new array of points representing the convex hull of
    // the given set of points. The convex hull excludes collinear points.
    this.makeHull = function (points) {
        var newPoints = points.sort(this.pointComparator);
        var hull = this.makeHullPresorted(newPoints);
        var track = this.complicateTrack(hull);
        var roundedTrack = this.roundCorners(track);
        return roundedTrack;
    };

    // Returns the convex hull, assuming that each points[i] <= points[i + 1].
    this.makeHullPresorted = function (points) {
        if (points.length <= 1)
            return points.slice();

        // Andrew's monotone chain algorithm. 
        var upperHull = [];
        for (let p = 0; p < points.length; ++p) {
            while (upperHull.length >= 2) {
                let q = upperHull[upperHull.length - 1];
                let r = upperHull[upperHull.length - 2];
                if ((q.x - r.x) * (points[p].y - r.y) >= (q.y - r.y) * (points[p].x - r.x)) {
                    upperHull.pop();
                } else {
                    break;
                }
            }
            upperHull.push(points[p])
        }
        upperHull.pop();

        var lowerHull = [];
        for (let p = points.length - 1; p >= 0; --p) {
            while (lowerHull.length >= 2) {
                let q = lowerHull[lowerHull.length - 1];
                let r = lowerHull[lowerHull.length - 2];
                if ((q.x - r.x) * (points[p].y - r.y) >= (q.y - r.y) * (points[p].x - r.x)) {
                    lowerHull.pop();
                } else {
                    break;
                }
            }
            lowerHull.push(points[p]);
        }
        lowerHull.pop();

        if (upperHull.length == 1 && lowerHull.length == 1 && upperHull[0].x == lowerHull[0].x && upperHull[0].y == lowerHull[0].y)
            return upperHull;
        else
            return upperHull.concat(lowerHull);
    };

    // Sort by x, if not sort by y
    this.pointComparator = function (a, b) {
        if (a.x < b.x)
            return -1;
        else if (a.x > b.x)
            return +1;
        if (a.y < b.y)
            return -1;
        else if (a.y > b.y)
            return +1;
        else
            return 0;
    };

    this.vecLength = function (x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    this.complicateTrack = function (points) {
        let newArr = new Array;
        for (let i = 1; i < points.length - 1; ++i) {
            let v1 = this.vecLength(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
            let v2 = this.vecLength(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
            let v3 = this.vecLength(points[i - 1].x, points[i - 1].y, points[i + 1].x, points[i + 1].y);
            let angle = (Math.acos((Math.pow(v1, 2) + Math.pow(v2, 2) - Math.pow(v3, 2)) / (2 * v1 * v2))) * 180 / Math.PI;
            // console.log(angle);
            let midPoints = { x: (points[i].x + points[i + 1].x) / 2, y: (points[i].y + points[i + 1].y) / 2 };
            let upperpPoints = this.findArcTan2([points[i], midPoints], true, HEIGHT / 45);
            let lowerPoints = this.findArcTan2([points[i], midPoints], false, HEIGHT / 8);
            // console.log(perpPoints);
            if (angle > 160 && this.vecLength(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y) > 130) {
                newArr.push(upperpPoints[1]);
                newArr.push(points[i + 1]);
            } else {
                // newArr.push(points[i]);
                newArr.push(lowerPoints[1]);
            }
        }
        // console.log(newArr);
        return newArr;
    }

    // Optimization loop for the Chaikin's algorithm for curves
    this.roundCorners = function (points) {
        var newPoints = new Array;
        let count = 0;
        while (count < 5) {
            if (count == 0) {
                newPoints = this.addRoundingPoints(points);
            } else {
                newPoints = this.addRoundingPoints(newPoints);
            }
            count += 1;
        }
        return newPoints;
    }

    // Implement the Chaikin's algorithm for curves (Cut corners)
    this.addRoundingPoints = function (points) {
        let q = new Object;
        let r = new Object;
        let newArray = new Array;
        for (let i = 0; i < points.length; i++) {
            if (i == points.length - 1) {
                q = { x: 0.75 * points[i].x + 0.25 * points[0].x, y: 0.75 * points[i].y + 0.25 * points[0].y };
                r = { x: 0.25 * points[i].x + 0.75 * points[0].x, y: 0.25 * points[i].y + 0.75 * points[0].y };
            } else {
                q = { x: 0.75 * points[i].x + 0.25 * points[i + 1].x, y: 0.75 * points[i].y + 0.25 * points[i + 1].y };
                r = { x: 0.25 * points[i].x + 0.75 * points[i + 1].x, y: 0.25 * points[i].y + 0.75 * points[i + 1].y };
            }
            newArray.push(q);
            newArray.push(r);
        }
        return newArray;
    }

    // Creates the sets of points of the outer and inner limits of the track
    // Uses the perpendicular vectors created below
    this.findArcTan2 = function (points, upper, width) {
        var arr = new Array;

        if (upper) {
            for (let i = 0; i < points.length; ++i) {
                if (i == points.length - 1) {
                    let perpPoints = this.getPerpOfLine(points[i].x, points[i].y, points[0].x, points[0].y);
                    arr.push({ x: points[i].x + perpPoints[0] * width, y: points[i].y + perpPoints[1] * width });
                } else {
                    let perpPoints = this.getPerpOfLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
                    arr.push({ x: points[i].x + (perpPoints[0] * width), y: points[i].y + (perpPoints[1] * width) });
                }

            }
        } else {
            for (let i = 0; i < points.length; ++i) {
                if (i == points.length - 1) {
                    let perpPoints = this.getPerpOfLine(points[i].x, points[i].y, points[0].x, points[0].y);
                    arr.push({ x: points[i].x - perpPoints[0] * width, y: points[i].y - perpPoints[1] * width });
                } else {
                    let perpPoints = this.getPerpOfLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
                    arr.push({ x: points[i].x - perpPoints[0] * width, y: points[i].y - perpPoints[1] * width });
                }
            }
        }

        return arr;
    }
    // Gets two points as input and returns the perpendicular normalised vector
    this.getPerpOfLine = function (x1, y1, x2, y2) { // the two points can't be equal
        var nx = x2 - x1;  // create x component of vector
        var ny = y2 - y1; // create y component of vector
        const len = Math.sqrt(nx * nx + ny * ny);  // length of vector
        nx /= len;  // normalise the vector
        ny /= len;  // 

        return [-ny, nx]; // return the vector rotated 90 deg
    }

}


// Function that draws the track from the collection of points given by 
// hull, upperHull and lowerHull
function drawTrack(track, color, lower, middle) {

    bctx.closePath();
    bctx.stroke();

    if (middle) {
        bctx.strokeStyle = color;
        bctx.lineWidth = 1;
        for (let i = 0; i < track.length; i++) {
            if (i == 0) {
                bctx.beginPath();
                bctx.moveTo(track[i].x, track[i].y);
            } else if (i % 2 == 0) {
                bctx.lineTo(track[i].x, track[i].y);
            } else {
                bctx.moveTo(track[i].x, track[i].y);
            }

        }
        bctx.stroke();
    } else {
        bctx.strokeStyle = color;
        bctx.lineWidth = 5;
        for (let i = 0; i < track.length; i++) {
            if (i == 0) {
                bctx.beginPath();
                bctx.moveTo(track[i].x, track[i].y);
            } else {
                bctx.lineTo(track[i].x, track[i].y);
            }

        }
        bctx.stroke();
        if (lower) {
            // let grass = new Image();
            // grass.src = "grass.png";
            // grass.onload = function() {
            //     // bctx.drawImage(beetle, (-WIDTH / 18) - 5, -HEIGHT / 36, CARLENGTH, CARWIDTH);
            //     let pat = bctx.createPattern(grass, "repeat");
            //     // bctx.rect(0, 0, WIDTH, HEIGHT);
            //     bctx.fillStyle = pat;
            //     bctx.fillRect(0, 0, WIDTH, HEIGHT);
            // }
            bctx.fillStyle = "darkgreen";
            bctx.fill();
        } else {
            // let asphalt = new Image();
            // asphalt.src = "asphalt.png";
            // asphalt.onload = function() {
            // bctx.drawImage(beetle, (-WIDTH / 18) - 5, -HEIGHT / 36, CARLENGTH, CARWIDTH);
            // let pat = bctx.createPattern(asphalt, "repeat");
            // bctx.rect(0, 0, WIDTH, HEIGHT);
            // bctx.fillRect(0, 0, WIDTH, HEIGHT);
            // bctx.fillStyle = pat;
            // }
            // bctx.fill();
            bctx.fillStyle = "lightgrey";
            bctx.fill();
        }
    }


}

// Create hull, upperHull and lowerHull
var hull = convexhull.makeHull(testTrack);
var upperHull = convexhull.findArcTan2(hull, true, TRACKSEMIWIDTH);
var lowerHull = convexhull.findArcTan2(hull, false, TRACKSEMIWIDTH);

// Prototype zip function
const zip = (arr, ...arrs) => {
    return arr.map((val, i) => arrs.reduce((a, arr) => [...a, arr[i]], [val]));
}
// console.log(zip(upperHull, lowerHull));


// Initialize starting angle, refresh rate and position of the car.

let angle = (hull[hull.length - 2].y - hull[hull.length - 3].y) / (hull[hull.length - 2].x - hull[hull.length - 3].x);
// console.log(angle);
let fps = 60;
let posx = hull[1].x;
let posy = hull[1].y;

// Create a set of markers to make sure pilot goes around the track
let markers = [hull[Math.floor(hull.length - 1)], hull[Math.floor(3 * (hull.length - 1) / 4)], hull[Math.floor((hull.length - 1) / 2)], hull[Math.floor((hull.length - 1) / 4)], hull[0]];

// Create random function for inserting obstacles in track
let randomObstacle = function (points) {
    return Math.floor((Math.random() * points.length));
}

// Create array of obstacles
function createObstacles(points) {
    var obstacles = [points[randomObstacle(points)]]
    let i = 0;
    while (i < 10) {
        let addPoint = true;
        let point = randomObstacle(points);
        if (point > 50) {
            for (let j = 0; j < obstacles.length; ++j) {
                // console.log(j, vecLength(obstacles[j], points[point].x, points[point].y));
                if (vecLength(obstacles[j], points[point].x, points[point].y) < 60) {
                    addPoint = false;
                    break;
                }
            }
            if (addPoint == true) {
                obstacles.push(hull[point]);
                ++i;
            }
        }
    }
    return obstacles;
}
// console.log(randomObstacle());

// Create the event handler to keydown
// Add a key equal to the keycode pressed and set it to false
// If key exists, set it equal to true

var keyState = new Object;
window.addEventListener('keydown', function (e) {
    if (e.which == 32 || e.which == 37 || e.which == 38 || e.which == 39 || e.which == 40) {
        keyState[e.which] = true;
    }
}, true);
// Create the event handler to keyup
// Add a key equal to the keycode pressed and set it to false
// If key exists, set it equal to false
window.addEventListener('keyup', function (e) {
    // console.log(e.which, e.keyCode);
    if (e.which == 32 || e.which == 37 || e.which == 38 || e.which == 39 || e.which == 40) {
        keyState[e.which] = false;
    }
}, true);



// Function that calculates the distance between 2 points
// Takes an object with x and y coordinates and another point's x and y coordinates
// as input parameters (Ended up this way due to the way I implemented the car's
// posx and posy)
function vecLength(a, x, y) {
    let distance = Math.sqrt(Math.pow(a.x - x, 2) + Math.pow(a.y - y, 2));
    return distance;
}

// Determines the index and distance of the car to the nearest
// midtrack point
function minDistance(track, posx, posy) {
    // Find closest point on the center track
    let distance = 0;
    let minindex = 0;
    for (let i = 0; i < track.length; ++i) {
        // console.log(hull[i].x);
        if (i == 0) {
            distance = vecLength(track[i], posx, posy);
        } else {
            if (vecLength(track[i], posx, posy) < distance) {
                distance = vecLength(track[i], posx, posy);
                minindex = i;
            } else {
                continue;
            }
        }
    }
    return { d: distance, i: minindex };
}

var beetle = new Image(); // Initialize the car image
var fspeed = 0;
let bspeed = 0;
let boostTimer = 10;
var lap = 1;
var markerIndex = 0;
var beetleSource = "";
var points = 0;
var obstacles = createObstacles(hull);
var time = 0;
var seconds = 0;
var minutes = 0;
// var time;


function mainMenu() {
    bctx.fillStyle = 'darkgreen';
    bctx.fillRect(0, 0, bcanvas.width, bcanvas.height);
    drawTrack(upperHull, "black", false, false);
    drawTrack(hull, "white", false, true);
    drawTrack(lowerHull, "black", true, false);
    bctx.fillStyle = "black";
    bctx.font = "80px Arial";
    bctx.fillText("Press ESC to start the game", 80, 100);
    bctx.font = "60px Arial";
    bctx.fillText("Refresh the page to select a new track", 40, 200);
    bctx.fillText("Use (Up, Down, Left, Right) arrows to steer the car", 40, 260);
    bctx.fillText("Use Space to ignite the boosters", 40, 320);
    bctx.font = "50px Arial";
    bctx.fillText("How To Play:", 80, HEIGHT / 2 + 50);
    bctx.font = "40px Arial";
    bctx.fillText("Drive the Beetle around the track", 90, HEIGHT / 2 + 100);
    bctx.fillText("The black and blue markers are worth 1 and -1 points", 90, HEIGHT / 2 + 140);
    bctx.fillText("Complete 3 laps in the least amount of time", 90, HEIGHT / 2 + 180);
    bctx.fillText("Your final score will depend on your points and time", 90, HEIGHT / 2 + 220);
}


function GameOn() {

    var animation = requestAnimationFrame(GameOn);
    if (gameState.pause) {
        
        window.cancelAnimationFrame(animation);
        bctx.beginPath();
        bctx.fillStyle = "black";
        // bctx.strokeStyle = "grey";
        bctx.font = "80px Arial";
        bctx.fillText("PAUSE", WIDTH / 2 - 90, HEIGHT / 2 - 20);

    } else if (lap == 4) {
        
        window.cancelAnimationFrame(animation);
        bctx.beginPath();
        bctx.fillStyle = "red";
        bctx.font = "60px Arial";
        let fpoints = -Math.floor(Math.sqrt(minutes + seconds/60)) + Math.pow(points, 3);
        bctx.fillText("You made " + fpoints + " ultra driving points", 180, HEIGHT / 2 - 20);
        bctx.fillText("Refresh the page to restart", 220, HEIGHT / 2 + 60);


    } else {

        let distIndex = minDistance(hull, posx, posy);

        // Handle keys being pressed and update position
        if ((posx > (CARLENGTH) * Math.cos(angle) && posx < (WIDTH - ((CARLENGTH) * Math.abs(Math.cos(angle))))) && (posy > (CARLENGTH) * Math.sin(angle) && posy < HEIGHT - ((CARLENGTH) * Math.abs(Math.sin(angle))))) {
            // Check booster action and refresh boosterTimer to 10
            if (boostTimer < 10 && keyState[32] == false) {
                boostTimer += 0.05;
            }

            // Aceleration Logic
            if (keyState[38]) {
                // Check if the car is not inside the track, if it isn't, the top speed is cut in half
                if (distIndex.d > TRACKSEMIWIDTH) {
                    if (fspeed > (MAXFSPEED / 2) + 1) {
                        fspeed = fspeed - MAXDCCEL / 4;
                    } else {
                        if (keyState[32] && boostTimer > 0) {
                            fspeed = (fspeed < (2 * MAXFSPEED)) ? fspeed + MAXACCEL : MAXFSPEED / 1.5;
                            boostTimer -= 0.1;
                        } else {
                            fspeed = (keyState[38] && fspeed < MAXFSPEED / 2) ? fspeed + MAXACCEL : MAXFSPEED / 2;
                        }
                    }
                } else {
                    if (keyState[32] && boostTimer > 0 && fspeed < 2 * MAXFSPEED) {
                        fspeed += MAXACCEL;
                        boostTimer -= 0.1;
                    } else {
                        if (fspeed > (MAXFSPEED) + 1) {
                            fspeed = fspeed - MAXDCCEL;
                        } else {
                            fspeed = (keyState[38] && fspeed < MAXFSPEED) ? fspeed + MAXACCEL : MAXFSPEED;
                        }
                    }
                }
                //Implement booster action
                // Determine the car's angle for turns and updates the x and y position accordingly
                angle += (keyState[38] && keyState[37]) ? -0.1 * fspeed / 6 : 0; //37
                angle += (keyState[38] && keyState[39]) ? 0.1 * fspeed / 6 : 0; //39
                posx -= fspeed * Math.cos(angle);
                posy -= fspeed * Math.sin(angle);
            } else {
                // Deccelerates the car
                fspeed = (fspeed > 0) ? fspeed - MAXDCCEL : 0;
                angle += (fspeed != 0 && keyState[37]) ? -0.1 * fspeed / 6 : 0; //37
                angle += (fspeed != 0 && keyState[39]) ? 0.1 * fspeed / 6 : 0; //39
                posx -= fspeed * Math.cos(angle);
                posy -= fspeed * Math.sin(angle);
            }
            // Implement the backward motion
            if (keyState[40]) {// || keyState[37]) {
                bspeed = (bspeed < MAXBSPEED) ? bspeed + 0.15 : MAXBSPEED;
                angle += (keyState[40] && keyState[37]) ? 0.1 * bspeed / 3 : 0; //37
                angle += (keyState[40] && keyState[39]) ? -0.1 * bspeed / 3 : 0; //39
                posx += bspeed * Math.cos(angle);
                posy += bspeed * Math.sin(angle);
            } else {
                // Implement the backward decceleration
                bspeed = (bspeed > 0) ? bspeed - .35 : 0;
                angle += (bspeed != 0 && keyState[37]) ? 0.1 * bspeed / 3 : 0; //37
                angle += (bspeed != 0 && keyState[39]) ? -0.1 * bspeed / 3 : 0; //39
                posx += bspeed * Math.cos(angle);
                posy += bspeed * Math.sin(angle);
            }

            // Set the car file source depending on whether there are boosters or not.
            beetleSource = (keyState[32] && boostTimer > 0) ? "beetle-booster.png" : "beetle-nobooster.png";
        } else {
            // Bring the car back to the canvas if the outer limit of the canvas is reached
            if (fspeed != 0 && bspeed == 0) {
                fspeed = 0;
                // bspeed = 3;
                bspeed = (fspeed == 0) ? 5 : bspeed - .5;
                posx += bspeed * Math.cos(angle);
                posy += bspeed * Math.sin(angle);
            }
            else {
                bspeed = 0;
                // bspeed = 3;
                fspeed = (bspeed == 0) ? 5 : bspeed - .5;
                posx -= fspeed * Math.cos(angle);
                posy -= fspeed * Math.sin(angle);
            }
        }
        // // Print the speed on the screen
        // if (fspeed) {
        //     speed.innerHTML = speed.innerHTML.slice(0,5) + " " + Math.floor(MAXFSPEED*100/(1 + Math.pow(Math.E, -0.5*(fspeed)))- (MAXFSPEED*50)) + " mph";
        // } else {
        //     speed.innerHTML = speed.innerHTML.slice(0,5) + " " + Math.floor(MAXBSPEED*100/(1 + Math.pow(Math.E, -0.5*(bspeed)))- (MAXBSPEED*50)) + " mph";
        // }

        // Count the laps based on the markers
        if (vecLength(markers[markerIndex], posx, posy) < TRACKSEMIWIDTH) {
            markerIndex += 1;
            // console.log(markerIndex, lap);
            if (markerIndex == 5) {
                markerIndex = 0;
                lap += 1;
                obstacles = createObstacles(hull);
            }
            // laps.innerHTML = laps.innerHTML.slice(0,6) + " " + lap;
        }


        // Draw everything
        beetle.onload = function () {
            // Draw the track zoomed by 4 and center at the car's position
            bctx.transform(6, 0, 0, 6, -5 * posx, -5 * posy);
            // bctx.fillStyle = 'rgba(0, 255, 20, 1.)';
            bctx.fillStyle = 'darkgreen';
            bctx.fillRect(0, 0, bcanvas.width, bcanvas.height);
            drawTrack(upperHull, "black", false, false);
            drawTrack(hull, "white", false, true);
            drawTrack(lowerHull, "black", true, false);

            // Draw obstacles
            bctx.fillStyle = 'blue';
            for (let i = 0; i < obstacles.length; ++i) {
                if (i % 2 == 0) {
                    bctx.fillStyle = "black";
                    bctx.fillRect(obstacles[i].x, obstacles[i].y, 10, 10);
                    if (vecLength(obstacles[i], posx, posy) < 10) {
                        obstacles.splice(i, 1);
                        points += 1;
                    }
                } else {
                    bctx.fillStyle = "blue";
                    bctx.fillRect(obstacles[i].x, obstacles[i].y, OBSTACLE_WH, OBSTACLE_WH);
                    if (vecLength(obstacles[i], posx, posy) < 10) {
                        obstacles.splice(i, 1);
                        points -= 1;
                    }
                }
            }

            bctx.resetTransform();
            // bctx.restore();

            bctx.save();
            bctx.translate(posx, posy);

            bctx.rotate(angle);

            bctx.drawImage(beetle, (-WIDTH / 18) - 5, -HEIGHT / 36, CARLENGTH, CARWIDTH); // Draw Beetle slightly offcenter to make turns more realistic


            bctx.restore();
            // console.log(angle);
        }
        beetle.src = beetleSource;



        // Draw text
        bctx.beginPath();
        bctx.fillStyle = "black";
        // bctx.strokeStyle = "grey";
        bctx.font = "60px Arial";
        bctx.fillText("Lap: " + lap, 10, 50);

        if (fspeed) {
            bctx.fillText("Speed: " + Math.floor(MAXFSPEED * 100 / (1 + Math.pow(Math.E, -0.5 * (fspeed))) - (MAXFSPEED * 50)) + " mph", 10, 100);
        } else {
            bctx.fillText("Speed: " + Math.floor(MAXBSPEED * 100 / (1 + Math.pow(Math.E, -0.5 * (bspeed))) - (MAXBSPEED * 50)) + " mph", 10, 100);
        }

        bctx.font = "40px Arial";
        bctx.fillText("Booster", WIDTH - 300, 80);
        bctx.beginPath();
        bctx.fillRect(WIDTH - 150, 50, 100 * (boostTimer / 10), 35);
        bctx.font = "40px Arial";
        bctx.fillText("Points: " + points, WIDTH - 300, 120);
        // console.log(gameState.pause);
        time += 1/60;
        seconds = Math.floor(time);
        if (seconds == 60) {
            time = 0;
            minutes += 1;
        }
        bctx.font = "40px Arial";
        bctx.fillText("Time: " + minutes + " minutes and " + seconds + " seconds", 350, 40);
    }
}

// Initiate the gameloop
var gameState = { pause: true };
mainMenu();
window.addEventListener('keypress', function (e) {
    if (e.keyCode == 27) {
        gameState.pause = !gameState.pause;
        GameOn();
    }
}, true);
// GameOn();
