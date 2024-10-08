let faceMesh;

let options = { maxFaces: 1, refineLandmarks: false, flipped: false };
let video;
let faces = [];

let maxIterations = 1; // Maximum number of iterations
let currentIteration = 0;

// Variables to hold the joke and state
let currentEmotion = "neutral";
let jokeText = "";

// Dimensions for the video feed
const videoWidth = 640;
const videoHeight = 480;

function preload() {
  // Load the faceMesh model, and wait for the model to be ready
  faceMesh = ml5.faceMesh(options, modelReady);
}

function modelReady() {
  console.log("Model is ready!");
  // Now we can start detecting faces once the model is ready
  faceMesh.detectStart(video, gotFaces);
}

function setup() {
  createCanvas(windowWidth, windowHeight); // Adjust the canvas size as needed
  video = createCapture(VIDEO);
  video.size(videoWidth, videoHeight);
  video.hide();
}

function gotFaces(results) {
  faces = results;
}

function draw() {
  background(0); // Set a background color

  // Center the video feed
  let videoX = (width - videoWidth) / 2;
  let videoY = (height - videoHeight) / 2;
  image(video, videoX, videoY, videoWidth, videoHeight);

  if (faces.length > 0) {
    let face = faces[0]; // Assuming only one face
    let emotion = detectEmotion(face);

    // Fetch a joke based on the emotion if it changes
    if (emotion !== currentEmotion) {
      currentEmotion = emotion;
      fetchJoke(currentEmotion);
    }

    // Display emotion on the canvas
    textSize(32);
    fill(255, 0, 0);
    textAlign(CENTER); // Set text alignment to center
    text(`Emotion: ${emotion}`, width / 2, height / 2 - 300); // Centered on the x-axis

    // Display joke/quote if available
    textSize(24);
    fill(255);
    let jokeX = width / 2; // Center on the x-axis
    let jokeY = height - 50; // Fixed y position
    textAlign(CENTER); // Set text alignment to center
    text(jokeText, jokeX, jokeY); // Centered on the x-axis

    // Draw keypoints as usual
    for (let j = 0; j < face.keypoints.length; j++) {
      let keypoint = face.keypoints[j];
      fill(255, 255, 255);
      noStroke();
      ellipse(keypoint.x + videoX, keypoint.y + videoY, 1, 1); // Adjust keypoint positions to match video
    }
  }
}

// Function to calculate Euclidean distance between two points
function distance(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function detectEmotion(face) {
  if (face && face.keypoints.length > 0) {
    if (currentIteration < maxIterations) {
      console.log(face.keypoints);
      currentIteration++;
    }

    // Get key points of interest
    let leftMouth = face.keypoints[61]; // Left mouth corner
    let rightMouth = face.keypoints[291]; // Right mouth corner
    let topMouth = face.keypoints[13]; // Upper lip center
    let bottomMouth = face.keypoints[14]; // Lower lip center
    let leftEyebrow = face.keypoints[65]; // Outer left eyebrow
    let rightEyebrow = face.keypoints[295]; // Outer right eyebrow
    let eyebrowCenterLeft = face.keypoints[55]; // Inner left eyebrow
    let eyebrowCenterRight = face.keypoints[285]; // Inner right eyebrow
    let leftEye = face.keypoints[159]; // Approx index for left eye
    let rightEye = face.keypoints[386]; // Approx index for right eye

    // Measure important distances
    let mouthWidth = distance(leftMouth, rightMouth);
    let mouthHeight = distance(topMouth, bottomMouth);
    let eyebrowDistance = distance(leftEyebrow, rightEyebrow);
    let eyeOpenLeft = distance(face.keypoints[159], face.keypoints[145]); // Measure of left eye openness
    let eyeOpenRight = distance(face.keypoints[386], face.keypoints[374]); // Measure of right eye openness

    // Angle between mouth corners
    let mouthSlope =
      (rightMouth.y - leftMouth.y) / (rightMouth.x - leftMouth.x); // Mouth "angle"

    // Eyebrow raising or pulling together (to detect anger)
    let eyebrowCenterDist = distance(eyebrowCenterLeft, eyebrowCenterRight); // Distance between the inner eyebrows

    // Now, define conditions for different emotions
    let emotion = "neutral"; // Default

    // Detect happiness (smiling)
    if (mouthWidth > 40 && mouthHeight > 10 && mouthSlope > -0.2) {
      emotion = "happy"; // Smile detected
    }

    // Detect surprise (wide eyes, raised eyebrows)
    if (eyeOpenLeft > 15 && eyeOpenRight > 15 && eyebrowDistance > 40) {
      emotion = "surprised"; // Eyes wide open, likely surprised
    }

    return emotion;
  }

  return "neutral";
}

// Fetch a joke based on the emotion
function fetchJoke(emotion) {
  let jokeAPIUrl = "https://icanhazdadjoke.com/"; // Using Dad Jokes API

  fetch(jokeAPIUrl, {
    headers: {
      Accept: "application/json", // Get the response in JSON format
    },
  })
    .then((response) => response.json())
    .then((data) => {
      jokeText = data.joke; // Store the joke
    })
    .catch((error) => {
      console.error("Error fetching joke:", error);
      jokeText = "Oops! Couldn't fetch a joke.";
    });
}
