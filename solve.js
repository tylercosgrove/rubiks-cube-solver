let cornerOTable;
let edgeOTable;
let udSliceTable;
let pruningCornerO;
let pruningEdgeO;
let pruningUdSlice;
let cornerPTable;
let edgePTable;
let udSliceTableP2;
let pruningCornerP;
let pruningEdgeP;
let pruningUdSliceP2;

/**
 *
 * CONVERT FLAT STRING INTO EDGE/CORNER COORDS/ORIENTATIONS
 *
 */
const getCubeCoordinatesFromString = (cubeString) => {
  let cornerPieces = [];
  let edgePieces = [];

  for (let i = 0; i < CORNERS.length; i++) {
    const coords = FACELET_CORNERS[i];
    let thisCorner = [];
    let thisOrientation = 0;
    for (let xyz = 0; xyz < 3; xyz++) {
      const thisFacelet = cubeString.charAt(coords[xyz]);
      thisCorner.push(thisFacelet);
      if (thisFacelet == "U" || thisFacelet == "D") {
        thisOrientation = xyz;
      }
    }
    thisCorner = rearrangeLetters(thisCorner, CORNERS);
    thisCorner.push(thisOrientation);
    cornerPieces.push(thisCorner);
  }

  for (let i = 0; i < EDGES.length; i++) {
    const coords = FACELET_EDGES[i];
    let thisEdge = [];
    let thisOrientation = 0;
    for (let xy = 0; xy < 2; xy++) {
      thisEdge.push(cubeString.charAt(coords[xy]));
    }
    if (thisEdge.includes("U") || thisEdge.includes("D")) {
      thisOrientation = Math.max(thisEdge.indexOf("U"), thisEdge.indexOf("D"));
    } else {
      thisOrientation = Math.max(thisEdge.indexOf("F"), thisEdge.indexOf("B"));
    }
    thisEdge = rearrangeLetters(thisEdge, EDGES);
    thisEdge.push(thisOrientation);
    edgePieces.push(thisEdge);
  }

  return [cornerPieces, edgePieces];
};

const getCubeStringFromCoordinates = (cubeCornersShallow, cubeEdgesShallow) => {
  let cubeCorners = JSON.parse(JSON.stringify(cubeCornersShallow));
  let cubeEdges = JSON.parse(JSON.stringify(cubeEdgesShallow));

  let toReturn = "x".repeat(54);

  for (let i = 0; i < CORNERS.length; i++) {
    for (let j = 0; j < cubeCorners[i][3]; j++) {
      cubeCorners[i] = rotateArray(cubeCorners[i]);
    }

    const coords = FACELET_CORNERS[i];
    for (let xyz = 0; xyz < 3; xyz++) {
      toReturn = toReturn.substring(0, coords[xyz]) + cubeCorners[i][xyz] + toReturn.substring(coords[xyz] + 1);
    }
  }

  for (let i = 0; i < EDGES.length; i++) {
    for (let j = 0; j < cubeEdges[i][2]; j++) {
      cubeEdges[i] = rotateArray(cubeEdges[i]);
    }

    const coords = FACELET_EDGES[i];
    for (let xy = 0; xy < 2; xy++) {
      toReturn = toReturn.substring(0, coords[xy]) + cubeEdges[i][xy] + toReturn.substring(coords[xy] + 1);
    }
  }

  for (let i = 0; i < 6; i++) {
    toReturn = toReturn.substring(0, 4 + 9 * i) + CENTERS[i] + toReturn.substring(4 + 9 * i + 1);
  }

  return toReturn;
};

/**
 *
 * TRANSLATES BETWEEN TWO WAYS OF REPRESENTING COORDS
 *
 */
const convertIndexCoordsToLetter = (cubeCorners, cubeEdges) => {
  let updatedCubeCorners = [];
  let updatedCubeEdges = [];

  for (let i = 0; i < cubeCorners.length; i++) {
    updatedCubeCorners[i] = CORNERS[cubeCorners[i][0]].split("");
    updatedCubeCorners[i][3] = cubeCorners[i][1];
  }

  for (let i = 0; i < cubeEdges.length; i++) {
    updatedCubeEdges[i] = EDGES[cubeEdges[i][0]].split("");
    updatedCubeEdges[i][2] = cubeEdges[i][1];
  }

  return [updatedCubeCorners, updatedCubeEdges];
};

const convertLetterCoordsToIndex = (cubeCorners, cubeEdges) => {
  let updatedCubeCorners = [];
  let updatedCubeEdges = [];

  for (let i = 0; i < cubeCorners.length; i++) {
    updatedCubeCorners[i] = [CORNERS.indexOf(cubeCorners[i][0] + cubeCorners[i][1] + cubeCorners[i][2])];
    updatedCubeCorners[i][1] = cubeCorners[i][3];
  }

  for (let i = 0; i < cubeEdges.length; i++) {
    updatedCubeEdges[i] = [EDGES.indexOf(cubeEdges[i][0] + cubeEdges[i][1])];
    updatedCubeEdges[i][1] = cubeEdges[i][2];
  }

  return [updatedCubeCorners, updatedCubeEdges];
};

