let rawStickerColors = [];
let normalizedColors = [];
let currentCube = [];
let isCalibrating = false;
let calibrateNum = 0;
let debugging = false;
const stickerCanvas = document.getElementById("stickerCanvas");

// colors used when stickers are drawn
const standardColors = {
  white: "#e1e8eb",
  yellow: "#f2ef13",
  blue: "#1b65de",
  green: "#1bde2b",
  red: "#c21708",
  orange: "#d68d0f",
};

// colors that change when calibrating
let colorsToCompare = [
  [163, 15, 15],
  [223, 64, 70],
  [156, 149, 79],
  [2, 159, 42],
  [23, 81, 115],
  [139, 141, 148],
];

const COLOR_ORDER = ["RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "WHITE"];

/**
 *
 * LOAD WEBCAM
 *
 */
document.addEventListener(
  "DOMContentLoaded",
  async () => {
    const video = document.getElementById("webcam");
    const canvas = document.getElementById("canvas");
    const progressElement = document.getElementById("progress");

    const updateProgress = (fractions) => {
      const percentage = Math.round(fractions * 100);
      progressElement.textContent = `Loading: ${percentage}%`;
    };

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        video.srcObject = stream;

        await tf.ready();
        const modelUrl = `${window.location.href}/detection-model/model.json`;
        const model = await tf.loadGraphModel(modelUrl, {
          onProgress: updateProgress,
        });
        const dummyInput = tf.ones(model.inputs[0].shape);
        const warmupResults = model.execute(dummyInput);
        console.log("Model finished loading...");
        updateProgress(1);
        progressElement.textContent = "Model Loaded!";
        generateTables();

        window.doneLoadingMetadata.then(() => {
          video.play();
          console.log("Done loading video metadata...");
          processVideoFrame(model, video, canvas);
        });
      } catch (error) {
        console.error("Error accessing webcam:", error);
        solutionP.style.color = "red";
        solutionP.innerHTML = "ERROR - cannot access webcam";
      }
    } else {
      solutionP.style.color = "red";
      solutionP.innerHTML = "ERROR - getUserMedia is not supported in this browser";
    }
  },
  false
);

/**
 *
 * LISTEN FOR 'SPACE'
 *
 */
document.addEventListener("keydown", function (event) {
  if (event.code === "Space") {
    event.preventDefault();
    if (isCalibrating) {
      colorsToCompare[calibrateNum] = hexToRgb(rawStickerColors[1][1]);
      calibrateNum += 1;
      if (calibrateNum >= 6) {
        calibrateNum = 0;
        toggleCalibrate();
      } else {
        document.getElementById("instructions").innerHTML = "show the face with the " + COLOR_ORDER[calibrateNum] + " center and press 'space'";
      }
    } else {
      let faceContainer = document.getElementById("faceContainer");

      if (currentCube.length >= 6) {
        faceContainer.innerHTML = "";
        currentCube = [];
      }
      let newCanvas = document.createElement("canvas");
      newCanvas.width = 68;
      newCanvas.height = 68;
      currentCube.push(normalizedColors);
      faceContainer.appendChild(newCanvas);
      drawStickers(normalizedColors, newCanvas, true, 20);

      if (currentCube.length == 6) {
        get3dCube();
        document.getElementById("scannedIn").style.visibility = "visible";
      }
    }
  }
});

/**
 *
 * BUTTON FUNCTIONALITY
 *
 */
document.getElementById("debugButton").onclick = () => {
  toggleDebugging();
};

document.getElementById("calibrate").onclick = () => {
  console.log("calibrating...");
  toggleCalibrate();
};

document.getElementById("solveButton").onclick = () => {
  const solutionP = document.getElementById("solution");

  try {
    const flatRep = getFlatRep(currentCube);
    const solution = solve(flatRep);
    solutionP.style.color = "black";
    if (solution == 0) {
      solutionP.innerHTML = "this cube seems to be solved";
    } else {
      solutionP.innerHTML = solution.join(" ");
    }
  } catch (e) {
    solutionP.style.color = "red";
    solutionP.innerHTML = "ERROR - make sure the cube is ";

    const link = document.createElement("a");
    link.href = "instructions.html";
    link.textContent = "correctly scanned in";
    solutionP.appendChild(link);
  }
};

