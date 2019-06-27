// const math = require("mathjs");
// const readline = require('readline')

Reset = "\x1b[0m";
Bright = "\x1b[1m";
Dim = "\x1b[2m";
Underscore = "\x1b[4m";
Blink = "\x1b[5m";
Reverse = "\x1b[7m";
Hidden = "\x1b[8m";

FgBlack = "\x1b[30m";
FgRed = "\x1b[31m";
FgGreen = "\x1b[32m";
FgYellow = "\x1b[33m";
FgBlue = "\x1b[34m";
FgMagenta = "\x1b[35m";
FgCyan = "\x1b[36m";
FgWhite = "\x1b[37m";

BgBlack = "\x1b[40m";
BgRed = "\x1b[41m";
BgGreen = "\x1b[42m";
BgYellow = "\x1b[43m";
BgBlue = "\x1b[44m";
BgMagenta = "\x1b[45m";
BgCyan = "\x1b[46m";
BgWhite = "\x1b[47m";

function print(value) {
  const precision = 14;
  console.log(math.format(value, precision));
}

function rangeClosedOpen(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function ranBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var Segment = { none: 0, type1: 1, type2: 2 };
Segment.length = Object.keys(Segment).length;
Object.freeze(Segment);

function validProportions(proportions) {
  var total = 0.0;
  var positive = true;

  proportions.forEach(number => {
    positive = positive && 0 <= number;
  });

  if (positive)
    proportions.forEach(fraction => {
      total += fraction;
    });

  return positive && total <= 1;
}

// verify total proportions are smaller than total vacancy
function populate(mat, height, width, population, proportions) {
  for (var j = 0; j < proportions.length; j++) {
    if (j == Segment.none) continue;
    for (var i = 0; i < Math.floor(population * proportions[j]); i++) {
      var x, y;

      do {
        y = rangeClosedOpen(0, height);
        x = rangeClosedOpen(0, width);
      } while (mat[y][x] != Segment.none);
      mat[y][x] = j;
    }
  }
  return mat;
}

function printMat(mat) {
  // mat.forEach(e => {
  //   console.log(e);
  // });
  for (var i = 0; i < mat.length; i++) {
    var line = " ";
    for (var j = 0; j < mat[0].length; j++) {
      if (unconfortable(mat, i, j, mat[i][j], segmentRatio)) {
        line += FgRed + mat[i][j] + Reset + " ,";
      } else line += FgGreen + mat[i][j] + Reset + " ,";
    }
    console.log("[" + line + "]");
    line = "";
  }
  console.log();
}

function unconfortable(mat, x, y, seg, segmentRatio) {
  if (seg == Segment.none) return false;
  var counter = Array(Segment.length).fill(0);

  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 3; j++) {
      var newX = x - i + 1;
      var newY = y - j + 1;

      if (
        newX >= 0 &&
        newX < mat[0].length &&
        newY >= 0 &&
        newY < mat.length &&
        !(i == 1 && j == 1)
      ) {
        counter[mat[newY][newX]]++;
      }
    }
  }

  return counter[seg] / counter.reduce((a, b) => a + b, 0) < segmentRatio;
  // counter
  //.filter((value, index, arr) => index != Segment.none && seg != index)
  //.reduce((a, b) => a + b, 0);
}

function countUnconfortable(mat, segmentRatio) {
  var discomforted = 0;
  for (var i = 0; i < mat.length; i++) {
    for (var j = 0; j < mat[0].length; j++) {
      if (unconfortable(mat, i, j, mat[i][j], segmentRatio)) discomforted++;
    }
  }
  return discomforted;
}

function shuffle(mat, segmentRatio) {
  var movingNeighbors = Array();
  for (var i = 0; i < mat.length; i++) {
    for (var j = 0; j < mat[0].length; j++) {
      if (unconfortable(mat, i, j, mat[i][j], segmentRatio))
        movingNeighbors.push({ i, j });
    }
  }

  for (var i = 0; i < movingNeighbors.length; i++) {
    var x, y;

    var oldhomeY = movingNeighbors[i].i;
    var oldhomeX = movingNeighbors[i].j;

    do {
      y = rangeClosedOpen(0, mat.length);
      x = rangeClosedOpen(0, mat[0].length);
    } while (mat[y][x] != Segment.none);

    mat[y][x] = mat[oldhomeY][oldhomeX];
    mat[oldhomeY][oldhomeX] = Segment.none;
  }
}

function sleep(miliseconds) {
  var currentTime = new Date().getTime();

  while (currentTime + miliseconds >= new Date().getTime()) {}
}

function runShelling(a, segmentRatio, populationSize) {
  var prevDiscomforted = populationSize + 2;

  var discomforted = populationSize + 1;

  var iterationCount = 0;

  while (discomforted != 0 && iterationCount < 200) {
    iterationCount++;

    prevDiscomforted = discomforted;
    shuffle(a, segmentRatio);
    discomforted = countUnconfortable(a, segmentRatio);

    // {
    // printMat(a);
    // console.log(prevDiscomforted, discomforted);
    // if (discomforted == prevDiscomforted) {
    //   sleep(1000);
    // }
    // }
  }
  return iterationCount;
}

function main() {
  var runXtimes = 100;
  var histogram = [];

  var cityHeight = 10;
  var cityWidth = 10;

  var occupancy = 0.4;
  var populationSize = cityHeight * cityWidth * occupancy;

  var proportions = Array(Segment.length).fill(0);

  proportions[Segment.none] = 0;
  proportions[Segment.type1] = 0.4;
  proportions[Segment.type2] = 0.6;

  if (!validProportions(proportions)) {
    console.log("invalid proportions list.");
  }

  //print(proportions);

  var segmentRatio = 0.25;

  for (var i = 0; i < runXtimes; i++) {
    var a = Array(cityHeight)
      .fill()
      .map(() => Array(cityWidth).fill(0));

    populate(a, cityHeight, cityWidth, populationSize, proportions);
    var howlong = runShelling(a, segmentRatio, populationSize);

    var index = howlong.toString();
    if (histogram[index] == null) histogram[index] = 1;
    else histogram[index] = histogram[index] + 1;
    9;
  }

  return histogram;
}

function printSparseMat(a) {
  a.forEach((value, index) => console.log(index + ":" + value + " "));
}

printSparseMat(main());
