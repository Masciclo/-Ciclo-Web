mapboxgl.accessToken = 'pk.eyJ1IjoibWFzY2ljbG8iLCJhIjoiY2ttcnp6eWNuMGQydTJvcGYzeGVsd2RqbSJ9.YqyHFex6gmdhgJoICN_V9A';
var map;
var closeDescription;
var descriptionSection;

var isLayerChecked;
var evaluacionCategories = {
  'Ciclovía Aprobada':'#6db86b', 
  'Ciclovía Reprobada':'#ff0000',
  'Cruce Aprobado':'rgba(106, 215, 106, 0.65)',
  'Cruce Reprobado':'rgba(255, 0, 0, 0.65)', 
};

var tipologiaCategories = {
  'Ciclovía sobre calzada':'rgba(255, 0, 0, 0.90)',
  'Ciclovía sobre platabanda':'rgba(126, 93, 226, 0.90)',
  'Ciclovía sobre vereda':'rgba(97, 176, 255, 0.90)',
  'Ciclovereda':'rgba(238, 130, 238, 0.90)',
  'Ciclovía sobre bandejón':'rgba(255, 166, 0, 0.90)', 
  'Ciclovía sobre parque':'rgba(0, 128, 0, 0.90)',
};

var geojson = {
  "type": "FeatureCollection",
  "features": []
};

