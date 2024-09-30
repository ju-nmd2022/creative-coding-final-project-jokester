function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {}

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
      // Process or display the results here
    })
    .catch((err) => console.error("API request failed:", err));
}