/**
 *
 * APPLIES A MOVE TO A CUBE
 *
 */
const applyMove = (cubeCorners, cubeEdges, moveCorners, moveEdges) => {
  let updatedCubeCorners = [];
  let updatedCubeEdges = [];

  for (let i = 0; i < moveCorners.length; i++) {
    updatedCubeCorners[i] = cubeCorners[moveCorners[i][0]].slice();
    updatedCubeCorners[i][3] = (updatedCubeCorners[i][3] + moveCorners[i][1]) % 3;
  }

  for (let i = 0; i < moveEdges.length; i++) {
    updatedCubeEdges[i] = cubeEdges[moveEdges[i][0]].slice();
    updatedCubeEdges[i][2] = (updatedCubeEdges[i][2] + moveEdges[i][1]) % 2;
  }
  return [updatedCubeCorners, updatedCubeEdges];
};

/**
 *
 * APPLIES A MOVE TO ANOTHER MOVE
 *
 */
const multMove = (cubeCorners, cubeEdges, moveCorners, moveEdges) => {
  let updatedCubeCorners = [];
  let updatedCubeEdges = [];
  for (let i = 0; i < moveCorners.length; i++) {
    updatedCubeCorners[i] = cubeCorners[moveCorners[i][0]].slice();
    updatedCubeCorners[i][1] = (updatedCubeCorners[i][1] + moveCorners[i][1]) % 3;
  }

  for (let i = 0; i < moveEdges.length; i++) {
    updatedCubeEdges[i] = cubeEdges[moveEdges[i][0]].slice();
    updatedCubeEdges[i][1] = (updatedCubeEdges[i][1] + moveEdges[i][1]) % 2;
  }
  return [updatedCubeCorners, updatedCubeEdges];
};

/**
 *
 * INVERS OF A MOVE (R -> R')
 *
 */
const getInverse = (cubeCorners, cubeEdges) => {
  let updatedCubeCorners = [];
  let updatedCubeEdges = [];

  for (let i = 0; i < cubeCorners.length; i++) {
    updatedCubeCorners[cubeCorners[i][0]] = [i, (-1 * cubeCorners[i][1] + 3) % 3];
  }
  for (let i = 0; i < cubeEdges.length; i++) {
    updatedCubeEdges[cubeEdges[i][0]] = [i, (-1 * cubeEdges[i][1] + 2) % 2];
  }

  return [updatedCubeCorners, updatedCubeEdges];
};

/**
 *
 * GETS COORDINATES FROM CUBE STATE
 *
 */
const getNumericalCubeCoordinates = (cubeCorners, cubeEdges) => {
  let cornerO = 0;
  for (let i = 0; i < cubeCorners.length - 1; i++) {
    // only need 7 corners, sum of all orientations must be divisible by 3
    cornerO += cubeCorners[i][3] * Math.pow(3, 6 - i);
  }

  // get edge orientation coordinate
  let edgeO = 0;
  for (let i = 0; i < cubeEdges.length - 1; i++) {
    edgeO += cubeEdges[i][2] * Math.pow(2, 10 - i);
  }

  // get corner permutation coordinate
  let cornerIndices = cubeCorners.map((corner) => {
    let key = corner[0] + corner[1] + corner[2];
    return CORNERS.indexOf(key);
  });
  let cornerP = 0;
  for (let i = cornerIndices.length - 1; i >= 1; i--) {
    let s = 0;
    for (let j = i - 1; j >= 0; j--) {
      if (cornerIndices[j] > cornerIndices[i]) {
        s++;
      }
    }
    cornerP = (cornerP + s) * i;
  }

  // get edge permutation coordinate
  let edgeIndices = cubeCorners.map((edge) => {
    let key = edge[0] + edge[1];
    return EDGES.indexOf(key);
  });
  let edgeP = 0;
  for (let i = edgeIndices.length - 1; i >= 1; i--) {
    let s = 0;
    for (let j = i - 1; j >= 0; j--) {
      if (edgeIndices[j] > edgeIndices[i]) {
        s++;
      }
    }
    edgeP = (edgeP + s) * i;
  }

  return [cornerO, edgeO, cornerP, edgeP];
};

const getUDSliceCoordFromLetter = (cubeEdges) => {
  const [bruh, convertedEdges] = convertLetterCoordsToIndex([], cubeEdges);

  let occupied = new Array(12).fill(false);

  for (let i = 0; i < EDGES.length; i++) {
    if (convertedEdges[i][0] >= 8) {
      occupied[i] = true;
    }
  }

  let s = 0,
    k = 3,
    n = 11;

  while (k >= 0) {
    if (occupied[n]) {
      k--;
    } else {
      s += binomialCoefficient(n, k);
    }
    n--;
  }

  return s;
};

