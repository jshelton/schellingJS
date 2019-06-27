// const math = require("mathjs");
// const readline = require('readline')
// const seed = require("./node_modules/seedrandom/seedrandom.min.js");
//const seedrandom = require("seedrandom");
//import * from "seedrandom");

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

function init() {
  seedrandom.seedrandom("any string you like");
}

function rangeClosedOpen(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function ranBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function printMat(mat, params) {
  var { segmentRatio } = params;
  //   mat.forEach(e => {
  //     console.log(e);
  //   });
  console.log("[");
  for (var i = 0; i < mat.length; i++) {
    var line = " ";
    for (var j = 0; j < mat[0].length; j++) {
      if (unconfortable(mat, i, j, mat[i][j], params)) {
        line += FgRed + mat[i][j] + Reset + " ,";
      } else line += FgGreen + mat[i][j] + Reset + " ,";
    }
    console.log("[" + line + "],");
    line = "";
  }
  console.log("]");
}

function validProportions(populationProportions) {
  var total = 0.0;
  var positive = true;

  populationProportions.forEach(number => {
    positive = positive && 0 <= number;
  });

  if (positive)
    populationProportions.forEach(fraction => {
      total += fraction;
    });

  return positive && total <= 1;
}

function getPopulation(params) {
  return params.cityHeight * params.cityWidth * params.occupancy;
}

// verify total populationProportions are smaller than total vacancy
function populate(cityMat, params) {
  var { cityHeight, cityWidth, populationProportions } = params;
  var populationSize = getPopulation(params);

  for (var j = 0; j < populationProportions.length; j++) {
    if (j == Segment.none) continue;
    for (
      var i = 0;
      i < Math.floor(populationSize * populationProportions[j]);
      i++
    ) {
      var m, n;

      do {
        m = rangeClosedOpen(0, cityHeight);
        n = rangeClosedOpen(0, cityWidth);
      } while (cityMat[m][n] != Segment.none);
      cityMat[m][n] = j;
    }
  }
  return cityMat;
}

function searchForArray(haystack, needle) {
  var i, j, current;
  for (i = 0; i < haystack.length; ++i) {
    if (needle.length === haystack[i].length) {
      current = haystack[i];
      for (j = 0; j < needle.length && needle[j] === current[j]; ++j);
      if (j === needle.length) return i;
    }
  }
  return -1;
}

function printMatUpdated(mat, updatedResidencies, { segmentRatio }) {
  // mat.forEach(e => {
  //   console.log(e);
  // });
  console.log("[");
  for (var i = 0; i < mat.length; i++) {
    var line = " ";
    for (var j = 0; j < mat[0].length; j++) {
      var u = unconfortable(mat, i, j, mat[i][j], { segmentRatio });
      var s = searchForArray(updatedResidencies, [i, j]) >= 0;
      if (u && s) {
        line += FgMagenta + mat[i][j] + Reset + " ,";
      } else if (u) {
        line += FgRed + mat[i][j] + Reset + " ,";
      } else if (s) {
        line += FgCyan + mat[i][j] + Reset + " ,";
      } else {
        line += FgGreen + mat[i][j] + Reset + " ,";
      }
    }
    console.log("[" + line + "],");
    line = "";
  }
  console.log("]");
}

function segmented(mat, x, y, seg) {
  if (seg == Segment.none) return false;
  var counter = Array(Object.keys(Segment).length).fill(0);

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

  return (
    counter.filter(
      (value, index, arr) => index != Segment.none && index != seg
    ) == 0
  );
}

function unconfortable(mat, i, j, seg, { segmentRatio }) {
  if (seg == Segment.none) return false;
  var counter = Array(Object.keys(Segment).length).fill(0);

  for (var m = 0; m < 3; m++) {
    for (var n = 0; n < 3; n++) {
      var newI = i - m + 1;
      var newJ = j - n + 1;

      if (
        newI >= 0 &&
        newI < mat[0].length &&
        newJ >= 0 &&
        newJ < mat.length &&
        !(m == 1 && n == 1)
      ) {
        counter[mat[newI][newJ]]++;
      }
    }
  }

  var totalSurroundingPop = counter
    .filter((value, index, arr) => index != Segment.none)
    .reduce((a, b) => a + b, 0);

  // Debugging rituals
  //   console.log(
  //     "       Disconfort:",
  //     counter[seg] / totalSurroundingPop < segmentRatio,
  //     " i:",
  //     i,
  //     " j:",
  //     j,
  //     "seg:",
  //     seg,
  //     " totalSurroundingPop:",
  //     totalSurroundingPop,
  //     " counter:",
  //     counter
  //   );

  return counter[seg] / totalSurroundingPop < segmentRatio;
}

function countUnconfortable(mat, params) {
  var discomforted = 0;
  for (var i = 0; i < mat.length; i++) {
    for (var j = 0; j < mat[0].length; j++) {
      if (unconfortable(mat, i, j, mat[i][j], params)) discomforted++;
    }
  }
  return discomforted;
}

function countSegmented(mat, params) {
  var segmentedCount = 0;
  for (var i = 0; i < mat.length; i++) {
    for (var j = 0; j < mat[0].length; j++) {
      if (segmented(mat, i, j, mat[i][j], params)) segmentedCount++;
    }
  }
  return segmentedCount;
}

function shuffle(mat, params) {
  var movingNeighbors = Array();
  var updatedResidencies = Array(); //only for debug
  var newHouseFound = false;

  for (var i = 0; i < mat.length; i++) {
    for (var j = 0; j < mat[0].length; j++) {
      if (unconfortable(mat, i, j, mat[i][j], params))
        movingNeighbors.push([i, j]);
    }
  }

  for (var k = 0; k < movingNeighbors.length; k++) {
    var oldhomeM = movingNeighbors[k][0];
    var oldhomeN = movingNeighbors[k][1];

    // Perhaps the discomfort corrected itself, so let's check before moving
    if (
      unconfortable(mat, oldhomeM, oldhomeN, mat[oldhomeM][oldhomeN], params)
    ) {
      var potentialMoves = 0;

      var l = rangeClosedOpen(0, mat.length * mat[0].length);
      var lOrig = l;

      do {
        var m = Math.floor(l / mat.length);
        var n = l % mat[0].length;
        l = (l + 1) % (mat.length * mat[0].length);

        // Debugging, pay no attention
        // {
        // console.log(
        //   "Discomfort:",
        //   unconfortable(mat, m, n, mat[oldhomeM][oldhomeN], params),
        //   m,
        //   n,
        //   mat[oldhomeM][oldhomeN],
        //   params
        // );
        // }

        // If the cell is empty then see if it's a match
        if (mat[m][n] == Segment.none) {
          mat[m][n] = mat[oldhomeM][oldhomeN];
          mat[oldhomeM][oldhomeN] = Segment.none;

          // check if he will be confortable in the new location if not, keep searching
          //    Debugging, pay no attention

          //   console.log(
          //     "Discomfort:",
          //     unconfortable(mat, m, n, mat[m][n], params),
          //     m,
          //     n,
          //     mat[m][n],
          //     params
          //   );

          if (unconfortable(mat, m, n, mat[m][n], params)) {
            mat[oldhomeM][oldhomeN] = mat[m][n];
            mat[m][n] = Segment.none;
            newHouseFound = false;
          } else {
            // if we find a match then stay there!
            newHouseFound = true;
          }
        }
      } while (!newHouseFound && l != lOrig);

      updatedResidencies.push([m, n]);
      updatedResidencies.push([oldhomeM, oldhomeN]);
    }
    //printMatUpdated(mat, updatedResidencies, params);
    updatedResidencies = [];
  }
  // if we ran out of options then return false for failing
  return newHouseFound;
}

function sleep(miliseconds) {
  var currentTime = new Date().getTime();

  while (currentTime + miliseconds >= new Date().getTime()) {}
}

function runShelling(a, params) {
  var { segmentRatio } = params;
  var populationSize = getPopulation(params);
  var prevDiscomforted = populationSize + 2;

  var discomforted = populationSize + 1;
  var segmentedCount = [];
  segmentedCount.push(countSegmented(a, params));

  var iterationCount = 0;

  while (discomforted != 0 && iterationCount < 2000) {
    iterationCount++;
    //console.log("Discomfort ", discomforted, ",iteration", iterationCount);
    prevDiscomforted = discomforted;

    if (!shuffle(a, params)) {
      console.error("Error finding a new place for a neighbor");
      return [-1, segmentedCount, "Error finding a new place for a neighbor"];
    }

    discomforted = countUnconfortable(a, params);

    segmentedCount.push(countSegmented(a, params));

    // Debug Between shuffle iterations
    // {
    //   printMat(a, params);
    //   console.log(
    //     "#Prev Discomfort: ",
    //     prevDiscomforted,
    //     "#Current Discomfort: ",
    //     discomforted
    //   );
    //   if (discomforted == prevDiscomforted) {
    //     sleep(500);
    //   }
    //console.log("Finished Iteration", iterationCount);
    // }
  }

  return [iterationCount, segmentedCount];
}

function printList(params) {
  var {
    runXtimes,
    segmentRatio,
    cityHeight,
    cityWidth,
    occupancy,
    populationProportions,
    seed
  } = params;
  list = [
    { runXtimes },
    { cityHeight },
    { cityWidth },
    { occupancy },
    { populationProportions },
    { segmentRatio },
    { seed }
  ];

  // Print the state of the parameters for reference
  const printVar = varObj =>
    console.log(Object.keys(varObj)[0] + ": " + Object.values(varObj)[0]);

  list.forEach(printVar);
}

function runXtimes(params) {
  var populationSize = getPopulation(params);
  params.populationSize = populationSize;

  var histogram = [];

  if (!validProportions(params.populationProportions)) {
    console.log("invalid populationProportions list.");
    return;
  }

  //printList(params);

  // Run to build a histogram with different generated cities
  for (var i = 0; i < params.runXtimes; i++) {
    var cityMat = Array(params.cityHeight)
      .fill()
      .map(() => Array(params.cityWidth).fill(0));

    populate(cityMat, params);

    // Debug
    // printMat(cityMat, params);

    var [howLong, segmentedCount] = runShelling(cityMat, params);

    // Debug
    // printMat(cityMat, params.segmentRatio);

    var index = howLong.toString();
    if (histogram[index] == null) histogram[index] = 1;
    else histogram[index] = histogram[index] + 1;
  }
  return histogram;
}

function printSparseMat(a) {
  a.forEach((value, index) => console.log(index + ":" + value + " "));
}

var Segment = { none: 0, type1: 1, type2: 2 };
Object.freeze(Segment);
var params = {
  runXtimes: 1,
  cityHeight: 10,
  cityWidth: 10,
  occupancy: 0.9,
  populationProportions: [0, 0.6, 0.4],
  segmentRatio: 0.5
};

function testRun0(params) {
  params.seed = "hello";
  Math.random = seedrandom(params.seed);

  var cityMat = Array(params.cityHeight)
    .fill()
    .map(() => Array(params.cityWidth).fill(0));

  populate(cityMat, params);

  printMat(cityMat, params);

  var [howLong, segmentedCount] = runShelling(cityMat, params);
  printMat(cityMat, params);
  printList(params);
}

function testRun1(params) {
  params.seed = "hello";
  Math.random = seedrandom(params.seed);
  var z = [
    [0, 0, 1, 0, 1, 0, 0],
    [1, 1, 2, 0, 0, 0, 0],
    [0, 1, 1, 0, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 2, 0],
    [0, 1, 1, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 2]
  ];
  printMat(z, params);
  runShelling(z, params);
  printMat(z, params);
  printList(params);
}
function testRun2(params) {
  //params.seed = "jh2df23dd23i";
  //Math.random = seedrandom(params.seed);
  var histogram = runXtimes(params);
  printSparseMat(histogram);
}

function testRun3(params) {
  z = [
    [1, 2, 0, 0, 1, 0, 1],
    [0, 0, 0, 0, 1, 0, 0],
    [1, 1, 1, 0, 0, 1, 0],
    [0, 0, 1, 0, 2, 0, 0],
    [2, 1, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 1, 1, 0],
    [1, 0, 0, 1, 0, 0, 0]
  ];

  var i = 2,
    j = 0;

  console.log(z[i][j] + ":" + unconfortable(z, i, j, z[i][j], params));
}
function testRun4(params) {
  var z = [
    [2, 0, 2, 0, 0, 0, 1],
    [0, 0, 1, 1, 1, 0, 0],
    [1, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 1],
    [1, 1, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 1, 0],
    [1, 0, 2, 0, 1, 0, 0]
  ];
  var b = [
    [2, 0, 2, 0, 0, 0, 1],
    [0, 0, 1, 1, 1, 0, 0],
    [1, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 1],
    [1, 1, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 1, 0],
    [1, 0, 2, 0, 1, 0, 0]
  ];
}

//testRun2(params);
