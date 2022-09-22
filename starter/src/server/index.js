require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const path = require("path");
const cors = require("cors");
const { getRoversById, getApod, getRoversImages } = require("./api");

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.use("/", express.static(path.join(__dirname, "../public")));

// ----- routes -----
app.get("/apod", async (req, res) => {
  try {
    let image = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${process.env.API_KEY}`
    ).then((res) => res.json());
    res.send({ image });
  } catch (err) {
    console.log("error:", err);
  }
});

app.get("/rovers/:rover", async (req, res) => {
  const params = req.params;
  const roverName = params.rover;

  try {
    const dataResponse = await fetch(
      `https://api.nasa.gov/mars-photos/api/v1/manifests/${roverName}?api_key=${process.env.API_KEY}`
    );

    const missionManifest = await dataResponse.json();
    const manifest = {
      name: missionManifest.photo_manifest.name,
      landing_date: missionManifest.photo_manifest.landing_date,
      launch_date: missionManifest.photo_manifest.launch_date,
      max_date: missionManifest.photo_manifest.max_date,
      max_sol: missionManifest.photo_manifest.max_sol,
      status: missionManifest.photo_manifest.status,
    };

    res.send(manifest);
    res.status(200);
  } catch (err) {
    console.log(err);
    res.status(500);
  }
});

app.get("/rovers/:rover/images", async (req, res) => {
  try {
    const params = req.params;
    const roverName = params.rover;
    const query = req.query;
    const maxSol = query.max_sol;

    const dataResponse = await fetch(
      `https://api.nasa.gov/mars-photos/api/v1/rovers/${roverName}/photos?sol=${maxSol}&api_key=${process.env.API_KEY}`
    );
    let images = await dataResponse.json();

    const photos = images.photos;
    const newPhotoList = photos.map((image) => {
      return {
        img_src: image.img_src,
        rover: image.rover,
        id: image.id,
      };
    });
    console.log(newPhotoList);
    res.send(newPhotoList);
    res.status(200);
  } catch (e) {
    console.log(e);
    res.send(e);
    res.status(500);
  }
});

// start server
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