const UDSliceCoord = (cubeEdges) => {
  let occupied = new Array(12).fill(false);

  for (let i = 0; i < EDGES.length; i++) {
    if (cubeEdges[i][0] >= 8) {
      occupied[i] = true;
    }
  }

  let s = 0,
    k = 3,
    n = 11;

  while (k >= 0) {
    if (occupied[n]) {
      k--;
    } else {
      s += binomialCoefficient(n, k);
    }
    n--;
  }

  return s;
};

const Phase2UDSliceCoord = (cubeEdges) => {
  const sliceEdges = [8, 9, 10, 11];
  let arr = [];
  for (let i = 0; i < cubeEdges.length; i++) {
    let e = cubeEdges[i][0];

    if (sliceEdges.includes(e)) {
      arr.push(e);
      if (arr.length === 4) break;
    }
  }

  let x = 0;
  for (let j = 3; j >= 1; j--) {
    let s = 0;
    for (let k = j - 1; k >= 0; k--) {
      if (arr[k] > arr[j]) {
        s++;
      }
    }
    x = (x + s) * j;
  }

  return x;
};

const InvPhase2UDSliceCoord = (w) => {
  let x = w % 24;
  let cubeEdges = InvUDSliceCoord(Math.floor(w / 24));

  let order = new Array(4);
  let used = new Array(12).fill(false);

  for (let i = 0; i < 4; i++) {
    order[i] = x % (i + 1);
    x = Math.floor(x / (i + 1));
  }

  for (let i = 3; i >= 0; i--) {
    let k = 11;
    while (used[k]) k--;

    while (order[i] > 0) {
      order[i]--;
      do {
        k--;
      } while (used[k]);
    }

    let m = -1;
    for (let j = 0; j < cubeEdges.length; j++) {
      let e = cubeEdges[j][0];
      if ([8, 9, 10, 11].includes(e)) {
        m++;
        if (m === i) {
          cubeEdges[j][0] = k;
          used[k] = true;
          break;
        }
      }
    }
  }

  return cubeEdges;
};

const CornOriCoord = (cubeCorners) => {
  let cornerO = 0;
  for (let i = 0; i < cubeCorners.length - 1; i++) {
    cornerO += cubeCorners[i][1] * Math.pow(3, 6 - i);
  }
  return cornerO;
};

const Phase2EdgePermCoord = (cubeEdges) => {
  let x = 0;

  for (let i = 7; i > 0; i--) {
    let s = 0;
    for (let j = i - 1; j >= 0; j--) {
      if (cubeEdges[j][0] > cubeEdges[i][0]) {
        s++;
      }
    }
    x = (x + s) * i;
  }

  return x;
};

const Phase2CornerPermCoord = (cubeCorners) => {
  let x = 0;

  for (let i = 7; i > 0; i--) {
    let s = 0;
    for (let j = i - 1; j >= 0; j--) {
      if (cubeCorners[j][0] > cubeCorners[i][0]) {
        s++;
      }
    }
    x = (x + s) * i;
  }

  return x;
};

const InvPhase2EdgePermCoord = (index) => {
  const cubeEdges = new Array(12).fill([-1, 0]);

  let used = new Array(EDGES.length).fill(false);
  let order = new Array(EDGES.length);

  for (let i = 0; i < 8; i++) {
    order[i] = index % (i + 1);
    index = Math.floor(index / (i + 1));
  }

  for (let i = 7; i >= 0; i--) {
    let k = 7;
    while (used[k]) k--;
    while (order[i] > 0) {
      order[i]--;
      do {
        k--;
      } while (used[k]);
    }
    cubeEdges[i] = [k, 0];
    used[k] = true;
  }

  for (let i = 8; i < 12; i++) {
    cubeEdges[i] = [i, 0];
  }

  return cubeEdges;
};

const InvPhase2CornerPermCoord = (index) => {
  const cubeEdges = new Array(8).fill([-1, 0]);

  let used = new Array(CORNERS.length).fill(false);
  let order = new Array(CORNERS.length);

  for (let i = 0; i < 8; i++) {
    order[i] = index % (i + 1);
    index = Math.floor(index / (i + 1));
  }

  for (let i = 7; i >= 0; i--) {
    let k = 7;
    while (used[k]) k--;
    while (order[i] > 0) {
      order[i]--;
      do {
        k--;
      } while (used[k]);
    }
    cubeEdges[i] = [k, 0];
    used[k] = true;
  }

  return cubeEdges;
};

const EdgeOriCoord = (cubeEdges) => {
  let edgeO = 0;
  for (let i = 0; i < cubeEdges.length - 1; i++) {
    edgeO = 2 * edgeO + cubeEdges[i][1];
  }
  return edgeO;
};

const InvUDSliceCoord = (coord) => {
  const occupied = new Array(12).fill(false);
  let n = 11,
    k = 3,
    v;
  const cubeEdges = Array.from({ length: 12 }, (element, index) => [index, 0]);
  while (k >= 0) {
    v = binomialCoefficient(n, k);
    if (coord < v) {
      occupied[n] = true;
      k--;
    } else {
      coord -= v;
    }
    n--;
  }

  let udSliceEdge = 8;
  for (let ed = 0; ed < EDGES.length; ed++) {
    if (occupied[ed]) {
      let found = false;
      for (let i = 0; i < EDGES.length && !found; i++) {
        if (cubeEdges[i][0] === udSliceEdge) {
          cubeEdges[i][0] = cubeEdges[ed][0];
          found = true;
        }
      }
      cubeEdges[ed][0] = udSliceEdge;
      if (udSliceEdge < 11) udSliceEdge++;
    }
  }
  return cubeEdges;
};

