/*  

I have used chatGPT for help in this project. Beneatch is a link to the conversation that i have 
had with chatGPT. -->

https://chatgpt.com/share/66fa8143-b374-800d-a64a-07d768cfeb03

*/

let words = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  displayWords();
}

// This function will be triggered by the button click in the HTML
function searchDatamuse() {
  let query = document.getElementById("queryInput").value;
  if (query) {
    datamuseFetch(query);
  }
}

// Fetch function as before
function datamuseFetch(query) {
  let encodedQuery = encodeURIComponent(query);
  fetch(`https://api.datamuse.com/words?ml=${encodedQuery}`)
    .then((response) => response.json())
    .then((json) => {
      console.log(json);
      words = json;
      // Process or display the results here
    })
    .catch((err) => console.error("API request failed:", err));
}

function displayWords() {
  fill(255);
  textSize(24);

  for (let i = 0; i < words.length; i++) {
    let word = words[i].word;

    text(word, width / 2, 100 + i * 40);
  }
}

//poem structure test
//poem we chose is called limerick
//with help of chatgpt for the logics

// fetch rhyming words from the Datamuse API
async function fetchRhymes(word) {
  const response = await fetch(
    `https://api.datamuse.com/words?rel_rhy=${word}`
  );
  const data = await response.json();
  return data.map((entry) => entry.word);
}

// get a random word from a list of rhyming words
function getRandomWord(words) {
  return words[Math.floor(Math.random() * words.length)];
}

// extract nouns from a sentence so that the system recognises important terms about the user
function extractNouns(sentence) {
  const ignoredWords = [
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "if",
    "in",
    "on",
    "at",
    "by",
    "with",
    "for",
    "from",
    "to",
    "I",
  ];
  const words = sentence
    .toLowerCase()
    .replace(/[.,!?]/g, "") // remove punctuation
    .split(" ")
    .filter((word) => !ignoredWords.includes(word));

  return words;
}

// generate a limerick using rhyming words
async function generatePoem() {
  const input = document.getElementById("queryInput").value;

  if (!input) {
    alert("Please enter a sentence!");
    return;
  }

  // extract nouns from the input
  const nouns = extractNouns(input);
  if (nouns.length === 0) {
    alert("No suitable words found in your input.");
    return;
  }

  // use the first extracted noun as the base for A rhymes
  const baseWordA = nouns[0];
  const rhymesA = await fetchRhymes(baseWordA);
  if (rhymesA.length === 0) {
    alert("No rhyming words found for your input.");
    return;
  }

  // generate words for 'A' rhymes
  const nounA1 = getRandomWord(rhymesA); // A rhyme 1
  const verbA = getRandomWord(rhymesA); // A rhyme 2 (verb)
  const nounA2 = getRandomWord(rhymesA); // A rhyme 3 (for last line)

  // fetch rhyming words for B rhyme
  const baseWordB = nouns.length > 1 ? nouns[1] : "frog"; // use the second noun or fallback to 'frog'
  const rhymesB = await fetchRhymes(baseWordB);
  if (rhymesB.length === 0) {
    alert("No rhyming words found for the second word.");
    return;
  }

  const nounB1 = getRandomWord(rhymesB); // B rhyme 1
  const nounB2 = getRandomWord(rhymesB); // B rhyme 2

  // create the limerick
  const limerick = `
    There once was a ${nounA1} who could ${verbA},
    It ${verbA} all day without slack,
    But one day it met a ${nounB1},
    Who played with a ${nounB2} and a log,
    And now the ${nounA2} can't go back.
  `;

  document.getElementById("poemDisplay").textContent = limerick;
}
