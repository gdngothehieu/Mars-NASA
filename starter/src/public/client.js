// Storing immutable list and use them throughout the lifecycle
let store = {
  rovers: Immutable.List(["Curiosity", "Opportunity", "Spirit"]),
  roverManifests: Immutable.List([]),
  alreadyRequested: false,
  roverImages: Immutable.List([]),
};
// Assigning new state to store
const updateStore = (store, newState) => {
  store = Object.assign(store, newState);
};
// Adding root inner html
const render = async (root, state) => {
  root.innerHTML = App(state);
};

const App = (state) => {
  return `
        <header>${Header()}</header>
        <main>
            <section class="control_panel">
                ${Tabs(state.rovers)}
                ${TabContent()}
            </section>
        </main>
        <footer></footer>
    `;
};

// ------------------------------------------------------  COMPONENTS

// Pure function that renders conditional information
const Header = () => {
  return ` <h1 class="title">Welcome NASA officer!</h1>`;
};

const Tabs = (rovers) => {
  if (rovers) {
    const tablinks = [];
    for (let i = 0; i < rovers._tail.array.length; i++) {
      tablinks.push(
        `<button class="tablinks" disabled>${rovers._tail.array[i]}</button>`
      );
    }
    return `${tablinks.join("")} `;
  }
};

const TabContent = () => {
  renderInformation();
  return `
    <div  id="tabcontent">
    </div>
    `;
};
// Initiate request
const renderInformation = () => {
  const { alreadyRequested } = store;
  if (!alreadyRequested) {
    updateStore(store, { alreadyRequested: true });
    getRoverManifests(store);
  }
};

// ----- API CALLS -------
const getRoverManifests = async (state) => {
  try {
    const { rovers } = state;
    let manifests = Immutable.List([]);

    // cache
    if (state.roverManifests.size === 0) {
      const roversResponse = rovers.map((rover) => {
        return fetch(`http://localhost:3000/rovers/${rover}`)
          .then((res) => {
            return res.json();
          })
          .then((manifest) => {
            manifests = manifests.push(manifest);
          });
      });
      Promise.all(roversResponse).then((res) => {
        updateStore(store, { roverManifests: manifests });
        Array.from(document.getElementsByClassName("tablinks")).forEach(
          (btn) => (btn.disabled = false)
        );
      });
    }
  } catch (e) {
    console.log(e);
  }
};

const getRoverImages = async (state, roverName) => {
  const { roverManifests } = state;
  const { roverImages } = state;
  const maxSol = roverManifests
    .filter((manifest) => manifest.name === roverName)
    .get(0).max_sol;

  // cache
  if (
    roverImages.size === 0 ||
    roverImages.filter((image) => image.rover.name === roverName).size === 0
  ) {
    let dataResponse = await fetch(
      `http://localhost:3000/rovers/${roverName}/images?max_sol=${maxSol}`
    );

    dataResponse = await dataResponse.json();
    updateStore(state, { roverImages: roverImages.concat(dataResponse) });
    return dataResponse;
  }
};

const tabActivator = (roverManifest) => {
  const roverInfoSection = createRoverInfoSection(
    roverManifest,
    createNodeWithInfo
  );
  const tabContent = document.getElementById("tabcontent");
  const roverContainer = document.createElement("div");

  roverContainer.classList.add("rover_container");
  roverContainer.appendChild(roverInfoSection);

  //fetch images
  getRoverImages(store, roverManifest.name).then(() => {
    const { roverImages } = store;
    const roverImagesForRover = roverImages.filter(
      (image) => image.rover.name === roverManifest.name
    );
    const roverImageSection = createRoverImageSection(
      roverImagesForRover,
      createImage
    );
    roverContainer.appendChild(roverImageSection);
  });

  tabContent.innerHTML = "";
  tabContent.appendChild(roverContainer);
};

document.addEventListener("click", (event) => {
  const target = event.target;

  if (target && target.className === "tablinks") {
    const { roverManifests } = store;
    const { roverImages } = store;
    const roverManifest = roverManifests
      .filter((manifest) => {
        return manifest.name === event.target.innerText;
      })
      .get(0);
    tabActivator(roverManifest, roverImages);
  }
});

const createNodeWithInfo = function (text) {
  //higher order function
  const p = document.createElement("p");
  const textNode = document.createTextNode(text);
  p.appendChild(textNode);
  return p;
};

const createRoverInfoSection = function (roverManifest, createNodeWithInfo) {
  const container = document.createElement("div");
  const infoSection = document.createElement("div");
  const infos = [
    `Name: ${roverManifest.name}`,
    `Landing Date: ${roverManifest.landing_date}`,
    `Launched Date: ${roverManifest.launch_date}`,
    `Most recent: ${roverManifest.max_date}`,
    `Most photos taken: ${roverManifest.max_date}`,
    `Status: ${roverManifest.status}`,
  ];
  for (let i = 0; i < infos.length; i++) {
    infoSection.appendChild(createNodeWithInfo(infos[i]));
  }

  container.appendChild(infoSection);
  return container;
};

const createImage = function (src) {
  //higher order function
  const img = document.createElement("img");
  img.src = src;
  return img;
};
const createRoverImageSection = function (roverImages, createImage) {
  const container = document.createElement("div");
  container.classList.add("rover_images");

  roverImages.forEach((image) => {
    container.appendChild(createImage(image.img_src));
  });
  return container;
};

window.addEventListener("load", () => {
  const root = document.getElementById("root");
  render(root, store);
});