const toggleCalibrate = () => {
  isCalibrating = !isCalibrating;
  const instructionsP = document.getElementById("instructions");
  if (isCalibrating) {
    instructionsP.innerHTML = "show the face with the " + COLOR_ORDER[calibrateNum] + " center and press 'space'";
  } else {
    instructionsP.innerHTML = "press 'space' to save cube face";
  }
};

const toggleDebugging = () => {
  console.log("toggle");
  debugging = !debugging;
};

/**
 *
 * DRAW RENDERING W/ THREE.JS
 *
 */
function get3dCube() {
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfaf9f7);

  var camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  var renderer = new THREE.WebGLRenderer({ antialias: true });

  var container = document.getElementById("threeCanvas");
  container.innerHTML = "";
  renderer.setSize(container.clientWidth, container.clientHeight);

  container.appendChild(renderer.domElement);

  var geometry = new THREE.BoxGeometry();

  function createTexture(faceColorsTemp, idx) {
    var size = 256;
    var canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    var context = canvas.getContext("2d", { willReadFrequently: true });

    var cellSize = size / 3;

    let degreesRotate = 0;

    switch (idx) {
      case 0:
        degreesRotate = 90; // orange
        break;
      case 1:
        degreesRotate = 270; // red
        break;
      case 2:
        degreesRotate = 0; // green
        break;
      case 3:
        degreesRotate = 180; // blue
        break;
      case 4:
        degreesRotate = 90; // white
        break;
      default:
        degreesRotate = 90; // yellow
        break;
    }
    let faceColors = rotateMatrix(faceColorsTemp, degreesRotate);

    faceColors.forEach((row, y) => {
      row.forEach((colorName, x) => {
        context.fillStyle = standardColors[colorName];
        context.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
      });
    });

    var texture = new THREE.CanvasTexture(canvas);
    return new THREE.MeshBasicMaterial({ map: texture });
  }
  let correctedCube = [...currentCube];
  let tempVar = currentCube[0];
  correctedCube[0] = correctedCube[3];
  correctedCube[3] = tempVar;

  var materials = correctedCube.map((faceColors, idx) => createTexture(faceColors, idx));

  var cube = new THREE.Mesh(geometry, materials);
  cube.rotation.x = (-1 * Math.PI) / 4;
  cube.rotation.y = Math.PI;
  cube.rotation.z = Math.PI / 4;
  scene.add(cube);

  camera.position.z = 2;

  var controls = new THREE.OrbitControls(camera, renderer.domElement);

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  animate();
  container.scrollIntoView({ behavior: "smooth" });

  window.addEventListener(
    "resize",
    function () {
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
    },
    false
  );
}

/**
 *
 * PREPROCESS FRAME (change aspect ratio to match tfjs model)
 *
 */
function preprocess(source, modelWidth, modelHeight) {
  let xRatio, yRatio;

  const input = tf.tidy(() => {
    const img = tf.browser.fromPixels(source);

    const [h, w] = img.shape.slice(0, 2);
    const maxSize = Math.max(w, h);
    const imgPadded = img.pad([
      [0, maxSize - h],
      [0, maxSize - w],
      [0, 0],
    ]);

    xRatio = maxSize / w;
    yRatio = maxSize / h;

    return tf.image.resizeBilinear(imgPadded, [modelWidth, modelHeight]).div(255.0).expandDims(0);
  });
  return [input, xRatio, yRatio];
}

/**
 *
 * RUN MODEL & GET BOUNDING BOX COORDINATES
 * credit to Wahyu Setianto (https://github.com/Hyuto/yolov8-tfjs) for help with extracting boundaries from model output
 *
 */