$(document).ready(function(){
  closeDescription = document.querySelectorAll('.close-description');
  descriptionSection = document.getElementById('description-section');

  var popup;
  map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/masciclo/ckpw5ezqw57xa17mej6wlk7r9', // style URL
    center: [-70.6518120833, -33.44807677931364], // starting position [lng, lat]
    zoom: 10 // starting zoom
  });

  // navigation conteol
  var navigationControl = new mapboxgl.NavigationControl();
  map.addControl(navigationControl, 'bottom-right');
  
  // direction control
  var directions = new MapboxDirections({
    accessToken:mapboxgl.accessToken,
    interactive:false,
    unit: 'metric',
    profile: 'mapbox/cycling'
  });

  // add to your mapboxgl map
  map.addControl(directions, 'top-right');


  map.on("load",()=>{
    console.log("map loading")
    // add map layers
    map.addSource('evaluacion', {
      type:'vector',
      url:'mapbox://masciclo.5wkgbrba'
    });

    map.addLayer({
      'id':'evaluacion',
      'source':'evaluacion',
      'source-layer':'evaluacion-drd8qy',
      'type':'line',
      'paint':{
        'line-width':[
          "interpolate",
          ["exponential", 1.16],
          ["zoom"],
          15,
          3,
          22,
          20
        ],
        'line-color':[
          'match',
          ['get', 'Evaluació'],
          'Ciclovía reprobada',
          'red',
          'Ciclovía aprobada',
          'darkgreen', 
          'Cruce aprobado',
          'orange',
          'Cruce reprobado',
          'lightgreen', 
          'transparent'
        ]
      },
      'layout':{
        'visibility':'none'
      }
    });

    map.addSource('tipologia', {
      type:'vector',
      url:'mapbox://masciclo.ds5x425g'
    });

    map.addLayer({
      'id':'tipologia',
      'source':'tipologia',
      'source-layer':'tipologia-a9tvmr',
      'type':'line',
      'paint':{
        'line-width':[
          "interpolate",
          ["exponential", 1.16],
          ["zoom"],
          15,
          3,
          22,
          20
        ],
        'line-color':[
          'match',
          ['get', 'Tipología'],
          'Ciclovía sobre calzada',
          'red',
          'Ciclovía sobre platabanda',
          'blue',
          'Ciclovía sobre bandejón',
          'orange', 
          'Ciclovía sobre parque',
          'green',
          'Ciclovía sobre vereda',
          'indigo',
          'Ciclovereda',
          'violet',
          'transparent'
        ]
      },
      'layout':{
        'visibility':'none'
      }
    });

    map.addSource('selected', {
      type:'geojson',
      data:geojson
    });

    map.addLayer({
      'id':'selected-route',
      'source':'selected',
      'type':'line',
      'paint':{
        'line-width':[
          "interpolate",
          ["exponential", 1.16],
          ["zoom"],
          15,
          1.5,
          22,
          65
        ],
        'line-color':'#333',
        'line-blur':3
      }
    });

    // Add the control to the map.
    map.addControl(
      new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,

        placeholder:'Buscar...'
      }),
      'top-left'
    );

    // Initial la
    console.log("map loaded");

    map.on('click', function(e) {
      console.log(e);

      // query the clicked features
      var features = map.queryRenderedFeatures(
        e.point,
        { layers: ['cruce-dlmdhg', 'ciclovia-5n33t9'] }
      );

      
      if(features[0]) {
        console.log(features);

        let feature = features[0];
        createPopup(feature, e.lngLat, feature.layer.id); 

        geojson.features = [feature];
        map.getSource('selected').setData(geojson);
      }

    });

    map.on('mouseover', 'cruce-dlmdhg', mouseOverEvent);
    map.on('mouseout', 'cruce-dlmdhg', mouseOutEvent);

    map.on('mouseover', 'ciclovia-5n33t9', mouseOverEvent);
    map.on('mouseout', 'ciclovia-5n33t9', mouseOutEvent);

    function mouseOverEvent() {
      map.getCanvas().style.cursor = 'pointer';
    }

    function mouseOutEvent() {
      map.getCanvas().style.cursor = '';
    }
  });

  function createPopup(feature, coord, layer) {
    let popupContent;

    if(layer == 'ciclovia-5n33t9') {
      popupContent = getCycloviaPopupContent(feature.properties);
    } else {
      popupContent = getCrucesPopupContent(feature.properties);
    }
    
    popup ? popup.remove() : '';
    if(popup) {
      geojson.features = [];
      map.getSource('selected').setData(geojson);
    }

    popup = new mapboxgl.Popup()
      .setLngLat(coord)
      .setHTML(popupContent)
      .addTo(map);

      popup.on('close', function(e) {
        // 
        map.getSource('selected').setData({"type":"FeatureCollection", "features":[]});
      });

  }

  function getCycloviaPopupContent(feature) {
    let popupContent = "<div class='popup-content'>"+
      "<div class='popup-item'><div>Comuna</div><div>" + feature['COMUNA'] +"</div></div>" +
      "<div class='popup-item'><div>Evaluación de calidad</div><div>" + feature['Evaluació'] +"</div></div>" +
      "<div class='popup-item'><div>Direccionalidad</div><div>" + feature['Direcciona'] +"</div></div>"+
      "<div class='popup-item'><div>Tipología</div><div>" + feature['Tipología'] +"</div></div>"+
      "<div class='popup-item'><div>Tipología vía de emplazamiento</div><div>" + feature['Tipolog_1-'] +"</div></div>"+
      "<div class='popup-item'><div>Ancho Ciclovía</div><div>" + feature['Ancho_Cicl'] +"</div></div>"+
      "<div class='popup-item'><div>Segregada de peatones</div><div>" + feature['Segregada'] +"</div></div>"+
      "<div class='popup-item'><div>Segregación de calzada</div><div>" + feature['Segregaci'] +"</div></div>"+
      "<div class='popup-item'><div>Superficie</div><div>" + feature['Superficie'] +"</div></div>"+ 
      "<div class='popup-item'><div>Señalización pista</div><div>" + feature['Señalizac'] +"</div></div>"+
      "<div class='popup-item'><div>Características particulares</div><div>" + feature['Caracterí'] +"</div></div>"+
    "</div>";
    return popupContent;
  }

  function getCrucesPopupContent(feature) {
    let popupContent = "<div class='popup-content'>"+
      "<div class='popup-item'><div>Comuna</div><div>" + feature['COMUNA'] +"</div></div>" +
      "<div class='popup-item'><div>Evaluación de calidad</div><div>" + feature['Evaluació'] +"</div></div>" +
      "<div class='popup-item'><div>Direccionalidad</div><div>" + feature['Direcciona'] +"</div></div>" +
      "<div class='popup-item'><div>Tipología </div><div>" + feature['Tipología'] +"</div></div>" +
      "<div class='popup-item'><div>Tipología vía de emplazamiento</div><div>" + feature['Tipolog_1'] +"</div></div>" +
      "<div class='popup-item'><div>Tipología vía de intersectada</div><div>" + feature['Tipolog_12'] +"</div></div>" +
      "<div class='popup-item'><div>Demarcación cruce</div><div>" + feature['Demarcaci'] +"</div></div>" +
      "<div class='popup-item'><div>Pintura de color en el cruce</div><div>" + feature['Pintura_de'] +"</div></div>" +
      "<div class='popup-item'><div>Cartel ciclo-temático</div><div>" + feature['Cartel__pa'] +"</div></div>" +
      "<div class='popup-item'><div>Semáforo para ciclistas</div><div>" + feature['Semaforo_p'] +"</div></div>" +
    "</div>";

    return popupContent;    
  }

  function setLayout(checked, layout){
    if(checked){
      map.setLayoutProperty(layout, 'visibility', 'visible')
    }
    else{
      map.setLayoutProperty(layout, 'visibility', 'none')
    }

  }

  // toggle the side tab
  var infoWindow = $('#info-window');
  var toggleButton = $('#toggle-button');

  toggleButton.on("click", function(e) {
    infoWindow.toggleClass("closed");
  });

  function toggleCollapse(collapseId, isChecked=false) {
    let myCollapse = document.getElementById(collapseId);
    let bsCollapse = new bootstrap.Collapse(myCollapse, {toggle:false});

    if(isChecked) {
      bsCollapse.show();
    } else {
      bsCollapse.hide();
    }

  }

  function toggleDescriptionText(elementId, isVisible) {
    $('.description-text').each(function(i) {
      // console.log(this.classList);
      // if(!this.classList.contains('d-none')) {
      //   this.classList.add('d-none');
      // }
    });

    if(isVisible) {
      $('#'+elementId).removeClass('d-none');
    } else {
      $('#'+elementId).addClass('d-none');
    } 
    
  }

  class LegendControl {
    constructor() {
      this._container = document.createElement('div');
    }

    updateLegendContent(categories, title) {
      let html = '';
      for (const key in categories) {
        if (Object.hasOwnProperty.call(categories, key)) {
          const color = categories[key];
          html += `<div class="d-flex"><div class="feature-line" style="background-color:${color};"></div>${key}</div>`
        }
      }
      
      console.log(this._container);
      this._container.innerHTML = `<div class="legend-title">${title}</div>`;
      this._container.innerHTML += `<div class="legend-body">${html}</div>`;
    }

    setDefaultContent() {
      this._container.innerHTML = `<div class="legend-body">
        <div class="d-flex"><div class="feature-line" style="background-color:#37C1EB;"></div>Leyenda 1</div>
        <div class="d-flex"><div class="feature-line" style="background-color:#272E53;"></div>Leyenda 2</div>
      </div>`;

    }

    onAdd(map) {
      this._map = map;     
      this._container.classList.add("legend-container");

      // populate the container with content
      // this._container.innerHTML = "Legend Container";
      // return the container
      return this._container;
    }

    onRemove() {
      this._container.parentNode.removeChild(this._container);
      this._map = undefined;
    }
  }

  // control instance
  let legendControl = new LegendControl();
  legendControl.setDefaultContent();

  map.addControl(legendControl, 'bottom-left');


  // toggle the legend and legend info
  let tipologiaCheckbox = $('#tipologia');
  let evaluacionCheckbox = $('#evaluacion');

  // toggle the collape and layer section
  evaluacionCheckbox.on("change", function(e) {
    handleLayerChange(e, 'EVALUACIÓN DE CALIDAD');
  });

  tipologiaCheckbox.on("change", function(e) {
    handleLayerChange(e, 'TIPOLOGÍA DE CICLOVÍA');
  });

  function handleLayerChange(e, layerTitle) {
    let { id, checked }= e.target;

    // update the layer on the map
    setLayout(checked, id);

    // toggle the collapse section
    let collapseId = 'layer-' + id;
    toggleCollapse(collapseId, checked);

    let categories = id == 'evaluacion' ? evaluacionCategories : tipologiaCategories;
    // toggleCollapse('layer-evaluacion');
    legendControl.updateLegendContent(categories, layerTitle);
    isLayerChecked = checked;
    seDefaultLegendContent();

    let otherLayer = id == 'evaluacion' ? 'tipologia' : 'evaluacion';
    setLayout(false, otherLayer);
    $(`#${otherLayer}`).prop( "checked", false );

    let textId = 'text-' + id;
    toggleDescriptionText(textId, checked);
    toggleDescriptionText(`text-${otherLayer}`, !checked);


    // toggle
    openDescriptionSection(checked, textId);
  }

  function seDefaultLegendContent() {
    if(!isLayerChecked) {
      legendControl.setDefaultContent();
    }
    
  }

  // close the description section
  closeDescription.forEach(span => {
    span.onclick = function(e) {
      descriptionSection.classList.toggle('close');
    }
  });

  function openDescriptionSection(checked, textId) {
    if(checked) {
      descriptionSection.classList.remove('close');
    } 
  }

  

});

// legend container

