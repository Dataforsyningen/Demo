(function() {
    // Set Kortforsyningen token, replace with your own token
    var kftoken = '9ca510be3c4eca89b1333cadbaa60c36';

    // Set projection as we are not using the default OpenLayers projections
    // You can define it yourself or you can use the proj4 library as done below
    proj4.defs('EPSG:25832', "+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs");
    ol.proj.proj4.register(proj4);
    var myProjection = ol.proj.get('EPSG:25832');
    var extent = [120000, 5661139.2, 1378291.2, 6500000];
    myProjection.setExtent(extent);

    // Set the WMTS tile grid. We do this on an overall basis as all the 
    // Kortforsyningen WMTS are based on the same tile grid
    var myTileGrid = new ol.tilegrid.WMTS({
        extent: extent,
        resolutions: [1638.4,819.2,409.6,204.8,102.4,51.2,25.6,12.8,6.4,3.2,1.6,0.8,0.4,0.2],
        matrixIds: ['L00','L01','L02','L03','L04','L05','L06','L07','L08','L09','L10','L11','L12','L13'],
    });
    
    // Set the attribution (the copyright statement shown in the lower right corner)
    // We do this as we want the same attributions for all layers
    var myAttributionText = '&copy; <a target="_blank" href="https://download.kortforsyningen.dk/content/vilk%C3%A5r-og-betingelser">Styrelsen for Dataforsyning og Effektivisering</a>';
    

    // GeoSearch styles
    // There is a style for the three geometry types
    var gsStyles = {
        'Point': [new ol.style.Style({
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: '#CC0000'
                })
            })
        })],
        'LineString': [new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#CC0000',
                width: 2
            })
        })],    
        'Polygon': [new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: '#CC0000',
                width: 2
            })
        })]
    };
    
    // Function to select correct style by looking at the geometry type of the feature
    var styleFunction = function (feature) {
        return gsStyles[feature.getGeometry().getType()];
    };
    
    // GeoSearch vector and layer - the geoetries are shown in red
    var gsVector = new ol.source.Vector({});
    var gsLayer = new ol.layer.Vector({
        source: gsVector,
        style: styleFunction
    });

    // Initialize the map
    var map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Group({
                'title': 'Base maps', // This title of the group is shown in the layer switcher
                layers: [
                    // Ortofoto [WMTS:orto_foraar]
                    new ol.layer.Tile({
                        title:'Ortofoto', // This is the layer title shown in the layer switcher
                        type:'base', // use 'base' for base layers, otherwise 'overlay'
                        visible: false, // by default this layer is not visible
                        opacity: 1.0, // no transparency
                        source: new ol.source.WMTS({
                            attributions: myAttributionText,
                            url: "https://services.kortforsyningen.dk/orto_foraar?token="+kftoken,
                            layer: "orto_foraar",
                            matrixSet: "View1",
                            format: "image/jpeg",
                            visible:'false',
                            tileGrid: myTileGrid,
                            style: 'default',
                            size: [256, 256]
                        })
                    }),
                    // Skærmkort [WMTS:topo_skaermkort]
                    new ol.layer.Tile({
                        opacity: 1.0,
                        title:'Skærmkort',
                        type:'base',
                        visible: true, // by default this layer is visible
                        source: new ol.source.WMTS({
                            attributions: myAttributionText,
                            url: "https://services.kortforsyningen.dk/topo_skaermkort?token="+kftoken,
                            layer: "dtk_skaermkort",
                            matrixSet: "View1",
                            format: "image/jpeg",
                            tileGrid: myTileGrid,
                            style: 'default',
                            size: [256, 256]
                        })
                    })
                ]
            }),
            new ol.layer.Group({
                'title': 'Overlays',
                layers: [
                    // Matrikelskel overlay [WMS:mat]
                    new ol.layer.Tile({
                        title:'Matrikel',
                        type:'overlay',
                        visible: false,
                        opacity: 1.0,
                        zIndex:1000,
                        source: new ol.source.TileWMS({
                            attributions: myAttributionText,
                            url: "https://services.kortforsyningen.dk/mat?token="+kftoken,
                            params:{
                                'LAYERS':'MatrikelSkel,Centroide',
                                'VERSION':'1.1.1',
                                'TRANSPARENT':'true',
                                'FORMAT': "image/png",
                                'STYLES':'' 
                            },
                        })
                    }),
                    // Hillshade overlay [WMS:dhm]
                    new ol.layer.Tile({
                        title:'Hillshade',
                        type:'overlay',
                        visible: false,
                        opacity: 1.0,
                        zIndex:900,
                        source: new ol.source.TileWMS({
                            attributions: myAttributionText,
                            url: "https://services.kortforsyningen.dk/dhm?token="+kftoken,
                            params:{
                                'LAYERS':'dhm_terraen_skyggekort_transparent_overdrevet',
                                'VERSION':'1.1.1',
                                'TRANSPARENT':'true',
                                'FORMAT': "image/png",
                                'STYLES':'' 
                            },
                        })
                    })
                ]
            }),
            gsLayer // add the geosearch layer without appearing in the layer control
        ],
        // turn off the default attribution control as we will create a new one later on
        controls: ol.control.defaults({ attribution: false }), 
        // make the view
        view: new ol.View({
            center: [654500, 6176450], // start center position
            zoom: 9, // start zoom level
            resolutions: myTileGrid.getResolutions(), // use the resolutions from the tile grid
            projection: myProjection // use our custom projection defined earlier
        })
    });
    
    // Add additional controls to map
    map.addControl(new ol.control.ScaleLine()); // add a scale line
    map.addControl(new ol.control.LayerSwitcher()); // add a layer switcher, notice this one requires an external library
    map.addControl(new ol.control.Attribution({ collapsible: false })); // add a custom attribution 
    
    // Make a typeahead of the input search field using Bootstrap 3 Typeahead
    $('input.typeahead').typeahead({
        displayText:  function (item){
            return item.presentationString; // this is the attribute of the JSON response to show in the dropdown
        },
        source:  function (query, process) {
            return $.get("https://services.kortforsyningen.dk/Geosearch", { 
                search: query,
                resources: "adresser", // the resource to search within - check valid resources on https://kortforsyningen.dk/indhold/geonoegler-geosearch 
                token: kftoken
            }, 
            function (response) { // This method is being called when data was received from GeoSearch
                if(response.data) {
                    return process(response.data);
                }
            });
        },
        afterSelect: function(item) { 
            // when an item in the dropdown was selected try to show the geometry of the item
            if(item.geometryWkt) {
                var format = new ol.format.WKT();
                var gsFeature = format.readFeature(item.geometryWkt, {
                    dataProjection: 'EPSG:25832',
                    featureProjection: 'EPSG:25832'
                });
                // add geosearch geometry to map
                gsVector.clear(); // remove any previous geosearch geometry
                gsVector.addFeature(gsFeature); // add new geosearch geometry
                map.getView().fit(gsVector.getExtent()); // zoom to geosearch geometry
            }
        }
    });
    
})();    
