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

// Track emotion duration
let emotionStartTime = 0;
const emotionHoldThreshold = 5000;
let emotionMessage = "";

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
let dogFilter, hearts, tearsFilter, questionMarkFilter;

// Load the faceMesh model and filter images
function preload() {
  faceMesh = ml5.faceMesh(options, modelReady);
  hearts = loadImage("heart.png");
  tearsFilter = loadImage("tears.png");
  questionMarkFilter = loadImage("question marks.png");
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

  tryAgainButton = createButton("Fetch a new joke");
  tryAgainButton.position(width / 2 - 50, height - 50);
  tryAgainButton.mousePressed(resetJoke);
}

function gotFaces(results) {
  faces = results;
}

// Change background color and apply filter based on the detected emotion
function draw() {
  background(181, 170, 191);

  frameCounter++;
  if (frameCounter % detectionInterval === 0 && faceMesh) {
    faceMesh.detect(video, gotFaces);
  }

  // Check and set the background color based on the current emotion
  switch (currentEmotion) {
    case "happy":
      background(255, 154, 162);
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
    let detectedEmotion = detectEmotion(face);

    // Check if the detected emotion has changed
    if (detectedEmotion !== currentEmotion) {
      currentEmotion = detectedEmotion;
      emotionStartTime = millis(); // Reset the timer if emotion changes
      emotionMessage = ""; // Clear any previous message
    }

    // Calculate how long the current emotion has been held
    let emotionHoldTime = millis() - emotionStartTime;

    // If emotion has been held for longer than the threshold, show the message
    if (emotionHoldTime > emotionHoldThreshold) {
      switch (currentEmotion) {
        case "neutral":
          emotionMessage = "Why do you look so neutral, are you sad?";
          break;
        case "sad":
          emotionMessage = "Cheer up! Things will get better 😊";
          break;
        case "happy":
          emotionMessage = "You're smiling a lot! Having a great day?";
          break;
        case "confused":
          emotionMessage =
            "Feeling puzzled? Don't worry, you'll figure it out!";
          break;
        default:
          emotionMessage = "";
          break;
      }
    }

    // Apply the filter based on the current emotion
    if (currentEmotion !== "neutral") {
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

    // Show cooldown if applicable
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

    // Show the emotion message if any
    if (emotionMessage) {
      fill(0, 102, 153);
      textSize(20);
      textAlign(CENTER);
      text(emotionMessage, width / 2, videoY + videoHeight + 60);
    }

    // Draw keypoints on the face
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
    if (currentEmotion === "sad") {
      let leftEye = face.keypoints[159];
      let tearOffsetY = 30;

      image(
        tearsFilter,
        leftEye.x + videoX - 40,
        leftEye.y + videoY + tearOffsetY - 10,
        200,
        100
      );
    } else if (currentEmotion === "confused") {
      let foreheadCenter = face.keypoints[10];
      let questionMarkX = foreheadCenter.x + videoX + 90;
      let questionMarkY = foreheadCenter.y + videoY - 130;

      image(questionMarkFilter, questionMarkX - 30, questionMarkY, 130, 130);
    } else if (currentEmotion === "happy") {
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
    let eyebrowCenterDist = distance(eyebrowCenterLeft, eyebrowCenterRight); // Eyebrow raising or pulling together (to detect anger)

    // Measure the distance between the eyebrow and the eye to detect raising/lowering

    // Left eyebrow and eye
    let leftEyebrowHeight = Math.abs(leftEyebrow.y - face.keypoints[159].y); // Distance between left eyebrow and a point near left eye

    // Right eyebrow and eye
    let rightEyebrowHeight = Math.abs(rightEyebrow.y - face.keypoints[386].y); // Distance between right eyebrow and a point near right eye

    let emotion = "neutral";

    // Detect happiness (smiling)
    if (
      mouthWidth > 40 &&
      mouthHeight > 5 &&
      mouthHeight < 15 &&
      leftEyebrowHeight < 40 &&
      rightEyebrowHeight < 40
    ) {
      emotion = "happy";
    }

    // Detect confusion (raised eyebrow center, neutral mouth shape, and slight eye wideness)
    if (
      leftEyebrowHeight > 30 &&
      rightEyebrowHeight > 30 &&
      mouthHeight < 25 &&
      mouthWidth < 100 &&
      eyeOpenLeft < 20 &&
      eyeOpenRight < 20
    ) {
      emotion = "confused";
    }

    console.log(mouthWidth);

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
