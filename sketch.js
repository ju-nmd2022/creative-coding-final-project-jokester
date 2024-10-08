let faceMesh;

let options = { maxFaces: 1, refineLandmarks: false, flipped: false };
let video;
let faces = [];

let maxIterations = 1;
let currentIteration = 0;

// Variables to hold the joke and state
let currentEmotion = "neutral";
let jokeText = "";
let jokeFetched = false; // Track if a joke has been fetched
let tryAgainButton; // Button to fetch a new joke

// Video dimensions
const videoWidth = 640;
const videoHeight = 480;

// Load the faceMesh model, and wait for the model to be ready
function preload() {
  faceMesh = ml5.faceMesh(options, modelReady);
}

// Start detecting faces when the model is ready
function modelReady() {
  console.log("Model is ready!");
  faceMesh.detectStart(video, gotFaces);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(videoWidth, videoHeight);
  video.hide();

  // Create a "Try Again" button that lets the user get a new joke
  tryAgainButton = createButton("Try Again");
  tryAgainButton.position(width / 2 - 50, height - 30);
  tryAgainButton.mousePressed(resetJoke);
}

function gotFaces(results) {
  faces = results;
}

function draw() {
  background(0);

  // Center the video feed
  let videoX = (width - videoWidth) / 2;
  let videoY = (height - videoHeight) / 2;
  image(video, videoX, videoY, videoWidth, videoHeight);

  if (faces.length > 0) {
    let face = faces[0];
    let emotion = detectEmotion(face);

    // Fetch a joke based on the emotion if it changes
    if (emotion !== currentEmotion || !jokeFetched) {
      currentEmotion = emotion;
      fetchJoke(currentEmotion);
    }

    textSize(32);
    fill(255, 0, 0);
    textAlign(CENTER);
    text(`Emotion: ${emotion}`, width / 2, height / 2 - 300);

    textSize(24);
    fill(255);
    let jokeX = width / 2;
    let jokeY = height - 50;
    textAlign(CENTER);
    text(jokeText, jokeX, jokeY);

    // Draw keypoints
    for (let j = 0; j < face.keypoints.length; j++) {
      let keypoint = face.keypoints[j];
      fill(255, 255, 255);
      noStroke();
      ellipse(keypoint.x + videoX, keypoint.y + videoY, 1, 1);
    }
  }
}

function detectEmotion(face) {
  if (face && face.keypoints.length > 0) {
    if (currentIteration < maxIterations) {
      console.log(face.keypoints);
      currentIteration++;
    }

    // Get face key points
    let leftMouth = face.keypoints[61];
    let rightMouth = face.keypoints[291];
    let topMouth = face.keypoints[13];
    let bottomMouth = face.keypoints[14];
    let leftEyebrow = face.keypoints[65];
    let rightEyebrow = face.keypoints[295];
    let eyebrowCenterLeft = face.keypoints[55];
    let eyebrowCenterRight = face.keypoints[285];
    let leftEye = face.keypoints[159];
    let rightEye = face.keypoints[386];

    // Measure important distances
    let mouthWidth = distance(leftMouth, rightMouth);
    let mouthHeight = distance(topMouth, bottomMouth);
    let eyebrowDistance = distance(leftEyebrow, rightEyebrow);
    let eyeOpenLeft = distance(face.keypoints[159], face.keypoints[145]);
    let eyeOpenRight = distance(face.keypoints[386], face.keypoints[374]);
    let mouthSlope =
      (rightMouth.y - leftMouth.y) / (rightMouth.x - leftMouth.x); // Angle between mouth corners
    let eyebrowCenterDist = distance(eyebrowCenterLeft, eyebrowCenterRight); // Eyebrow raising or pulling together (to detect anger)

    let emotion = "neutral";

    // Detect happiness (smiling)
    if (mouthWidth > 40 && mouthHeight > 10 && mouthSlope > -0.2) {
      emotion = "happy";
    }

    // Detect surprise (wide eyes, raised eyebrows)
    if (eyeOpenLeft > 15 && eyeOpenRight > 15 && eyebrowDistance > 40) {
      emotion = "surprised";
    }

    return emotion;
  }

  return "neutral";
}

// Fetch a joke based on the emotion
function fetchJoke(emotion) {
  if (!jokeFetched) {
    let jokeAPIUrl = "https://icanhazdadjoke.com/"; // used dad joke API

    fetch(jokeAPIUrl, {
      headers: {
        Accept: "application/json", // Get the response in JSON format
      },
    })
      .then((response) => response.json())
      .then((data) => {
        jokeText = data.joke; // Store the joke
        jokeFetched = true;
      })
      .catch((error) => {
        console.error("Error fetching joke:", error);
        jokeText = "Oops! Couldn't fetch a joke.";
      });
  }
}

function resetJoke() {
  jokeFetched = false;
  jokeText = "";
}

// Function to calculate Euclidean distance between two points
function distance(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}
