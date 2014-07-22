var CssObjectLoader = (function () {

  var animations = {};
  // rotations are for staticly rotated objects at start
  var rotations = {};
  var objectHandlers = {};
  var cssGeometries = {}, cssMaterials = {}, cssObjects = {};

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

  this.parseCss = function() {
    $("#ovr-style").parsecss(function( result ) {
      var uniqueInd = 0;
      for ( objID in result ) {
        curObj = result[ objID ];

        var objectType = objID.split('#')[0].toLowerCase();

        handleObject(objectType, curObj, uniqueInd);
        if ( objectType == "light") uniqueInd++;

        handleAnimations( curObj, uniqueInd );
        handleRotations( curObj, uniqueInd );
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

  handleObject = function( objType, object, uniqueInd ) {
    objData = objectHandlers[objType]( object, uniqueInd );
  }

  // Object models for all the types of objects in a Scene
  // TODO: Make each less static
  // TODO: allow for more material options, etc

  handleAnimations = function( object, uniqueInd ) {
    var animObj = {};
    if (object.spinsX)
      animObj.spinsX = object.spinsX;
    if ( object.spinsY )
      animObj.spinsY = object.spinsY;
    if ( object.spinsZ )
      animObj.spinsZ = object.spinsZ;
    if ( animObj !== {} )
      animations[ objectTag(uniqueInd) ] = animObj;
  }

  handleRotations = function( object, uniqueInd ) {
    var rotObj = {};
    if ( object.rotateX ) {
      rotObj.rotateX = object.rotateX
    }
    if ( object.rotateY ) {
      rotObj.rotateY = object.rotateY
    }
    if ( object.rotateZ ) {
      rotObj.rotateZ = object.rotateZ
    }
    if ( rotObj !== {} )
      rotations[ objectTag(uniqueInd) ] = rotObj;
  }

  objectHandlers["light"] = handleLight = function( object, uniqueInd ) {
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
      target: "Object_" + ( uniqueInd + 1 )
    };

    cssObjects[ objectTag(uniqueInd) ] = lightObj;
    cssObjects[ objectTag(uniqueInd+1) ] = targetObj;

    return {
      lightObj: lightObj,
      targetObj: targetObj
    };

  };

  basicMaterial = function( color ) {
    return {
      type: "MeshLambertMaterial",
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

  threeObject = function( object, geoID, materialID ) {
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

  objectHandlers["plane"] = handlePlane = function( object, uniqueInd ) {
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

    cssGeometries[ geometryTag( uniqueInd ) ] = geoObj;
    cssMaterials[ materialTag( uniqueInd ) ] = matObj;
    cssObjects[ objectTag( uniqueInd ) ] = objObj;

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  objectHandlers["sphere"] = handleSphere = function( object, uniqueInd ) {
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
    cssObjects[ objectTag( uniqueInd ) ] = objObj;

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  objectHandlers["cube"] = handleCube = function( object, uniqueInd ) {
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
    cssObjects[ objectTag( uniqueInd ) ] = objObj;

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  objectHandlers["cylinder"] = handleCylinder = function( object, uniqueInd ) {
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
    cssObjects[ objectTag( uniqueInd ) ] = objObj;

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  objectHandlers["tetrahedron"] = handleTetrahedron = function( object, uniqueInd ) {
    if ( !object )
      return;

    var geoObj = { type: "tetrahedron", radius: object.radius, detail: object.detail };
    var matObj = basicMaterial( object.color );
    var objObj = threeObject( object, uniqueInd, uniqueInd );

    cssGeometries[ geometryTag( uniqueInd ) ] = geoObj;
    cssMaterials[ materialTag( uniqueInd ) ] = matObj;
    cssObjects[ objectTag( uniqueInd ) ] = objObj;

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  objectHandlers["ring"] = handleRing = function( object, uniqueInd ) {
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
    cssObjects[ objectTag( uniqueInd ) ] = objObj;

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  objectHandlers["torus"] = handleTorus = function( object, uniqueInd ) {
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
    cssObjects[ objectTag( uniqueInd ) ] = objObj;

    return { geometry: geoObj, material: matObj, object: objObj };
  }

  objectHandlers["torusknot"] = handleTorusKnot = function( object, uniqueInd ) {
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
    cssObjects[ objectTag( uniqueInd ) ] = objObj;

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