const InvCornOriCoord = (coord) => {
  const cubeCorners = new Array(8).fill([7, 0]);

  let parity = 0;

  for (let i = CORNERS.length - 2; i >= 0; i--) {
    const orientation = coord % 3;
    parity += orientation;
    cubeCorners[i] = [i, orientation];
    coord = Math.floor(coord / 3);
  }

  parity %= 3;
  switch (parity) {
    case 0:
      cubeCorners[CORNERS.length - 1][1] = 0;
      break;
    case 1:
      cubeCorners[CORNERS.length - 1][1] = 2;
      break;
    case 2:
      cubeCorners[CORNERS.length - 1][1] = 1;
      break;
  }

  return cubeCorners;
};

const InvEdgeOriCoord = (coord) => {
  const cubeEdges = new Array(12).fill([11, 0]);

  let parity = 0;

  for (let i = EDGES.length - 2; i >= 0; i--) {
    const orientation = coord % 2;
    parity += orientation;
    cubeEdges[i] = [i, orientation];
    coord = Math.floor(coord / 2);
  }

  cubeEdges[EDGES.length - 1][1] = parity % 2;

  return cubeEdges;
};

const rotateArray = (arr) => {
  const secondToLastElement = arr.splice(arr.length - 2, 1)[0];
  arr.unshift(secondToLastElement);
  return arr;
};

/**
 *
 * GENERATE MOVE TABLES
 *
 */
const generateRawCornerOTable = () => {
  let TwistMove = new Array(2187);
  for (let i = 0; i < TwistMove.length; i++) {
    TwistMove[i] = new Array(18); // 6 faces x 3 moves per face
    let currentCorners = InvCornOriCoord(i);

    for (let j = 0; j < 6; j++) {
      const [moveCorners, moveEdges] = getMoveFromIndex(j);
      let theseCorners = currentCorners.slice();
      for (let k = 0; k < 4; k++) {
        let [newCorners, bruh] = multMove(theseCorners, [], moveCorners, []);
        theseCorners = newCorners;
        if (k !== 3) {
          TwistMove[i][3 * j + k] = CornOriCoord(theseCorners);
        }
      }
    }
  }

  return TwistMove;
};

const generateRawCornerPTable = () => {
  let FlipMove = new Array(40320);

  // only available moves are U, U2, U', R2, F2, D, D2, D', L2, B2
  const availableMoves = [0, 1, 2, 4, 7, 9, 10, 11, 13, 16];

  for (let i = 0; i < FlipMove.length; i++) {
    FlipMove[i] = new Array(availableMoves.length);
    let currentCorners = InvPhase2CornerPermCoord(i);

    for (let j = 0; j < availableMoves.length; j++) {
      const [moveCorners, moveEdges] = getFullMoveFromIndex(availableMoves[j]);
      let [newCorners, bruh] = multMove(currentCorners, [], moveCorners, []);

      FlipMove[i][j] = Phase2CornerPermCoord(newCorners);
    }
  }

  return FlipMove;
};

const generateRawEdgePTable = () => {
  let FlipMove = new Array(40320);

  // only available moves are U, U2, U', R2, F2, D, D2, D', L2, B2
  const availableMoves = [0, 1, 2, 4, 7, 9, 10, 11, 13, 16];

  for (let i = 0; i < FlipMove.length; i++) {
    FlipMove[i] = new Array(availableMoves.length);
    let currentEdges = InvPhase2EdgePermCoord(i);

    for (let j = 0; j < availableMoves.length; j++) {
      const [moveCorners, moveEdges] = getFullMoveFromIndex(availableMoves[j]);
      let [bruh, newEdges] = multMove([], currentEdges, [], moveEdges);

      FlipMove[i][j] = Phase2EdgePermCoord(newEdges);
    }
  }

  return FlipMove;
};

const generateRawEdgeOTable = () => {
  let FlipMove = new Array(2048);

  for (let i = 0; i < FlipMove.length; i++) {
    FlipMove[i] = new Array(18); // 6 faces x 3 moves per face
    let currentEdges = InvEdgeOriCoord(i);

    for (let j = 0; j < 6; j++) {
      const [moveCorners, moveEdges] = getMoveFromIndex(j);
      let theseEdges = currentEdges.slice();
      for (let k = 0; k < 4; k++) {
        let [bruh, newEdges] = multMove([], theseEdges, [], moveEdges);
        theseEdges = newEdges;
        if (k !== 3) {
          FlipMove[i][3 * j + k] = EdgeOriCoord(theseEdges);
        }
      }
    }
  }

  return FlipMove;
};