async function detect(source, model, canvas, callback = () => {}) {
  const [modelWidth, modelHeight] = model.inputs[0].shape.slice(1, 3);

  tf.engine().startScope();
  const [input, xRatio, yRatio] = preprocess(source, modelWidth, modelHeight);
  const res = model.execute(input);
  const transRes = res.transpose([0, 2, 1]);
  const boxes = tf.tidy(() => {
    const w = transRes.slice([0, 0, 2], [-1, -1, 1]);
    const h = transRes.slice([0, 0, 3], [-1, -1, 1]);
    const x1 = tf.sub(transRes.slice([0, 0, 0], [-1, -1, 1]), tf.div(w, 2));
    const y1 = tf.sub(transRes.slice([0, 0, 1], [-1, -1, 1]), tf.div(h, 2));
    return tf.concat([y1, x1, tf.add(y1, h), tf.add(x1, w)], 2).squeeze();
  });

  const [scores] = tf.tidy(() => {
    const rawScores = transRes.slice([0, 0, 4], [-1, -1, 1]).squeeze(0);
    return [rawScores.max(1), rawScores.argMax(1)];
  });

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  if (scores.size > 0) {
    const maxIndex = scores.argMax().dataSync()[0];
    const maxScore = scores.max().dataSync()[0];

    if (maxScore > 0.5) {
      const boxes_data = boxes.gather([maxIndex], 0).dataSync();
      let [y1, x1, y2, x2] = boxes_data;
      x1 *= xRatio;
      x2 *= xRatio;
      y1 *= yRatio;
      y2 *= yRatio;

      x1 -= 5;
      y1 -= 5;
      x2 += 5;
      y2 += 5;
      let [filtered_contours, centroids, colors] = extractColors(source, x1, y1, x2, y2, xRatio, yRatio);

      if (debugging) {
        renderBox(canvas, x1, y1, x2, y2, filtered_contours, centroids, xRatio, yRatio);
      }

      if (colors != null && colors.length == 9) {
        let [correctedColors, tempValue, real_angle] = getValueMatrix(colors);
        rawStickerColors = correctedColors;
        normalizedColors = normalizeColors(rawStickerColors);
      }

      if (isCalibrating) {
        drawStickers(rawStickerColors, stickerCanvas);
      } else {
        drawStickers(normalizedColors, stickerCanvas, true);
      }
    }
  }

  tf.dispose([res, transRes, boxes, scores]);
  callback();
  tf.engine().endScope();
}

/**
 *
 * DRAW STICKER COlORS
 *
 */
function drawStickers(colors, canvas, useNames = false, squareSize = 20) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, squareSize * 3 + 8, squareSize * 3 + 8);

  for (let row = 0; row < colors.length; row++) {
    for (let col = 0; col < colors[row].length; col++) {
      const x = col * squareSize + 2;
      const y = row * squareSize + 2;

      ctx.fillStyle = useNames ? standardColors[colors[row][col]] : colors[row][col];
      ctx.fillRect(x + col * 2, y + row * 2, squareSize, squareSize);
    }
  }
}

/**
 *
 * DRAW BOUNDING BOX ON CANVAS
 *
 */
function renderBox(canvas, x1, y1, x2, y2, contours, centroids, xRatio, yRatio) {
  if (contours == null) {
    return;
  }
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const boxWidth = x2 - x1;
  const boxHeight = y2 - y1;

  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 3;
  ctx.strokeRect(x1, y1, boxWidth, boxHeight);

  for (let i = 0; i < contours.length; i++) {
    let contour = contours[i];
    ctx.beginPath();
    for (let j = 0; j < contour.size().height; j++) {
      let point = contour.intPtr(j, 0);
      if (j === 0) {
        ctx.moveTo(point[0] * xRatio + x1, point[1] * yRatio + y1);
      } else {
        ctx.lineTo(point[0] * xRatio + x1, point[1] * yRatio + y1);
      }
    }
    ctx.closePath();
    ctx.stroke();
  }
}

/**
 *
 * CONTINUOUSLY DETECT CUBE
 *
 */
async function processVideoFrame(model, video, canvas) {
  const captureFrame = async () => {
    await detect(video, model, canvas);
    requestAnimationFrame(captureFrame);
  };

  captureFrame();
}

/**
 *
 * EXTRACT COLORS
 *
 */
const extractColors = (source, x1, y1, x2, y2, xRatio, yRatio) => {
  try {
    let canvasHidden = document.getElementById("hiddenCanvas");
    let contextHidden = canvasHidden.getContext("2d", { willReadFrequently: true });

    contextHidden.drawImage(source, 0, 0, canvasHidden.width, canvasHidden.height);
    let src = cv.imread("hiddenCanvas");
    let rect = new cv.Rect(x1, y1, x2 - x1, y2 - y1);

    let dst = src.roi(rect); // sometimes this fails, not really sure why
    let resized = new cv.Mat();
    let newSize = new cv.Size(dst.cols / xRatio, dst.rows / yRatio);
    cv.resize(dst, resized, newSize, 0, 0, cv.INTER_LINEAR);

    let [filtered_contours, centroids, colors] = extractPoints(resized);

    src.delete();
    dst.delete();
    resized.delete();
    return [filtered_contours, centroids, colors];
  } catch (error) {
    return [null, null, null];
  }
};

/**
 *
 * FIND BOUNDING BOXES OF STICKERS & GET COLORS
 *
 */
