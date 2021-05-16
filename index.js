require([
  "esri/layers/OpenStreetMapLayer",
  "esri/layers/FeatureLayer",
  "esri/Map",
  "esri/widgets/Popup",
  "esri/views/SceneView",
], function (OpenStreetMapLayer, FeatureLayer, Map, Popup, SceneView) {
  const map = new Map({ ground: "world-elevation" });

  window.view = new SceneView({
    container: "viewDiv",
    map: map,
    popup: {
      dockEnabled: true,
      dockOptions: {
        buttonEnabled: false,
        breakpoint: false,
        position: "bottom-right",
      },
    },
    camera: {
      position: {
        x: 175.2, //Longitude
        y: -41.9, //Latitude
        z: 50000, //Meters
      },
      tilt: 60,
    },
  });

  // UI
  const selectFilter = document.createElement("select");
  selectFilter.setAttribute("class", "esri-widget esri-select");
  selectFilter.setAttribute("style", "width: 275px; font-family: Avenir Next W00; font-size: 1em;");

  const filterOptions = [
    { value: "Status = 'Granted' AND Name LIKE '%Council%'", label: "ONLY council consents" },
    { value: "Status = 'Granted' AND NOT Name LIKE '%Council%'", label: "EXCLUDE council consents" },
    { value: "Status = 'Granted'", label: "INCLUDE council consents", selected: true },
  ];

  const searchParams = new URLSearchParams(window.location.search);
  filterOptions.forEach((fo) => {
    const option = document.createElement("option");
    option.value = fo.value;
    option.innerText = fo.label;
    option.selected = searchParams.has("filter") ? fo.value === searchParams.get("filter") : fo.selected;

    selectFilter.appendChild(option);
  });

  selectFilter.onchange = ({ target: { value } }) => {
    featureLayer.definitionExpression = value;
    searchParams.set("filter", value);
    history.pushState(null, "", window.location.pathname + "?" + searchParams.toString());
  };

  view.ui.add(selectFilter, "top-right");

  const osmLayer = new OpenStreetMapLayer();

  const featureLayer = new FeatureLayer({
    copyright: "Water consent data GWRC",
    url: "https://mapping.gw.govt.nz/arcgis/rest/services/GW/Resource_Consents_P/MapServer/2",
    outFields: ["*"],
    definitionExpression: searchParams.has("filter")
      ? searchParams.get("filter")
      : filterOptions.find((fo) => fo.selected).value,
    popupTemplate: {
      title: "{NAME}",
      content: [
        {
          type: "text",
          text: "{NAME} has consent to take {Inst_take_litres_per_sec} litres per second from the {Watercourse} watercouse of the {Catchment} catchment",
        },
        {
          type: "fields",
          fieldInfos: [
            {
              fieldName: "Consent_No",
              label: "Consent Number",
            },
            {
              fieldName: "Consent_Expiry",
              label: "Consent Expiry",
            },
          ],
        },
      ],
    },
  });

  // symbol using a cylinder as a resource
  const symbol = {
    type: "point-3d", // autocasts as new PointSymbol3D()
    symbolLayers: [
      {
        type: "object", // autocasts as new ObjectSymbol3DLayer()
        width: 0, // diameter of the object from east to west in meters
        height: 0, // height of the object in meters
        depth: 0, // diameter of the object from north to south in meters
        resource: { primitive: "cylinder" },
        material: { color: "blue" },
      },
    ],
  };

  featureLayer.renderer = {
    type: "simple",
    symbol,
    visualVariables: [
      { type: "size", axis: "width", valueExpression: "200", valueUnit: "meters" },
      { type: "size", axis: "depth", valueExpression: "200", valueUnit: "meters" },
      {
        type: "size",
        axis: "height",
        valueExpression: "$feature.Volume_per_year_m3 / 1000",
        valueUnit: "meters",
      },
    ],
  };
  map.add(osmLayer);
  map.add(featureLayer);
});