const generateRawUDSliceTable = () => {
  let UDSliceMove = new Array(495);

  for (let i = 0; i < UDSliceMove.length; i++) {
    UDSliceMove[i] = new Array(18); // 6 faces x 3 moves per face
    let currentEdges = InvUDSliceCoord(i);

    for (let j = 0; j < 6; j++) {
      const [moveCorners, moveEdges] = getMoveFromIndex(j);
      let theseEdges = currentEdges.slice();
      for (let k = 0; k < 4; k++) {
        let [bruh, newEdges] = multMove([], theseEdges, [], moveEdges);
        theseEdges = newEdges;
        if (k !== 3) {
          UDSliceMove[i][3 * j + k] = UDSliceCoord(theseEdges);
        }
      }
    }
  }

  return UDSliceMove;
};

const generateRawUDSliceP2Table = () => {
  let UDSliceMove = new Array(24);

  const availableMoves = [0, 1, 2, 4, 7, 9, 10, 11, 13, 16];

  for (let i = 0; i < UDSliceMove.length; i++) {
    UDSliceMove[i] = new Array(availableMoves.length);
    let currentEdges = InvPhase2UDSliceCoord(i);

    for (let j = 0; j < availableMoves.length; j++) {
      const [moveCorners, moveEdges] = getFullMoveFromIndex(availableMoves[j]);
      let [bruh, newEdges] = multMove([], currentEdges, [], moveEdges);

      UDSliceMove[i][j] = Phase2UDSliceCoord(newEdges);
    }
  }

  return UDSliceMove;
};

/**
 *
 * GENERATE PRUNING TABLES
 *
 */
const generatePruningTable = (moveTable) => {
  let PruningTable = new Array(moveTable.length).fill(-1);
  let numPrunesFound = 0;
  let currentDepth = 0;

  PruningTable[0] = 0;

  while (currentDepth < PruningTable.length - 1) {
    let indicesAtDepth = [];
    PruningTable.forEach((element, index) => {
      if (element == currentDepth) {
        indicesAtDepth.push(index);
      }
    });

    for (j = 0; j < indicesAtDepth.length; j++) {
      for (let i = 0; i < 18; i++) {
        const newSpot = moveTable[indicesAtDepth[j]][i];
        if (PruningTable[newSpot] == -1) {
          PruningTable[newSpot] = currentDepth + 1;
          numPrunesFound += 1;
        }
      }
    }

    currentDepth += 1;
  }

  const maxVal = Math.max(...PruningTable);
  for (let i = 0; i < PruningTable.length; i++) {
    if (PruningTable[i] == -1) {
      PruningTable[i] = maxVal + 1;
    }
  }
  return PruningTable;
};

/**
 *
 * SOLVES CUBE
 *
 */
const solve = (inputString) => {
  let cubeToSolve = getCubeCoordinatesFromString(inputString);

  // PHASE 1: SOLVE CORNER/EDGE ORIENTATION
  const [cornerOP1, edgeOP1, cornerPP1, edgePP1] = getNumericalCubeCoordinates(cubeToSolve[0], cubeToSolve[1]);
  const udSliceCoordP1 = getUDSliceCoordFromLetter(cubeToSolve[1]);

  const phase1Solution = phase1(cornerOP1, edgeOP1, udSliceCoordP1);

  let phase2Ready = cubeToSolve;
  // move currentCube according to phase 1 solution
  if (phase1Solution.length > 0) {
    let [moveCorners, moveEdges] = getFullMoveFromIndex(phase1Solution[0]);

    for (let i = 1; i < phase1Solution.length; i++) {
      const [singularMoveCorners, singularMoveEdges] = getFullMoveFromIndex(phase1Solution[i]);
      [moveCorners, moveEdges] = multMove(moveCorners, moveEdges, singularMoveCorners, singularMoveEdges);
    }

    phase2Ready = applyMove(cubeToSolve[0], cubeToSolve[1], moveCorners, moveEdges);
  }

  // PHASE 2: SOLVE CUBE (ONLY NEED TO WORRY ABOUT PERMUTATION)
  const [currentCorners, currentEdges] = convertLetterCoordsToIndex(phase2Ready[0], phase2Ready[1]);
  const udSliceP2 = Phase2UDSliceCoord(currentEdges);
  const cornerPP2 = Phase2CornerPermCoord(currentCorners);
  const edgePP2 = Phase2EdgePermCoord(currentEdges);
  const phase2Solution = phase2(cornerPP2, edgePP2, udSliceP2);

  const fullSolve = getMoveNotationFromArray(phase1Solution).concat(getMoveNotationFromArrayP2(phase2Solution));
  return fullSolve;
};

const checkValidMove = (possibleMove, recentMove) => {
  // if is same face
  if (Math.floor(possibleMove / 3) == Math.floor(recentMove / 3)) {
    return false;
  }

  // can only do opposite faces in certain order (L->R is fine, R->L is not)
  if (possibleMove >= 9) {
    if (Math.floor((possibleMove - 9) / 3) == Math.floor(recentMove / 3)) {
      return false;
    }
  }

  return true;
};