const extractPoints = (cube) => {
  [cubeHeight, cubeWidth] = cube.matSize;
  let cubeCopy = cube.clone();

  cv.GaussianBlur(cube, cube, new cv.Size(9, 9), 2, 2, cv.BORDER_DEFAULT);
  cv.cvtColor(cube, cube, cv.COLOR_BGR2GRAY);
  cv.Canny(cube, cube, 20, 40);

  let kernel = cv.Mat.ones(5, 5, cv.CV_8U);
  cv.dilate(cube, cube, kernel, new cv.Point(-1, -1), 2);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(cube, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

  // clean up contours
  let approx_contours = [];
  for (let i = 0; i < contours.size(); ++i) {
    let cnt = contours.get(i);
    let epsilon = 0.05 * cv.arcLength(cnt, true);
    let approx = new cv.Mat();
    cv.approxPolyDP(cnt, approx, epsilon, true);
    approx_contours.push(approx);
  }

  // find sticker-like contours
  let filtered_contours = [];
  let centroids = [];
  let colors = [];
  for (let i = 0; i < approx_contours.length; ++i) {
    let cnt = approx_contours[i];
    if (cnt.size().height < 4 || cnt.size().height > 5) {
      continue;
    }

    let this_area = cv.contourArea(cnt);
    let total_pixels = cubeWidth * cubeHeight;
    if (this_area > total_pixels / 4 || this_area < total_pixels / 100) {
      continue;
    }

    let angles = [];
    for (let j = 0; j < cnt.size().height; ++j) {
      let p1 = cnt.intPtr(j, 0);
      let p2 = cnt.intPtr((j + 1) % cnt.size().height, 0);
      let p3 = cnt.intPtr((j + 2) % cnt.size().height, 0);
      let v1 = [p2[0] - p1[0], p2[1] - p1[1]];
      let v2 = [p3[0] - p2[0], p3[1] - p2[1]];
      let dot_product = v1[0] * v2[0] + v1[1] * v2[1];
      let magnitude_v1 = Math.sqrt(v1[0] ** 2 + v1[1] ** 2);
      let magnitude_v2 = Math.sqrt(v2[0] ** 2 + v2[1] ** 2);
      if (magnitude_v1 * magnitude_v2 !== 0) {
        let angle = Math.acos(dot_product / (magnitude_v1 * magnitude_v2));
        angles.push((angle * 180) / Math.PI);
      }
    }

    // makes sure all angles of countour are somewhere around 90
    if (angles.every((angle) => angle >= 60 && angle <= 120)) {
      let side_lengths = getSideLengths(cnt);
      let max_side_length = Math.max(...side_lengths);
      let min_side_length = Math.min(...side_lengths);
      let side_length_ratio = max_side_length / min_side_length;

      if (side_length_ratio <= 1.5) {
        filtered_contours.push(cnt);

        let M = cv.moments(cnt);
        if (M.m00 !== 0) {
          let cx = Math.round(M.m10 / M.m00);
          let cy = Math.round(M.m01 / M.m00);
          centroids.push([cx, cy]);

          // finds average color of individual sticker
          let temp_color = getColorOfContour(cnt, cubeCopy);
          colors.push([cx, cy, temp_color]);
        }
      }
    }
  }

  return [filtered_contours, centroids, colors];
};

/**
 *
 * FINDS COLOR OF STICKER
 *
 */
function getColorOfContour(cnt, image) {
  let mask = new cv.Mat.zeros(image.rows, image.cols, cv.CV_8U);
  let contours = new cv.MatVector();
  contours.push_back(cnt);
  cv.fillPoly(mask, contours, new cv.Scalar(255, 255, 255));

  let masked_img = new cv.Mat();
  cv.bitwise_and(image, image, masked_img, mask);

  let channels = new cv.MatVector();

  cv.split(masked_img, channels);
  let b = channels.get(0);
  let g = channels.get(1);
  let r = channels.get(2);

  let sum_b = manualSum(b);
  let sum_g = manualSum(g);
  let sum_r = manualSum(r);

  let non_zero_pixels = cv.countNonZero(mask);

  let avg_b = non_zero_pixels > 0 ? sum_b / non_zero_pixels : 0;
  let avg_g = non_zero_pixels > 0 ? sum_g / non_zero_pixels : 0;
  let avg_r = non_zero_pixels > 0 ? sum_r / non_zero_pixels : 0;

  b.delete();
  g.delete();
  r.delete();
  mask.delete();
  masked_img.delete();
  channels.delete();

  let rgbArray = [Math.round(avg_b), Math.round(avg_g), Math.round(avg_r)];
  return rgbToHex(rgbArray);
}

function manualSum(mat) {
  let sum = 0;
  for (let i = 0; i < mat.rows; i++) {
    for (let j = 0; j < mat.cols; j++) {
      sum += mat.ucharAt(i, j);
    }
  }
  return sum;
}

function getSideLengths(cnt) {
  let side_lengths = [];
  for (let i = 0; i < cnt.size().height; ++i) {
    let p1 = cnt.intPtr(i, 0);
    let p2 = cnt.intPtr((i + 1) % cnt.size().height, 0);
    let side_length = Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
    side_lengths.push(side_length);
  }
  return side_lengths;
}

/**
 *
 * ROTATE POINTS (to get orientation of stickers)
 *
 */
function distance(point1, point2) {
  return Math.sqrt(Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2));
}

