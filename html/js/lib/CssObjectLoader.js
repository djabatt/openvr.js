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

        if ( objID.split('#')[0] == "light" ) {

          objData = handleLight( curObj, uniqueInd );
          cssObjects[ "Object_" + uniqueInd ] = objData.lightObj;
          cssObjects[ "Object_" + (uniqueInd+1) ] = objData.targetObj;
          uniqueInd++;

        } else if ( objID.split('#')[0] == "cube" ) {

          objData = handleCube( curObj, uniqueInd );

          cssGeometries[ "Geometry_" + uniqueInd ] = objData.geometry;
          cssMaterials[ "Material_" + uniqueInd ] = objData.material;
          cssObjects[ "Object_" + uniqueInd ] = objData.object;

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

  handleCube = function( object, uniqueInd ) {
    if (!object) {
      return {};
    }
    var geoObj = {
        type: "cube",
        width: curObj.width || 10,
        height: curObj.height || 10,
        depth: curObj.depth || 10,
        widthSegments: curObj.widthSegments || 1,
        heightSegments: curObj.heightSegments || 1,
        depthSegments: curObj.depthSegments || 1
    };

    var matObj = {
        type: "MeshBasicMaterial",
        parameters: {
            color: parseInt((curObj.color || "#ffffff").replace("#", "0x")),
            relectivity: 1,
            transparent: false,
            opacity: 1,
            wireframe: false,
            wireframeLineWidth: 1
        }
    };

    var objObj = {
        geometry: "Geometry_" + uniqueInd,
        material: "Material_" + uniqueInd,
        position: [
            curObj.x || 0,
            curObj.y || 0,
            curObj.z || 0
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

    return {
      geometry: geoObj,
      material: matObj,
      object: objObj
    }
  }

return this;
}());