const getFullMoveFromIndex = (index) => {
  const faceIndex = Math.floor(index / 3);
  let [faceMoveCorners, faceMoveEdges] = getMoveFromIndex(faceIndex);
  const numTurns = index % 3;

  const singleCorner = JSON.parse(JSON.stringify(faceMoveCorners));
  const singleEdge = JSON.parse(JSON.stringify(faceMoveEdges));

  for (let i = 0; i < numTurns; i++) {
    [faceMoveCorners, faceMoveEdges] = multMove(faceMoveCorners, faceMoveEdges, singleCorner, singleEdge);
  }

  return [faceMoveCorners, faceMoveEdges];
};

/**
 *
 * PHASE 1
 *
 */
const phase1 = (cornerCoord, edgeCoord, udSliceCoord) => {
  let foundSolution = null;
  const maxDepth = 20;
  let currDepth = 0;
  while (foundSolution === null && currDepth <= maxDepth) {
    foundSolution = phase1Search(cornerCoord, edgeCoord, udSliceCoord, currDepth, []);
    currDepth += 1;
  }

  return foundSolution;
};

const phase1Search = (cornerCoord, edgeCoord, udSliceCoord, depth, moveHistory) => {
  if (depth == 0) {
    if (cornerCoord == 0 && edgeCoord == 0 && udSliceCoord == 0) {
      return moveHistory;
    } else {
      return null;
    }
  }
  if (Math.max(pruningCornerO[cornerCoord], pruningEdgeO[edgeCoord], pruningUdSlice[udSliceCoord]) <= depth) {
    // less than or equal to 'depth' moves away!, search is worthwhile
    for (let i = 0; i < 18; i++) {
      if (moveHistory.length <= 0 || checkValidMove(i, moveHistory[moveHistory.length - 1])) {
        // apply every valid move
        const newCornerCoord = cornerOTable[cornerCoord][i];
        const newEdgeCoord = edgeOTable[edgeCoord][i];
        const newUdSliceCoord = udSliceTable[udSliceCoord][i];
        let newHistory = moveHistory.slice();
        newHistory.push(i);
        const result = phase1Search(newCornerCoord, newEdgeCoord, newUdSliceCoord, depth - 1, newHistory);
        if (result != null) return result;
      }
    }
  }
  return null;
};

/**
 *
 * PHASE 2
 *
 */
const phase2 = (cornerCoord, edgeCoord, udSliceCoord) => {
  let foundSolution = null;
  const maxDepth = 20;
  let currDepth = 0;
  while (foundSolution === null && currDepth <= maxDepth) {
    foundSolution = phase2Search(cornerCoord, edgeCoord, udSliceCoord, currDepth, []);
    currDepth += 1;
  }
  return foundSolution;
};

const phase2Search = (cornerCoord, edgeCoord, udSliceCoord, depth, moveHistory) => {
  if (depth == 0) {
    if (cornerCoord == 0 && edgeCoord == 0 && udSliceCoord == 0) {
      return moveHistory;
    } else {
      return null;
    }
  }

  if (Math.max(pruningCornerP[cornerCoord], pruningEdgeP[edgeCoord], pruningUdSliceP2[udSliceCoord]) <= depth) {
    // less than or equal to 'depth' moves away!, search is worthwhile
    for (let i = 0; i < 10; i++) {
      if (moveHistory.length <= 0 || checkValidMove(PHASE2_AVAILABLE_MOVES[i], moveHistory[moveHistory.length - 1])) {
        // apply every valid move
        const newCornerCoord = cornerPTable[cornerCoord][i];
        const newEdgeCoord = edgePTable[edgeCoord][i];
        const newUdSliceCoord = udSliceTableP2[udSliceCoord][i];
        let newHistory = moveHistory.slice();
        newHistory.push(i);
        const result = phase2Search(newCornerCoord, newEdgeCoord, newUdSliceCoord, depth - 1, newHistory);
        if (result != null) return result;
      }
    }
  }
  return null;
};

const getMoveNotationFromArray = (moves) => {
  let movesNotation = [];
  const facesArray = ["U", "R", "F", "D", "L", "B"];
  const numMoveArray = ["", "2", "'"];
  for (let i = 0; i < moves.length; i++) {
    const faceNum = Math.floor(moves[i] / 3);
    const numMoveNum = moves[i] % 3;
    movesNotation.push(facesArray[faceNum] + numMoveArray[numMoveNum]);
  }
  return movesNotation;
};

const getMoveNotationFromArrayP2 = (moves) => {
  let p2Moves = [0, 1, 2, 4, 7, 9, 10, 11, 13, 16];
  let movesNotation = [];
  const facesArray = ["U", "R", "F", "D", "L", "B"];
  const numMoveArray = ["", "2", "'"];
  for (let i = 0; i < moves.length; i++) {
    const faceNum = Math.floor(p2Moves[moves[i]] / 3);
    const numMoveNum = p2Moves[moves[i]] % 3;
    movesNotation.push(facesArray[faceNum] + numMoveArray[numMoveNum]);
  }
  return movesNotation;
};

