var app;
var map;

class App {
  constructor() {
    this.placeList = [];
  }

  initialize() {
    // Hide share button if not supported
    if (navigator.share === undefined) {
      document.getElementById("share").remove();
    }

    this.initializePlaces();

    console.log("create the map");

    // create the map
    map = L.map("map", { zoomControl: false }).setView([51.508328, -0.124819], 13);

    // add tiles
    const tiles = L.tileLayer(
      "https://api.mapbox.com/styles/v1/kailan/clnmjy811006901qpergtfrho/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1Ijoia2FpbGFuIiwiYSI6ImNreHh6MjNtNzJhd3oyb21wYjRkY2U0aGsifQ.tZzQ-GAom5_D8SLwrqmy-Q",
      {
        minZoom: 10,
        maxZoom: 16,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    ).addTo(map);

    // Add existing found places
    let foundPlaces = JSON.parse(window.localStorage.getItem("places") || "{}");
    this.placeList.forEach((place) => {
      if (foundPlaces[place.name]) {
        place.showOverlay();
      }
    });

    document.getElementById("guess").addEventListener("keyup", (event) => {
      if (event.key === "Enter") {
        app.enterGuess();
      }
    });

    // show initial score
    this.displayScore();
  }
} // App

const roundelIcon = L.icon({
    iconUrl: '/assets/roundel.svg',
    iconSize: [32, 32],
});

class Place {
  constructor(name, pt) {
    this.name = name;
    this.pt = pt;

    this.overlay = null;
  }

  showOverlay() {
    L.marker(this.pt, {
      icon: roundelIcon
    })
      .bindTooltip(this.name, {
        direction: "right",
        className: "place-tooltip"
      })
      .addTo(map);
  }
  pan() {
    map.panTo(this.pt, {
      animate: true,
    });
  }
}

function loadPage() {
  console.log("load page");

  app = new App();
  app.initialize();

  // focus the input
  document.getElementById("guess").focus();
}

function enterGuess() {
  app.enterGuess();
}

function normalizeName(name) {
  return (
    name
      .toUpperCase()
      .replace(/\&/g, "AND")
      .replace(/STREET/g, "ST")
      // only alphanumeric chars
      .replace(/\W/g, "")
  );
}

function getStore() {
  return JSON.parse(window.localStorage.getItem("places") || "{}");
}

function setStore(places) {
  window.localStorage.setItem("places", JSON.stringify(places));
}

function addToStore(place) {
  let found = getStore();
  found[place] = true;
  setStore(found);
}

function hasFoundPlace(place) {
  let found = getStore();
  return found[place];
}

App.prototype.enterGuess = function () {
  var inputField = document.getElementById("guess");
  var inputName = normalizeName(inputField.value);

  // see if there's a matching place name in the list
  var placeMatch = null;
  var placeMatchDistance = null;
  this.placeList.forEach((place) => {
    // Strip chars from the name of the station we're testing against
    const cleanName = normalizeName(place.name);

    // Calculate the difference between this station and the input
    const distance =
      cleanName == inputName ? -1 : dziemba_levenshtein(cleanName, inputName);

    if (placeMatchDistance && distance < placeMatchDistance) return;

    // Require exact match for short stations but be more lenient with longer station names
    var threshold =
      place.name.length < 5 ? 0 : place.name.length > 12 ? 2 : 1;

    // Special logic for Heathrow to make sure each individual terminal is matched exactly
    if (cleanName.startsWith("HEATHROW")) {
      threshold = 0;
    }

    if (distance <= threshold) {
      placeMatch = place;
      placeMatchDistance = distance;
    }
  });

  const alreadyFound = placeMatch && hasFoundPlace(placeMatch.name);

  // display the matching place on map
  if (placeMatch && !alreadyFound) {
    addToStore(placeMatch.name);
    placeMatch.showOverlay();
    placeMatch.pan();

    //// scroll to map, hiding header
    //// disabled for now because olly complained
    // document.getElementById("map").scrollIntoView({ behavior: "smooth", block: "center" });

    document
      .getElementById("score")
      .animate([{ color: "#000" }, { color: "#fff" }, { color: "#000" }], {
        duration: 1000,
        iterations: 1,
      });

    // refresh the score
    setTimeout(() => {
      this.displayScore();
    }, 500);

    // clear the input
    inputField.value = "";
  } else {
    if (placeMatch) placeMatch.pan();
    inputField
      .animate(
        [
          { transform: "translateX(-3px)" },
          { transform: "translateX(3px)" },
          { transform: "translateX(-3px)" },
          { transform: "translateX(3px)" },
          { transform: "translateX(-3px)" },
          { transform: "translateX(3px)" },
        ],
        {
          duration: 800,
          iterations: 1,
        }
      );
      inputField.select();
  }
};

App.prototype.displayScore = function () {
  var score = Object.keys(
    JSON.parse(window.localStorage.getItem("places") || "{}")
  ).length;
  document.getElementById("score").innerHTML = score;
  document.getElementById("total").innerHTML = this.placeList.length;

  const shareText = `I just played TubeGuessr and named ${score} London Underground stations!`;
  const shareData = {
    title: "TubeGuessr",
    text: shareText,
    url: window.location.href
  };
  document.getElementById("share").onclick = (e) => {
    e.preventDefault();
    navigator.share(shareData);
  };

  if (score >= this.placeList.length) {
    setTimeout("app.winMessage()", 100);
  }
};

App.prototype.winMessage = function () {
  alert("Well done! You found all " + this.placeList.length + " stations.");
};

function dziemba_levenshtein(a, b) {
  var tmp;
  if (a.length === 0) {
    return b.length;
  }
  if (b.length === 0) {
    return a.length;
  }
  if (a.length > b.length) {
    tmp = a;
    a = b;
    b = tmp;
  }

  var i,
    j,
    res,
    alen = a.length,
    blen = b.length,
    row = Array(alen);
  for (i = 0; i <= alen; i++) {
    row[i] = i;
  }

  for (i = 1; i <= blen; i++) {
    res = i;
    for (j = 1; j <= alen; j++) {
      tmp = row[j - 1];
      row[j - 1] = res;
      res = Math.min(tmp + (b[i - 1] !== a[j - 1]), res + 1, row[j] + 1);
    }
    row[j - 1] = res;
  }
  return res;
}
