let faceMesh;
let options = { maxFaces: 1, refineLandmarks: false, flipped: false };
let video;
let faces = [];

let currentEmotion = "neutral";
let jokeText = "";
let jokeFetched = false;

// Video dimensions
const videoWidth = 640;
const videoHeight = 480;

// Add a counter for button clicks and timing
let jokeRequestCount = 0;
const maxJokeRequests = 10; // Maximum number of joke requests before getting a message
let lastJokeRequestTime = 0;
const requestCooldown = 4000; // 4 seconds cooldown

// Throttle face detection to every 10 frames
let frameCounter = 0;
const detectionInterval = 10;

// Cooldown remaining time
let cooldownRemaining = 0;

// List of possible messages when clicking too much
const excessiveClickMessages = [
  "You're requesting too many jokes, you're so boring 🥱",
  "Seriously, you're still going?",
  "I don't feel like giving any more jokes :(",
  "Come on, give it a break!",
  "Are you trying to break me? 😅",
  "Let's take a joke break, okay?",
  "Even I need a break sometimes.",
  "Joke machine is cooling down...",
  "Out of jokes for now. Try later!",
  "No more jokes until you chill for a bit.",
];

// Filter variables
let selectedFilter = "none";
let dogFilter, hearts;

// Load the faceMesh model and filter images
function preload() {
  faceMesh = ml5.faceMesh(options, modelReady);
  dogFilter = loadImage("dog.png"); // Replace with the correct path
  hearts = loadImage("heart.png"); // Replace with the correct path
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

  // Create filter buttons
  createButton("No Filter")
    .position(20, 20)
    .mousePressed(() => setFilter("none"));
  createButton("Dog")
    .position(20, 60)
    .mousePressed(() => setFilter("dogFilter"));
  createButton("Hearts")
    .position(20, 100)
    .mousePressed(() => setFilter("hearts"));

  tryAgainButton = createButton("Fetch a new joke");
  tryAgainButton.position(width / 2 - 50, height - 50);
  tryAgainButton.mousePressed(resetJoke);
}

function setFilter(filter) {
  selectedFilter = filter;
}

function gotFaces(results) {
  faces = results;
}

// Change background color based on the detected emotion
function draw() {
  background(181, 170, 191);

  frameCounter++;
  if (frameCounter % detectionInterval === 0 && faceMesh) {
    faceMesh.detect(video, gotFaces);
  }

  switch (currentEmotion) {
    case "happy":
      background(255, 154, 162);
      break;
    case "surprised":
      background(181, 234, 215);
      break;
    case "sad":
      background(174, 198, 207);
      break;
    case "confused":
      background(198, 234, 212);
      break;
    case "neutral":
    default:
      background(181, 170, 191);
      break;
  }

  // Center the video feed
  let videoX = (width - videoWidth) / 2;
  let videoY = (height - videoHeight) / 3;
  image(video, videoX, videoY, videoWidth, videoHeight);

  if (faces.length > 0) {
    let face = faces[0];
    currentEmotion = detectEmotion(face);

    if (selectedFilter !== "none") {
      applyFilter(face, videoX, videoY);
    }

    textSize(32);
    fill(0);
    textAlign(CENTER);
    text(`Emotion: ${currentEmotion}`, width / 2, height / 2 - 300);

    textSize(18);
    fill(0);
    textAlign(CENTER);
    let jokeX = width / 2;
    let jokeY = height - 100;
    text(jokeText, jokeX, jokeY);

    if (cooldownRemaining > 0) {
      fill(255, 0, 0);
      textSize(16);
      text(
        `Cooldown: ${Math.ceil(cooldownRemaining / 1000)}s`,
        width / 2,
        videoY + videoHeight + 20
      );
      cooldownRemaining -= deltaTime;
    }

    for (let j = 0; j < face.keypoints.length; j++) {
      let keypoint = face.keypoints[j];
      fill(255, 255, 255);
      noStroke();
      ellipse(keypoint.x + videoX, keypoint.y + videoY, 1, 1);
    }
  }
}

function applyFilter(face, videoX, videoY) {
  try {
    if (selectedFilter === "dogFilter") {
      let foreheadCenter = face.keypoints[10];
      let earCenterX = foreheadCenter.x + videoX;
      let earCenterY = foreheadCenter.y + videoY - 50;
      image(dogFilter, earCenterX - 100, earCenterY - 10, 200, 200);
    } else if (selectedFilter === "hearts") {
      let foreheadCenter = face.keypoints[10];
      let heartX = foreheadCenter.x + videoX;
      let heartY = foreheadCenter.y + videoY - 10;
      let heartSize = 280;

      image(
        hearts,
        heartX - heartSize / 2,
        heartY - heartSize / 2,
        heartSize,
        heartSize
      );
    }
  } catch (error) {
    console.error("Error applying filter:", error);
  }
}

// Add a joke request counter
function resetJoke() {
  let currentTime = millis();
  jokeRequestCount++;

  if (currentTime - lastJokeRequestTime < requestCooldown) {
    jokeText =
      excessiveClickMessages[
        Math.floor(Math.random() * excessiveClickMessages.length)
      ];
    jokeRequestCount = 0;
    cooldownRemaining = requestCooldown - (currentTime - lastJokeRequestTime);
  } else {
    jokeFetched = false;
    jokeText = "";
    fetchJoke(currentEmotion);
  }

  lastJokeRequestTime = currentTime;
}

function detectEmotion(face) {
  if (face && face.keypoints.length > 0) {
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

    // Detect sadness (small mouth and downward slope, closed eyes)
    if (
      mouthWidth < 35 &&
      mouthSlope < -0.3 &&
      eyeOpenLeft < 10 &&
      eyeOpenRight < 10
    ) {
      emotion = "sad";
    }

    // Detect confusion (raised eyebrow center, neutral mouth shape, and slight eye wideness)
    if (
      eyebrowCenterDist > 25 &&
      mouthSlope < 0.1 &&
      mouthSlope > -0.1 &&
      eyeOpenLeft > 10 &&
      eyeOpenRight > 10
    ) {
      emotion = "confused";
    }

    return emotion;
  }

  return "neutral";
}

// Fetch a joke based on the emotion
function fetchJoke(emotion) {
  let jokeAPIUrl = "https://icanhazdadjoke.com/"; // Used dad joke API

  fetch(jokeAPIUrl, {
    headers: {
      Accept: "application/json", // Get the response in JSON format
    },
  })
    .then((response) => response.json())
    .then((data) => {
      jokeText = data.joke; // Store the joke
      jokeFetched = true; // Mark as fetched
    })
    .catch((error) => {
      console.error("Error fetching joke:", error);
      jokeText = "Oops! Couldn't fetch a joke.";
    });
}

function distance(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}