const getMoveFromIndex = (index) => {
  switch (index) {
    case 0:
      return FACE_MOVES.u;
    case 1:
      return FACE_MOVES.r;
    case 2:
      return FACE_MOVES.f;
    case 3:
      return FACE_MOVES.d;
    case 4:
      return FACE_MOVES.l;
    default:
      return FACE_MOVES.b;
  }
};

const binomialCoefficient = (n, k) => {
  if (k > n) return 0;
  let res = 1;
  for (let i = 0; i < k; ++i) {
    res *= n - i;
    res /= i + 1;
  }
  return res;
};

const rearrangeLetters = (source, targets) => {
  const permute = (arr) => {
    let result = [];

    const permuteRec = (arr, m = []) => {
      if (arr.length === 0) {
        result.push(m);
      } else {
        for (let i = 0; i < arr.length; i++) {
          let curr = arr.slice();
          let next = curr.splice(i, 1);
          permuteRec(curr.slice(), m.concat(next));
        }
      }
    };

    permuteRec(arr);
    return result;
  };

  let permutations = permute(source);

  for (let perm of permutations) {
    let permStr = perm.join("");
    if (targets.includes(permStr)) {
      return perm;
    }
  }

  return null;
};

/**
 *
 * DRAWING FACES
 *
 */
const visualize = (cubeState) => {
  const faces = cubeState.match(/.{9}/g).map((chunk) => {
    return [chunk.substring(0, 3).split(""), chunk.substring(3, 6).split(""), chunk.substring(6, 9).split("")];
  });

  const canvas = document.getElementById("cubeVisual");
  const ctx = canvas.getContext("2d");
  const faceSize = 100;

  drawFace(ctx, faces[0], faceSize, faceSize + 2, 0);
  for (let i = 0; i < 4; i++) {
    let faceIndex = i == 0 ? 4 : i == 1 ? 2 : i == 2 ? 1 : 5;
    drawFace(ctx, faces[faceIndex], faceSize, faceSize * i + 2 * i, faceSize + 2);
  }
  drawFace(ctx, faces[3], faceSize, faceSize + 2, faceSize * 2 + 4);
};

const drawFace = (ctx, face, size, startX, startY) => {
  ctx.fillStyle = "#000000";
  ctx.fillRect(startX, startY, size, size);

  const stickerSize = (size - 2) / 3;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      ctx.fillStyle = getColorFromLetter(face[row][col]);
      ctx.fillRect(col * stickerSize + startX + 2, row * stickerSize + startY + 2, stickerSize - 2, stickerSize - 2);
    }
  }
};

const getColorFromLetter = (letter) => {
  if (letter == "U") return "#f2f222";
  if (letter == "L") return "#f2a922";
  if (letter == "F") return "#2272f2";
  if (letter == "R") return "#f22222";
  if (letter == "B") return "#40d622";
  return "#edf0f2";
};

/**
 *
 * DEFINITIONS OF FACES AND MOVES
 *
 */
const CENTERS = ["U", "R", "F", "D", "L", "B"];
const CORNERS = ["URF", "UFL", "ULB", "UBR", "DFR", "DLF", "DBL", "DRB"];
const EDGES = ["UR", "UF", "UL", "UB", "DR", "DF", "DL", "DB", "FR", "FL", "BL", "BR"];
const PHASE2_AVAILABLE_MOVES = [0, 1, 2, 4, 7, 9, 10, 11, 13, 16];

const FACELET_CORNERS = [
  [8, 9, 20],
  [6, 18, 38],
  [0, 36, 47],
  [2, 45, 11],
  [29, 26, 15],
  [27, 44, 24],
  [33, 53, 42],
  [35, 17, 51],
];
const FACELET_EDGES = [
  [5, 10],
  [7, 19],
  [3, 37],
  [1, 46],
  [32, 16],
  [28, 25],
  [30, 43],
  [34, 52],
  [23, 12],
  [21, 41],
  [50, 39],
  [48, 14],
];

const dCorners = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
  [5, 0],
  [6, 0],
  [7, 0],
  [4, 0],
];
const uCorners = [
  [3, 0],
  [0, 0],
  [1, 0],
  [2, 0],
  [4, 0],
  [5, 0],
  [6, 0],
  [7, 0],
];
const lCorners = [
  [0, 0],
  [2, 1],
  [6, 2],
  [3, 0],
  [4, 0],
  [1, 2],
  [5, 1],
  [7, 0],
];
const bCorners = [
  [0, 0],
  [1, 0],
  [3, 1],
  [7, 2],
  [4, 0],
  [5, 0],
  [2, 2],
  [6, 1],
];
const fCorners = [
  [1, 1],
  [5, 2],
  [2, 0],
  [3, 0],
  [0, 2],
  [4, 1],
  [6, 0],
  [7, 0],
];
const rCorners = [
  [4, 2],
  [1, 0],
  [2, 0],
  [0, 1],
  [7, 1],
  [5, 0],
  [6, 0],
  [3, 2],
];

