// const math = require("mathjs");
// const readline = require('readline')
// const seed = require("./node_modules/seedrandom/seedrandom.min.js");
// const seedrandom = require("seedrandom");
// import "node_modules/seedrandom/seedrandom.js";

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

var Segment = { none: 0, type1: 1, type2: 2 };
Object.freeze(Segment);
// exports.Segment = Segment;

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
  var allPositive = true;
  let epsilon = 0.0000001;

  populationProportions.forEach(number => {
    allPositive = allPositive && 0 - epsilon < number;
    total += number;
  });

  return allPositive && total < 1 + epsilon;
}

// exports.printMat = printMat;

// Assumes that only the first square is populated
function getInitialPopulation(params) {
  return params.cityHeight * params.cityWidth * params.occupancy;
}

// verify total populationProportions are smaller than total vacancy
function populate(cityMat, params) {
  var { cityHeight, cityWidth, populationProportions } = params;
  var populationSize = getInitialPopulation(params);

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

// exports.populate = populate;

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

function printMatUpdated(mat, updatedResidencies, params) {
  // mat.forEach(e => {
  //   console.log(e);
  // });
  var { segmentRatio } = params;
  console.log("[");
  for (var i = 0; i < mat.length; i++) {
    var line = " ";
    for (var j = 0; j < mat[0].length; j++) {
      var u = unconfortable(mat, i, j, mat[i][j], params);
      var s = searchForArray(updatedResidencies, [i, j]) >= 0;
      if (u && s) {
        line += FgMagenta + mat[i][j] + Reset + " ,";
        sleep(1000);
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

// exports.printMatUpdated = printMatUpdated;

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

function unconfortable(mat, i, j, seg, params) {
  var { segmentRatio } = params;

  if (seg === Segment.none) return false;

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

// exports.unconfortable = unconfortable;

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

function shuffle2(mat, params, mat2, params2) {
  var movingNeighbors = Array();
  var updatedResidencies = Array(); //only for debug
  var updatedResidencies2 = Array();

  for (var i = 0; i < mat.length; i++) {
    for (var j = 0; j < mat[0].length; j++) {
      if (unconfortable(mat, i, j, mat[i][j], params))
        movingNeighbors.push([i, j]);
    }
  }

  for (var k = 0; k < movingNeighbors.length; k++) {
    var oldhomeM = movingNeighbors[k][0];
    var oldhomeN = movingNeighbors[k][1];
    newHouseFound = false;

    // Perhaps the discomfort corrected itself, so let's check before moving
    if (
      unconfortable(mat, oldhomeM, oldhomeN, mat[oldhomeM][oldhomeN], params)
    ) {
      // We chose a random number from the potential residencies including the new neighborhood
      var mat1Len = mat.length * mat[0].length;
      var mat2Len = mat2.length * mat2[0].length;

      // Each possible residency has a unique number so we chose a random number in this range
      // We will start sequentially looking for a free place that we can move into
      // this guarantees us that we looked everywhere if we end up at lorig
      var l = rangeClosedOpen(0, mat1Len + mat2Len);
      var lOrig = l;

      do {
        var citySource, cityDest;
        var location = l;
        var destParams;

        if (l < mat1Len) {
          citySource = cityDest = mat;
          destParams = params;
        } else {
          citySource = mat;
          cityDest = mat2;
          location -= mat1Len; // let's make l relative to the destination matrix
          destParams = params2;
        }
        // console.log(cityDest);

        // find row
        var m = Math.floor(location / cityDest.length);

        // find column
        var n = location % cityDest[0].length;
        // console.log(location, m, n);

        // We will start sequentially looking for a free place that we can move into
        // this guarantees us that we looked everywhere if we end up at lorig
        l = (l + 1) % (mat1Len + mat2Len);
        // console.log("Total", mat1Len, mat2Len);
        // Debugging, pay no atten

        // If the cell is empty then see if it's a match
        if (cityDest[m][n] == Segment.none) {
          // We can potentially move to this location, let's try
          cityDest[m][n] = citySource[oldhomeM][oldhomeN];
          citySource[oldhomeM][oldhomeN] = Segment.none;

          // check if he will be confortable in the new location if not, keep searching

          if (unconfortable(cityDest, m, n, cityDest[m][n], destParams)) {
            citySource[oldhomeM][oldhomeN] = cityDest[m][n];
            cityDest[m][n] = Segment.none;
            newHouseFound = false;
            // console.log("not confortable");
          } else {
            // if we find a match then stay there!
            newHouseFound = true;
            // console.log("found a confortable");
          }
        }
        // console.log("k", k, newHouseFound, l, lOrig);
      } while (!newHouseFound && l != lOrig);

      if (newHouseFound) {
        if (cityDest == citySource) updatedResidencies.push([m, n]);
        else updatedResidencies2.push([m, n]);

        updatedResidencies.push([oldhomeM, oldhomeN]);
      }
    }

    // Debug print
    // printMatUpdated(mat, updatedResidencies, params);
    updatedResidencies = [];

    // Debug print
    // printMatUpdated(mat2, updatedResidencies2, params2);
    updatedResidencies2 = [];
    // console.log(k, movingNeighbors.length, newHouseFound);
  }

  // if we ran out of options then return false for failing
  return k == movingNeighbors.length;
}

// exports.shuffle2 = shuffle2;

function runShelling(mat, params) {
  var populationSize = getInitialPopulation(params);
  var prevDiscomforted = populationSize + 2;

  var discomforted = populationSize + 1;
  var segmentedCount = [];
  segmentedCount.push(countSegmented(mat, params));

  var iterationCount = 0;

  /// This iteration count is only supposed to make sure that the program does not go into infinite loop
  let cutoffIteration = 2000;

  while (discomforted != 0 && iterationCount < cutoffIteration) {
    iterationCount++;
    //console.log("Discomfort ", discomforted, ",iteration", iterationCount);
    prevDiscomforted = discomforted;

    if (!shuffle(mat, params)) {
      console.error("Error finding a new place for a neighbor");
      return [-1, segmentedCount, "Error finding a new place for a neighbor"];
    }

    discomforted = countUnconfortable(mat, params);

    segmentedCount.push(countSegmented(mat, params));

    // Debug Between shuffle iterations
    // {
    //   printMat(mat, params);
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

// exports.runShelling = runShelling;

Array.prototype.remove = function() {
  var what,
    a = arguments,
    L = a.length,
    ax;
  while (L && this.length) {
    what = a[--L];
    while ((ax = this.indexOf(what)) !== -1) {
      this.splice(ax, 1);
    }
  }
  return this;
};

function runShelling2(mat, params, mat2, params2) {
  var populationSize = getInitialPopulation(params);
  var prevDiscomforted = populationSize + 2;

  var discomforted = populationSize + 1;
  var segmentedCount = [];
  segmentedCount.push(
    countSegmented(mat, params) + countSegmented(mat2, params2)
  );

  var iterationCount = 0;

  /// This iteration count is only supposed to make sure that the program does not go into infinite loop
  let cutoffIteration = 2000;

  while (discomforted != 0 && iterationCount < cutoffIteration) {
    iterationCount++;
    //console.log("Discomfort ", discomforted, ",iteration", iterationCount);
    prevDiscomforted = discomforted;

    if (
      !shuffle2(mat, params, mat2, params2) ||
      !shuffle2(mat2, params2, mat, params)
    ) {
      console.error("Error finding a new place for a neighbor");
      return [-1, segmentedCount, "Error finding a new place for a neighbor"];
    }

    discomforted =
      countUnconfortable(mat, params) + countUnconfortable(mat2, params2);

    segmentedCount.push(
      countSegmented(mat, params) + countSegmented(mat2, params2)
    );

    // Debug Between shuffle iterations
    // {
    //   printMat(mat, params);
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

// exports.runShelling2 = runShelling2;

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
  var populationSize = getInitialPopulation(params);
  params.populationSize = populationSize;

  var histogram = [];

  params.populationProportions = params.populationProportions.map(number => {
    return parseFloat(number);
  });

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

    var index = howLong.toString(); // string index is to force sparse matrix
    if (histogram[index] == null) histogram[index] = 1;
    else histogram[index] = histogram[index] + 1;
  }
  return histogram;
}
// exports.runXtimes = runXtimes;

function printSparseMat(a) {
  a.forEach((value, index) => console.log(index + ":" + value + " "));
}
// exports.printSparseMat = printSparseMat;

function test() {
  var params = {
    runXtimes: 3,
    cityHeight: 30,
    cityWidth: 30,
    occupancy: 0.9,
    populationProportions: [0, 0.6, 0.4],
    segmentRatio: 0.5,
    seed: "hello"
  };
  var params2 = {};

  Object.assign(params2, params);
  Object.assign(params2, { cityHeight: 10, cityWidth: 10 });

  function testRun0(params) {
    params.seed = "hello";
    Math.random = seedrandom(params.seed);

    var cityMat = Array(params.cityHeight)
      .fill()
      .map(() => Array(params.cityWidth).fill(0));

    populate(cityMat, params);

    printMat(cityMat, params);

    runShelling(cityMat, params);
    printMat(cityMat, params);
    printList(params);
  }

  function testRun1(params) {
    params.seed = "hello";
    // Math.random = seedrandom(params.seed);
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
    params.seed = "jh2df23dd23i";
    // Math.random = seedrandom(params.seed);
    var histogram = runXtimes(params);
    printSparseMat(histogram);
    console.log(Object.keys(histogram)); // TODO: this is where I left off
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

    return z[i][j] + ":" + unconfortable(z, i, j, z[i][j], params);
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

  function testRun5(params, params2) {
    params.seed = "sfefe";
    // Math.random = seedrandom(params.seed);
    params.occupancy = 1;
    params.populationProportions[1] = 0.1;
    params.populationProportions[2] = 0.9;

    params.cityWidth = params.cityHeight = 30;
    params2.cityWidth = params2.cityHeight = 10;

    var z = Array(params.cityHeight)
      .fill()
      .map(() => Array(params.cityWidth).fill(0));
    var b = Array(params2.cityHeight)
      .fill()
      .map(() => Array(params2.cityWidth).fill(0));

    populate(z, params);

    console.log(shuffle2(z, params, b, params2));
  }

  if (testRun3(params) === "1:false") console.log("passed testRun3");
  else console.log("failed testRun2");

  function testRun6(params, params2) {
    var params2 = {};

    Object.assign(params2, params);
    Object.assign(params2, { cityHeight: 10, cityWidth: 10 });

    params.seed = "sfefe";
    // Math.random = seedrandom(params.seed);
    params.occupancy = 1;
    params.populationProportions[1] = 0.1;
    params.populationProportions[2] = 0.9;

    params.cityWidth = params.cityHeight = 10;
    params2.cityWidth = params2.cityHeight = 5;

    var z = Array(params.cityHeight)
      .fill()
      .map(() => Array(params.cityWidth).fill(0));
    var b = Array(params2.cityHeight)
      .fill()
      .map(() => Array(params2.cityWidth).fill(0));

    populate(z, params);

    runShelling2(z, params, b, params2);
    printMat(z, params);
    printMat(b, params2);
  }

  // testRun1(params);
  testRun2(params, params2);
}

//test();
