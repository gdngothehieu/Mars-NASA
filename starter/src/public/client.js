// store
let store = {
  rovers: Immutable.List(["Curiosity", "Opportunity", "Spirit"]),
  roverManifests: Immutable.List([]),
  alreadyRequested: false,
  roverImages: Immutable.List([]),
};

const updateStore = (store, newState) => {
  store = Object.assign(store, newState);
};

// render App
const render = async (root, state) => {
  // render app with updated state
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

(function load() {
  window.addEventListener("load", () => {
    const root = document.getElementById("root");
    render(root, store);
  });
})();

// ------------------------------------------------------  COMPONENTS

// Pure function that renders conditional information
const Header = () => {
  return ` <h1 class="title">Welcome NASA officer!</h1>`;
};

const Tabs = (rovers) => {
  if (rovers) {
    const tablinks = [];
    for (let i = 0; i < rovers.length; i++) {
      tablinks.push(`<button class="tablinks" disabled>${rovers[i]}</button>`);
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

const renderInformation = () => {
  const { alreadyRequested } = store;
  if (!alreadyRequested) {
    updateStore(store, { alreadyRequested: true });
    getRoverManifests(store);
  }
};

// ----- API CALLS -------
const getRoverManifests = async (state) => {
  const { rovers } = state;
  let manifests = Immutable.List([]);

  // cache
  if (state.roverManifests.size === 0) {
    const promises = rovers
      .map((rover) => {
        return fetch(`http://localhost:3000/rovers/${rover}`)
          .then((res) => {
            return res.json();
          })
          .then((manifest) => {
            manifests = manifests.push(manifest);
          });
      })
      .toJS();

    Promise.all(promises).then((res) => {
      updateStore(store, { roverManifests: manifests });
      Array.from(document.getElementsByClassName("tablinks")).forEach(
        (btn) => (btn.disabled = false)
      );
    });
  }

  return manifests;
};

const getRoverImages = async function (state, roverName) {
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
    await fetch(
      `http://localhost:3000/rovers/${roverName}/images?max_sol=${maxSol}`
    )
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        updateStore(state, { roverImages: roverImages.concat(data) });
        return data;
      });
  }
};

const tabActivator = function (roverManifest) {
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

document.addEventListener("click", function (event) {
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
  container.classList.add("rover_info");
  const infoSection = document.createElement("div");

  infoSection.appendChild(createNodeWithInfo(`Name: ${roverManifest.name}`));
  infoSection.appendChild(
    createNodeWithInfo(`Landed: ${roverManifest.landing_date}`)
  );
  infoSection.appendChild(
    createNodeWithInfo(`Launched: ${roverManifest.launch_date}`)
  );
  infoSection.appendChild(
    createNodeWithInfo(`Last Images: ${roverManifest.max_date}`)
  );
  infoSection.appendChild(
    createNodeWithInfo(`Status: ${roverManifest.status}`)
  );

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