const dEdges = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
  [5, 0],
  [6, 0],
  [7, 0],
  [4, 0],
  [8, 0],
  [9, 0],
  [10, 0],
  [11, 0],
];
const uEdges = [
  [3, 0],
  [0, 0],
  [1, 0],
  [2, 0],
  [4, 0],
  [5, 0],
  [6, 0],
  [7, 0],
  [8, 0],
  [9, 0],
  [10, 0],
  [11, 0],
];
const lEdges = [
  [0, 0],
  [1, 0],
  [10, 0],
  [3, 0],
  [4, 0],
  [5, 0],
  [9, 0],
  [7, 0],
  [8, 0],
  [2, 0],
  [6, 0],
  [11, 0],
];
const bEdges = [
  [0, 0],
  [1, 0],
  [2, 0],
  [11, 1],
  [4, 0],
  [5, 0],
  [6, 0],
  [10, 1],
  [8, 0],
  [9, 0],
  [3, 1],
  [7, 1],
];
const rEdges = [
  [8, 0],
  [1, 0],
  [2, 0],
  [3, 0],
  [11, 0],
  [5, 0],
  [6, 0],
  [7, 0],
  [4, 0],
  [9, 0],
  [10, 0],
  [0, 0],
];
const fEdges = [
  [0, 0],
  [9, 1],
  [2, 0],
  [3, 0],
  [4, 0],
  [8, 1],
  [6, 0],
  [7, 0],
  [1, 1],
  [5, 1],
  [10, 0],
  [11, 0],
];

const FACE_MOVES = {
  f: [fCorners, fEdges],
  b: [bCorners, bEdges],
  r: [rCorners, rEdges],
  l: [lCorners, lEdges],
  u: [uCorners, uEdges],
  d: [dCorners, dEdges],
};

const s_urf3Corners = [
  [0, 1],
  [4, 2],
  [5, 1],
  [1, 2],
  [3, 2],
  [7, 1],
  [6, 2],
  [2, 1],
];
const s_f2Corners = [
  [5, 0],
  [4, 0],
  [7, 0],
  [6, 0],
  [1, 0],
  [0, 0],
  [3, 0],
  [2, 0],
];
const s_u4Corners = [
  [3, 0],
  [0, 0],
  [1, 0],
  [2, 0],
  [7, 0],
  [4, 0],
  [5, 0],
  [6, 0],
];
const s_lr2Corners = [
  [1, 3],
  [0, 3],
  [3, 3],
  [2, 3],
  [5, 3],
  [4, 3],
  [7, 3],
  [6, 3],
];

const s_urf3Edges = [
  [1, 1],
  [8, 0],
  [5, 1],
  [9, 0],
  [3, 1],
  [11, 0],
  [7, 1],
  [10, 0],
  [0, 1],
  [4, 1],
  [6, 1],
  [2, 1],
];

const s_f2Edges = [
  [6, 0],
  [5, 0],
  [4, 0],
  [7, 0],
  [2, 0],
  [1, 0],
  [0, 0],
  [3, 0],
  [9, 0],
  [8, 0],
  [11, 0],
  [10, 0],
];
const s_u4Edges = [
  [3, 0],
  [0, 0],
  [1, 0],
  [2, 0],
  [7, 0],
  [4, 0],
  [5, 0],
  [6, 0],
  [11, 1],
  [8, 1],
  [9, 1],
  [10, 1],
];
const s_lr2Edges = [
  [2, 0],
  [1, 0],
  [0, 0],
  [3, 0],
  [6, 0],
  [5, 0],
  [4, 0],
  [7, 0],
  [9, 0],
  [8, 0],
  [11, 0],
  [10, 0],
];

// symmetry is not used in this implementation, but are shown regardless to demonstrate how they would work
const SYMMETRY = {
  s_urf3: [s_urf3Corners, s_urf3Edges], // 0...2 x16
  s_f2: [s_f2Corners, s_f2Edges], // 0...1 x8
  s_u4: [s_u4Corners, s_u4Edges], // 0...3 x2
  // s_lr2: [s_lr2Corners, s_lr2Edges] -> not sure how a cube would be in a mirrored state? will perhaps come back to this later
};

/**
 *
 * GENERATING PRUNING AND MOVES TABLES (takes a while)
 *
 */
const generateTables = () => {
  // PHASE 1 TABLES:
  cornerOTable = generateRawCornerOTable();
  edgeOTable = generateRawEdgeOTable();
  udSliceTable = generateRawUDSliceTable();

  pruningCornerO = generatePruningTable(cornerOTable);
  pruningEdgeO = generatePruningTable(edgeOTable);
  pruningUdSlice = generatePruningTable(udSliceTable);

  // PHASE 2 TABLES:
  cornerPTable = generateRawCornerPTable();
  edgePTable = generateRawEdgePTable();
  udSliceTableP2 = generateRawUDSliceP2Table();

  pruningCornerP = generatePruningTable(cornerPTable);
  pruningEdgeP = generatePruningTable(edgePTable);
  pruningUdSliceP2 = generatePruningTable(udSliceTableP2);
};