function findClosest(targetPoint, array) {
  let closest = array[0];
  let minDistance = distance(targetPoint, closest);

  for (let currentPoint of array.slice(1)) {
    let currentDistance = distance(targetPoint, currentPoint);
    if (currentDistance < minDistance) {
      closest = currentPoint;
      minDistance = currentDistance;
    }
  }

  return closest;
}

function findAngle(singlePoint, pointsList) {
  let closest = findClosest(singlePoint, pointsList);

  let deltaY = singlePoint[1] - closest[1];
  let deltaX = singlePoint[0] - closest[0];
  let angleRadians = Math.atan2(deltaY, deltaX);
  let angleDegrees = angleRadians * (180 / Math.PI);
  return angleDegrees;
}

function rotatePoints(points, center, thetaDegrees) {
  if (thetaDegrees < 45) {
    thetaDegrees *= -1;
  } else if (thetaDegrees >= 135) {
    thetaDegrees = 180 - thetaDegrees;
  } else {
    thetaDegrees = 90 - thetaDegrees;
  }

  let thetaRadians = thetaDegrees * (Math.PI / 180);
  let [centerX, centerY] = center;

  let rotatedPoints = [];

  for (let [x, y, v] of points) {
    let xPrime = x - centerX;
    let yPrime = y - centerY;

    let xDoublePrime = xPrime * Math.cos(thetaRadians) - yPrime * Math.sin(thetaRadians);
    let yDoublePrime = xPrime * Math.sin(thetaRadians) + yPrime * Math.cos(thetaRadians);

    let xNew = Math.round(xDoublePrime + centerX);
    let yNew = Math.round(yDoublePrime + centerY);

    rotatedPoints.push([xNew, yNew, v]);
  }

  return rotatedPoints;
}

function getRotatedPoints(xyvPoints) {
  let sumX = 0;
  let sumY = 0;

  for (let [x, y, v] of xyvPoints) {
    sumX += x;
    sumY += y;
  }

  let avgX = Math.round(sumX / xyvPoints.length);
  let avgY = Math.round(sumY / xyvPoints.length);

  let angle = findAngle(xyvPoints[0], xyvPoints.slice(1));
  let centerPoint = findClosest([avgX, avgY], xyvPoints);

  let rotatedXyvPoints = rotatePoints(xyvPoints, centerPoint, angle);

  return [rotatedXyvPoints, false, angle];
}

/**
 *
 * GET VALUE MATRIX (turns array of points and gives 3x3 matrix)
 *
 */
function getValueMatrix(unrotatedPoints, gridSize = 3) {
  let matrix = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
  if (unrotatedPoints.length !== 9) {
    return [matrix, false, 0];
  }

  let [points, bigAngle, realAngle] = getRotatedPoints(unrotatedPoints);

  let minX = Math.min(...points.map((p) => p[0]));
  let maxX = Math.max(...points.map((p) => p[0]));
  let minY = Math.min(...points.map((p) => p[1]));
  let maxY = Math.max(...points.map((p) => p[1]));

  let gridWidth = maxX - minX + 1;
  let gridHeight = maxY - minY + 1;

  for (let [x, y, value] of points) {
    let row = Math.min(2, Math.floor((y - minY) / (gridHeight / gridSize)));
    let col = Math.min(2, Math.floor((x - minX) / (gridWidth / gridSize)));
    matrix[row][col] = value;
  }

  return [matrix, bigAngle, realAngle];
}

