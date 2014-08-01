var CssObjectLoader = (function () {

  var inputData = {};
  var objectHandlers = {};

  // animations are for things like active spinning
  var animations = {};

  // rotations are for staticly rotated objects at start
  var rotations = {};
  var cssGeometries = {}, cssMaterials = {}, cssObjects = {};

  // Preset data
  var lightTypes = {
    ambient: "AmbientLight", directional: "DirectionalLight",
    hemisphere: "HemisphereLight", point: "PointLight", spot: "SpotLight"
  };
  var ValidTypes = {
    ambientlight: true, directionallight: true, hemispherelight: true,
    pointlight: true, spotlight: true, meshbasicmaterial: true,
    meshlambertmaterial: true, plane: true, sphere: true,
    cube: true, box: true, cylinder: true, tetrahedron: true,
    ring: true, torus: true, torusknot: true
  };
  // Map to be sure that object of type and ID doesn't already exist
  // Example: cubegeometry#1 {(rules)} ... cubegeometry#1 {(diffrules)}
  // Set objectType[type][ID] = true on creation of new object
  var objectTypeMap = {};
  for ( type in ValidTypes ) {
    objectTypeMap[type] = {};
  }


  this.parseCss = function() {
    $("#ovr-style").parsecss(function( result ) {
      var uniqueInd = 0;
      for ( objID in result ) {
        curObj = result[ objID ];

        var objectType = objID.split('#')[0].toLowerCase();
        var objectTypeID = objID.split('#')[1];
        // Be sure it's a valid type
        if ( !ValidTypes[objectType] ) continue;
        // Be sure ID of this type doesn't already exist
        while ( objectTypeMap[objectType][objectTypeID] ) {
          objectTypeID += 1;
        }

        handleObject(objectType, curObj, uniqueInd, objectTypeID);
        if ( objectType == "light" )
          uniqueInd++;

        handleAnimations( curObj, objectType, objectTypeID );
        handleRotations( curObj, objectType, objectTypeID );
        uniqueInd++;
      }

    });
    var retObj = {
      objects: cssObjects,
      geometries: cssGeometries,
      materials: cssMaterials
    };
    return retObj;
  };



  //*************************************
  // Getters
  //*************************************

  this.getAnimations = function() {
    if ( animations!=={} )
      return animations;

    return undefined;
  }
  this.getRotations = function() {
    if ( rotations !== {} )
      return rotations;

    return undefined;
  }

  this.getObjects = function() {
    var data = parseCss();
    var importObject = {
      metadata: {
        formatVersion: 3.2,
        type: "scene",
        generatedBy: "SceneExporter",
        objects: Object.keys(data.objects).length,
        geometries: Object.keys(data.geometries).length,
        materials: Object.keys(data.materials).length,
        textures: 0
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



  //**************************************
  // Batch handlers
  //**************************************

  handleObject = function( objType, object, uniqueInd, objectTypeID ) {
    objData = objectHandlers[objType]( object, uniqueInd, objectTypeID );
  }

  // Object models for all the types of objects in a Scene
  // TODO: Make each less static
  // TODO: allow for more material options, etc

  handleAnimations = function( object, objType, objectTypeID ) {
    var animObj = undefined;
    if (object.spinsX)
      animObj= { spinsX: object.spinsX };
    if ( object.spinsY )
      animObj= { spinsY: object.spinsY };
    if ( object.spinsZ )
      animObj= { spinsZ: object.spinsZ };
    if ( animObj != undefined )
      animations[ objectTag(objectTypeID, objType) ] = animObj;
  }

  handleRotations = function( object, objType, objectTypeID ) {
    var rotObj = undefined;
    if ( object.rotateX !== undefined && object.rotateX !== 0 ) {
      rotObj = { rotateX: object.rotateX }
    }
    if ( object.rotateY !== undefined && object.rotateY !== 0 ) {
      rotObj = { rotateY: object.rotateY }
    }
    if ( object.rotateZ !== undefined && object.rotateZ !== 0 ) {
      rotObj = { rotateZ: object.rotateZ }
    }
    if ( rotObj != undefined ) {
      rotations[ objectTag(objectTypeID, objType) ] = rotObj;
    }
  }

  objectHandlers["directionallight"] = handleLight = function( object, uniqueInd, objectTypeID ) {
    if ( !object )
      return;

    var targetObj = {
      position: [ 0, 0, 0 ],
      rotation: [ 0, 0, 0 ],
      scale: [ 1, 1, 1 ],
      visible: true
    };

    var lightObj = {
      type: "DirectionalLight",
      color: parseInt((object.color || "#ffffff").replace("#", "0x")),
      intensity: object.intensity || 1.5,
      direction: [ object.x || 1, object.y || 1, object.z || 1 ],
      target: "Target_" + ( uniqueInd + 1 )
    };

    cssObjects[ objectTag(objectTypeID, "directionallight") ] = lightObj;
    cssObjects[ objectTag(uniqueInd+1, "Target") ] = targetObj;

    objectTypeMap['directionallight'][objectTypeID] = true;
    return {
      lightObj: lightObj,
      targetObj: targetObj
    };

  };

  basicMaterial = function( color, materialType ) {
    return {
      type: materialType || "MeshLambertMaterial",
      parameters: {
        color: parseInt((color || "#ffffff").replace("#", "0x")),
        ambient: parseInt("0xffffff"),
        emissive: 0,
        reflectivity: 1,
        transparent: false,
        opacity: 1,
        wireframe: false,
        wireframeLineWidth: 1
      }
    };
  };

  threeObject = function( object, geoID, materialID, objType ) {
    var objObj = {
      position: [ object.x || 0, object.y || 0, object.z || 0 ],
      rotation: [ 0, 0, 0 ],
      scale: [ object.scaleX || 1, object.scaleY || 1, object.scaleZ || 1 ],
      visible: true
    };
    if ( geoID !== undefined && materialID !== undefined ) {
      objObj.geometry = geometryTag( geoID );
      objObj.material = materialTag( materialID );
    }
    return objObj;
  }


  //*****************************************
  // Create handlers for support object types
  //*****************************************

  objectHandlers["plane"] = handlePlane = function( object, uniqueInd, objectTypeID ) {
    if (!object)
      return

    var geoObj = {
      type: "plane",
      width: object.width || 10,
      height: object.height || 10,
      widthSegments: object.widthSegments || 1,
      heightSegments: object.heightSegments || 1
    };

    var matObj = basicMaterial( object.color, "MeshBasicMaterial" );
    var objObj = threeObject( object, uniqueInd, uniqueInd );

    cssGeometries[ geometryTag( uniqueInd ) ] = geoObj;
    cssMaterials[ materialTag( uniqueInd ) ] = matObj;
    cssObjects[ objectTag( objectTypeID, 'plane' ) ] = objObj;

    objectTypeMap['plane'][objectTypeID] = true;

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  objectHandlers["sphere"] = handleSphere = function( object, uniqueInd, objectTypeID ) {
    if (!object)
      return;

    var geoObj = {
      type: "sphere",
      radius: object.radius || 5,
      detail: object.detail || 32
    };

    var matObj = basicMaterial( object.color );
    var objObj = threeObject( object, uniqueInd, uniqueInd );
    cssGeometries[ geometryTag( uniqueInd ) ] = geoObj;
    cssMaterials[ materialTag( uniqueInd ) ] = matObj;
    cssObjects[ objectTag( objectTypeID, 'sphere' ) ] = objObj;

    objectTypeMap['sphere'][objectTypeID] = true;

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  objectHandlers["cube"] = objectHandlers["box"] = handleCube = function( object, uniqueInd, objectTypeID ) {
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

    cssGeometries[ geometryTag( uniqueInd ) ] = geoObj;
    cssMaterials[ materialTag( uniqueInd ) ] = matObj;
    cssObjects[ objectTag( objectTypeID, 'box' ) ] = objObj;

    objectTypeMap['cube'][objectTypeID] = true;

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  objectHandlers["cylinder"] = handleCylinder = function( object, uniqueInd, objectTypeID ) {
    if (!object)
      return;
    var geoObj = {
      type: "cylinder",
      radiusTop: parseInt(object.radiusTop) || 5,
      radiusBottom: parseInt(object.radiusBottom) || 5,
      height: parseInt(object.height) || 10,
      radiusSegments: parseInt(object.radiusSegments) || 10,
      heightSegments: parseInt(object.heightSegments) || 1,
      openEnded: object.openEnded || false
    };
    var matObj = basicMaterial( object.color );
    var objObj = threeObject( object, uniqueInd, uniqueInd );

    cssGeometries[ geometryTag( uniqueInd ) ] = geoObj;
    cssMaterials[ materialTag( uniqueInd ) ] = matObj;
    cssObjects[ objectTag( objectTypeID, 'cylinder' ) ] = objObj;

    objectTypeMap['cylinder'][objectTypeID] = true;


    return { geometry: geoObj, material: matObj, object: objObj };
  }

  objectHandlers["tetrahedron"] = handleTetrahedron = function( object, uniqueInd, objectTypeID ) {
    if ( !object )
      return;

    var geoObj = { type: "tetrahedron", radius: object.radius, detail: object.detail };
    var matObj = basicMaterial( object.color );
    var objObj = threeObject( object, uniqueInd, uniqueInd );

    cssGeometries[ geometryTag( uniqueInd ) ] = geoObj;
    cssMaterials[ materialTag( uniqueInd ) ] = matObj;
    cssObjects[ objectTag( objectTypeID, 'tetrahedron' ) ] = objObj;

    objectTypeMap['tetrahedron'][objectTypeID] = true;

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  objectHandlers["ring"] = handleRing = function( object, uniqueInd, objectTypeID ) {
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

    cssGeometries[ geometryTag( uniqueInd ) ] = geoObj;
    cssMaterials[ materialTag( uniqueInd ) ] = matObj;
    cssObjects[ objectTag( objectTypeID, 'ring' ) ] = objObj;

    objectTypeMap['ring'][objectTypeID] = true;

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  objectHandlers["torus"] = handleTorus = function( object, uniqueInd, objectTypeID ) {
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

    cssGeometries[ geometryTag( uniqueInd ) ] = geoObj;
    cssMaterials[ materialTag( uniqueInd ) ] = matObj;
    cssObjects[ objectTag( uniqueInd, 'torus' ) ] = objObj;

    objectTypeMap['torus'][uniqueInd] = true;

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  objectHandlers["torusknot"] = handleTorusKnot = function( object, uniqueInd, objectTypeID ) {
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

    cssGeometries[ geometryTag( uniqueInd ) ] = geoObj;
    cssMaterials[ materialTag( uniqueInd ) ] = matObj;
    cssObjects[ objectTag( objectTypeID, 'torusknot' ) ] = objObj;

    objectTypeMap['torusknot'][objectTypeID] = true;

    return { geometry: geoObj, material: matObj, object: objObj };
  }



  //*********************************
  // Helper Functions
  //*********************************

  objectTag = function( uniqueInd, objType ) {
    objType = objType ? objType : 'Object';
    return objType + "_" + uniqueInd;
  }
  materialTag = function( uniqueInd ) {
    return "Material_" + uniqueInd;
  }
  geometryTag = function( uniqueInd ) {
    return "Geometry_" + uniqueInd;
  }

return this;
}());