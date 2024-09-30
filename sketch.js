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