/**
 *
 * NORMALIZE COLORS
 *
 */
function normalizeColors(colors) {
  let rawColors = colors.map((innerArray) => innerArray.slice());

  // colors are now distinct, but not dsicrete like 'red' or 'green'
  let [updatedColors, uniqueColors] = reduceSimilarColors(rawColors);

  uniqueColors = uniqueColors.map((e) => {
    return {
      og: e,
      red: colorDistance(e, colorsToCompare[0]),
      orange: colorDistance(e, colorsToCompare[1]),
      yellow: colorDistance(e, colorsToCompare[2]),
      green: colorDistance(e, colorsToCompare[3]),
      blue: colorDistance(e, colorsToCompare[4]),
      white: colorDistance(e, colorsToCompare[5]),
    };
  });

  updatedColors = updatedColors.map((innerArray) =>
    innerArray.map((e) => {
      const rgbVal = hexToRgb(e);
      const colorObj = uniqueColors.find((colo) => colo.og[0] == rgbVal[0] && colo.og[1] == rgbVal[1] && colo.og[2] == rgbVal[2]);

      const values = Object.values(colorObj).filter((value) => typeof value === "number");
      const minValue = Math.min(...values);

      switch (minValue) {
        case colorObj.red:
          return "red";
        case colorObj.orange:
          return "orange";
        case colorObj.yellow:
          return "yellow";
        case colorObj.green:
          return "green";
        case colorObj.blue:
          return "blue";
        default:
          return "white";
      }
    })
  );

  return updatedColors;
}

function reduceSimilarColors(colors, threshold = 30) {
  let updatedColors = colors.map((innerArray) => innerArray.slice());
  const uniqueColors = [];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      let isUnique = true;

      const currentRGB = hexToRgb(colors[row][col]);

      for (let i = 0; i < uniqueColors.length; i++) {
        if (colorDistance(currentRGB, uniqueColors[i]) < threshold) {
          isUnique = false;
          updatedColors[row][col] = rgbToHex(uniqueColors[i]);
          break;
        }
      }

      if (isUnique) {
        uniqueColors.push(currentRGB);
      }
    }
  }

  return [updatedColors, uniqueColors];
}

function rgbToHex(rgbArray) {
  return (
    "#" +
    rgbArray
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

function hexToRgb(hex) {
  if (hex == null) {
    return [0, 0, 0];
  }
  var r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function colorDistance(rgb1, rgb2) {
  return Math.sqrt(Math.pow(rgb1[0] - rgb2[0], 2) + Math.pow(rgb1[1] - rgb2[1], 2) + Math.pow(rgb1[2] - rgb2[2], 2));
}

function rotateMatrix(matrix, degrees) {
  const n = 3;
  let numRotations = (degrees / 90) % 4;

  for (let i = 0; i < numRotations; i++) {
    let tempMatrix = [[], [], []];

    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        tempMatrix[col][n - 1 - row] = matrix[row][col];
      }
    }

    matrix = tempMatrix;
  }

  return matrix;
}

/**
 *
 * FLATTENS CUBE STATE INTO 'FFURLBBUD...' (used in solve.js)
 *
 */
const getFlatRep = (cubeRep) => {
  let flatRep = new Array(6);
  let flatRepOld = new Array(6);
  let colorOrder = [];
  for (let i = 0; i < 6; i++) {
    if (i == 5) {
      flatRep[0] = rotateMatrix(cubeRep[i], 90);
      colorOrder[0] = cubeRep[i][1][1];
    } else if (i == 1) {
      flatRep[1] = cubeRep[i];
      colorOrder[1] = cubeRep[i][1][1];
    } else if (i == 0) {
      flatRep[2] = cubeRep[i];
      colorOrder[2] = cubeRep[i][1][1];
    } else if (i == 4) {
      flatRep[3] = rotateMatrix(cubeRep[i], 270);
      colorOrder[3] = cubeRep[i][1][1];
    } else if (i == 3) {
      flatRep[4] = cubeRep[i];
      colorOrder[4] = cubeRep[i][1][1];
    } else {
      flatRep[5] = cubeRep[i];
      colorOrder[5] = cubeRep[i][1][1];
    }
  }

  const facelets = ["U", "R", "F", "D", "L", "B"];
  flatRep = flatRep.flat(3).map((str) => {
    return facelets[colorOrder.indexOf(str)];
  });
  return flatRep.join("");
};
