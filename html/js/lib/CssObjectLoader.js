var CssObjectLoader = (function () {

  this.loadCss = function() {
    var data = parseCss();
    var importObject = {
      metadata: {
        formatVersion: 3.2,
        type: "scene",
        generatedBy: "SceneExporter",
        objects: Object.keys(data.objects).length,
        geometries: Object.keys(data.geometries).length,
        materials: Object.keys(data.materials).length
      },
      urlBaseType: "relativeToScene",
      objects: data.objects,
      geometries: data.geometries,
      materials: data.materials,
      textures: {},
      fogs: {},
      transform: {
        position: [ 0, 0, 0 ],
        rotiation: [ 0, 0, 0 ],
        scale: [ 1, 1, 1 ]
      },
      defaults: {
        camera: "",
        fog: ""
      }
    };
    return importObject;
  };

  this.parseCss = function() {
    var cssGeometries = {}, cssMaterials = {}, cssObjects = {};
    $("#ovr-style").parsecss(function( result ) {
      var uniqueInd = 0;
      for ( objID in result ) {
        var geoObj = {}, matObj = {}, objObj = {}, objData = {};
        curObj = result[ objID ];

        var objectType = objID.split('#')[0].toLowerCase();
        if ( objectType == "light" ) {

          objData = handleLight( curObj, uniqueInd );
          cssObjects[ "Object_" + uniqueInd ] = objData.lightObj;
          cssObjects[ "Object_" + (uniqueInd+1) ] = objData.targetObj;
          uniqueInd++;

        } else if ( objectType == "cube" ) {

          objData = handleCube( curObj, uniqueInd );
          cssGeometries[ geometryTag( uniqueInd ) ] = objData.geometry;
          cssMaterials[ materialTag( uniqueInd ) ] = objData.material;
          cssObjects[ objectTag( uniqueInd ) ] = objData.object;

        } else if ( objectType == "sphere" ) {

          objData = handleSphere( curObj, uniqueInd );
          cssGeometries[ geometryTag( uniqueInd ) ] = objData.geometry;
          cssMaterials[ materialTag( uniqueInd ) ] = objData.material;
          cssObjects[ objectTag( uniqueInd ) ] = objData.object;

        } else if ( objectType == "cylinder" ) {

          objData = handleCylinder( curObj, uniqueInd );
          cssGeometries[ geometryTag( uniqueInd ) ] = objData.geometry;
          cssMaterials[ materialTag( uniqueInd ) ] = objData.material;
          cssObjects[ objectTag( uniqueInd ) ] = objData.object;

        } else if ( objectType == "tetrahedron" ) {

          objData = handleTetrahedron( curObj, uniqueInd );
          cssGeometries[ geometryTag( uniqueInd ) ] = objData.geometry;
          cssMaterials[ materialTag( uniqueInd ) ] = objData.material;
          cssObjects[ objectTag( uniqueInd ) ] = objData.object;

        } else if ( objectType == "ring" ) {

          objData = handleRing( curObj, uniqueInd );
          cssGeometries[ geometryTag( uniqueInd ) ] = objData.geometry;
          cssMaterials[ materialTag( uniqueInd ) ] = objData.material;
          cssObjects[ objectTag( uniqueInd ) ] = objData.object;

        } else if ( objectType == "torus" ) {

          objData = handleTorus( curObj, uniqueInd );
          cssGeometries[ geometryTag( uniqueInd ) ] = objData.geometry;
          cssMaterials[ materialTag( uniqueInd ) ] = objData.material;
          cssObjects[ objectTag( uniqueInd ) ] = objData.object;

        } else if ( objectType == "torusknot" ) {

          objData = handleTorusKnot( curObj, uniqueInd );
          cssGeometries[ geometryTag( uniqueInd ) ] = objData.geometry;
          cssMaterials[ materialTag( uniqueInd ) ] = objData.material;
          cssObjects[ objectTag( uniqueInd ) ] = objData.object;

        }
        uniqueInd++;
      }

      cssObjects[ "Object_" + uniqueInd ] = cameraObj;
    });
    var retObj = {
      objects: cssObjects,
      geometries: cssGeometries,
      materials: cssMaterials
    };
    return retObj;
  };


  // Object models for all the types of objects in a Scene
  // TODO: Make each less static
  // TODO: allow for more material options, etc

  // TODO: allow for custom camera
  var cameraObj = {
    "position": [ 0, 10, 0 ],
    "rotation": [ 0, 0, 0 ],
    "scale": [ 1, 1, 1 ],
    "visible": true,
    "children": {
        "Object_31": {
            "position": [ 0, 0, 0 ],
            "rotation": [ 0, 0, 0 ],
            "scale": [ 1, 1, 1 ],
            "visible": true,
            "children": {
                "Object_27": {
                    "type": "PerspectiveCamera",
                    "fov": 75,
                    "aspect": 1.8459563543003852,
                    "near": 1,
                    "far": 1000,
                    "position": [ 0, 0, 0 ]
                }
            }
        }
    }
};

  handleLight = function( object, uniqueInd ) {
    if ( !object )
      return;

    var targetObj = {
      position: [
        0,
        0,
        0
      ],
      rotation: [
        0,
        0,
        0
      ],
      scale: [
        1,
        1,
        1
      ],
      visible: true
    };

    var lightObj = {
      type: "DirectionalLight",
      color: parseInt((object.color || "#ffffff").replace("#", "0x")),
      intensity: object.intensity || 1,
      direction: [
        object.x || 1,
        object.y || 1,
        object.z || 1
      ],
      target: "Object_" + ( uniqueInd + 1 )
    };
    return {
      lightObj: lightObj,
      targetObj: targetObj
    };

  };

  basicMaterial = function( color ) {
    return {
      type: "MeshBasicMaterial",
      parameters: {
        color: parseInt((color || "#ffffff").replace("#", "0x")),
        reflectivity: 1.5,
        transparent: false,
        opacity: 1,
        wireframe: false,
        wireframeLineWidth: 1
      }
    };
  };

  threeObject = function( object, geoID, materialID ) {
    var objObj = {
      position: [ object.x || 0, object.y || 0, object.z || 0 ],
      rotation: [ object.rotateX || 0, object.rotateY || 0, object.rotateZ || 0 ],
      scale: [ object.scaleX || 1, object.scaleY || 1, object.scaleZ || 1 ],
      visible: true
    };
    if ( geoID !== undefined && materialID !== undefined ) {
      objObj.geometry = "Geometry_" + geoID,
      objObj.material = "Mateiral_" + materialID
    }
    return objObj;
  }

  handlePlane = function( object, uniqueInd ) {
    if (!object)
      return

    var geoObj = {
      type: "plane",
      width: object.width || 10,
      height: object.height || 10,
      widthSegments: object.widthSegments || 1,
      heightSegments: object.heightSegments || 1
    };

    var matObj = basicMaterial( object.color );
    var objObj = threeObject( object, uniqueInd, uniqueInd );

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  handleSphere = function( object, uniqueInd ) {
    if (!object)
      return;

    var geoObj = {
      type: "sphere",
      radius: object.radius || 5,
      detail: object.detail || 32
    };

    var matObj = basicMaterial( object.color );
    var objObj = threeObject( object, uniqueInd, uniqueInd );

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  handleCube = function( object, uniqueInd ) {
    if (!object) {
      return {};
    }
    var geoObj = {
        type: "cube",
        width: object.width || 10,
        height: object.height || 10,
        depth: object.depth || 10,
        widthSegments: object.widthSegments || 1,
        heightSegments: object.heightSegments || 1,
        depthSegments: object.depthSegments || 1
    };

    var matObj = basicMaterial( object.color );
    var objObj = threeObject( object, uniqueInd, uniqueInd );

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  handleCylinder = function( object, uniqueInd ) {
    if (!object)
      return;

    var geoObj = {
      type: "cylinder",
      radiusTop: object.radiusTop || 5,
      radiusBottom: object.radiusBottom || 5,
      height: object.height || 10,
      radiusSegments: object.radiusSegments || 10,
      heightSegments: object.heightSegments || 1,
      openEnded: object.openEnded || false
    };
    var matObj = basicMaterial( object.color );
    var objObj = threeObject( object, uniqueInd, uniqueInd );

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  handleTetrahedron = function( object, uniqueInd ) {
    if ( !object )
      return;

    var geoObj = { type: "tetrahedron", radius: object.radius, detail: object.detail };
    var matObj = basicMaterial( object.color );
    var objObj = threeObject( object, uniqueInd, uniqueInd );

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  handleRing = function( object, uniqueInd ) {
    if ( !object )
      return;

    var geoObj = {
      type: "ring",
      innerRadius: object.innerRadius,
      outerRadius: object.outerRadius,
      thetaSegments: object.thetaSegments,
      phiSegments: object.phiSegments,
      thetaStart: object.thetaStart,
      thetaLength: object.thetaLength
    };
    var matObj = basicMaterial( object.color );
    var objObj = threeObject( object, uniqueInd, uniqueInd );

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  handleTorus = function( object, uniqueInd ) {
    if ( !object )
      return;

    var geoObj = {
      type: "torus",
      radius: object.radius,
      tube: object.tube,
      radialSegments: object.radialSegments,
      tubularSegments: object.tubularSegments,
      arc: object.arc,
    };
    var matObj = basicMaterial( object.color );
    var objObj = threeObject( object, uniqueInd, uniqueInd );

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  handleTorusKnot = function( object, uniqueInd ) {
    if ( !object )
      return;

    var geoObj = {
      type: "torusknot",
      radius: object.radius || 100,
      tube: object.tube || 40,
      radialSegments: object.radialSegments || 64,
      tubularSegments: object.tubularSegments || 8,
      p: object.p || 2,
      q: object.q || 3,
      heightScale: object.heightScale || 1
    }
    var matObj = basicMaterial( object.color );
    var objObj = threeObject( object, uniqueInd, uniqueInd );

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  objectTag = function( uniqueInd ) {
    return "Object_" + uniqueInd;
  }
  materialTag = function( uniqueInd ) {
    return "Material_" + uniqueInd;
  }
  geometryTag = function( uniqueInd ) {
    return "Geometry_" + uniqueInd;
  }

return this;
}());