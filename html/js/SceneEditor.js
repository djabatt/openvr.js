//*********************************************
//* VREditor
//* Manages Scene and its children
//* Responds to changes requested by a UI
//*********************************************

var SceneEditor = function () {
  this.SceneLoader = new THREE.SceneLoader();
  this.CssExporter = new CssExporter();
  this.CssObjectLoader = CssObjectLoader;

  // Static scene objects
  this.scene = new THREE.Scene();
  this.sceneHelpers = new THREE.Scene();
  this.selected = null;
  this.objects = {};
  this.geometries = {};
  this.materials = {};
  this.textures = {};
  this.helpers = {};

  // Statically rotated objects
  this.rotatedObjects = {};

  // Moving objects
  this.movingObjects = {};

  this.signals = {

    transformModeChanged: new Signal(),
    snapChanged: new Signal(),
    spaceChanged: new Signal(),
    rendererChanged: new Signal(),
    effectChanged: new Signal(),

    sceneGraphChanged: new Signal(),
    cameraChanged: new Signal(),

    objectSelected: new Signal(),
    objectAdded: new Signal(),
    objectChanged: new Signal(),
    objectRemoved: new Signal(),

    helperAdded: new Signal(),
    helperRemoved: new Signal(),

    materialChanged: new Signal(),
    fogTypeChanged: new Signal(),
    fogColorChanged: new Signal(),
    fogParametersChanged: new Signal(),

    windowResize: new Signal()

  };
  return this;


};

SceneEditor.prototype = {
  setScene: function( scene ) {
    this.scene.name = scene.name;

    for ( var child = 0; child < scene.children.length; child++ ) {
      this.addObject( scene.children[ child ] );
    }

    this.signals.sceneGraphChanged.Raise();

  },

  setRotatedObjects: function( rotations ) {

    if ( rotations === undefined )
      this.rotatedObjects = {};

    this.rotatedObjects = rotations;
  },

  setMovingObjects: function( rotations ) {

    if ( rotations === undefined )
      this.movingObjects = {};

    this.movingObjects = rotations;
  },

  setSceneFromCss: function( ) {
    var scope = this;

    var cssImportObject = this.CssObjectLoader.getObjects();
    this.SceneLoader.parse( cssImportObject, function( e ) {
      while( e.scene.children.length > 0 ) {
        scope.addObject( e.scene.children[ 0 ] );
      }
    }, '.');

    this.signals.sceneGraphChanged.Raise();

    this.setRotatedObjects( this.CssObjectLoader.getRotations() );
    this.setMovingObjects( this.CssObjectLoader.getAnimations() );

  },
  exportSceneCss: function( ) {

    if ( this.scene.children.length === 0 ) {
      return '';
    }

    return this.CssExporter.parse( scene );
  },
  initRotations: function( ) {
    // Apply initial static rotations
    for ( objID in this.rotatedObjects ) {
      var currentObj = this.scene.getObjectByName( objID );
      var currentRot = this.rotatedObjects[ objID ];
      if ( currentRot.rotateX ) {
          currentObj.geometry.applyMatrix(
              new THREE.Matrix4().makeRotationX( THREE.Math.degToRad( parseInt(currentRot.rotateX) ) )
          );
          currentObj.geometry.verticesNeedUpdate = true;
      }
      if ( currentRot.rotateY ) {
          currentObj.geometry.applyMatrix(
              new THREE.Matrix4().makeRotationY( THREE.Math.degToRad( parseInt(currentRot.rotateY) ) )
          );
          currentObj.geometry.verticesNeedUpdate = true;
      }
      if ( currentRot.rotateZ ) {
          currentObj.geometry.applyMatrix(
              new THREE.Matrix4().makeRotationZ( THREE.Math.degToRad( parseInt(currentRot.rotateZ) ) )
          );
          currentObj.geometry.verticesNeedUpdate = true;
      }
    }
    this.signals.sceneGraphChanged.Raise();
  },

  /****** Object management ******/

  addObject: function( object ) {

    var scope = this;

    object.traverse( function( child ) {
      if ( child.geometry !== undefined ) scope.addGeo( child.geometry );
      if ( child.material !== undefined ) scope.addMat( child.material );

      scope.addHelper( child );

    } );

    this.scene.add( object );
    this.signals.objectAdded.Raise( object );
    this.signals.sceneGraphChanged.Raise();

  },
  setObjName: function( object, name ) {

    object.name = name;
    this.signals.sceneGraphChanged.Raise();

  },
  removeObj: function( object ) {

    if ( object.parent === undefined ) return;
    if ( confirm( 'Delete ' + object.name + '?' ) === false ) return;

    // TODO: Remove child helpers if we implement them

    object.parent.remove( object );
    this.signals.objectRemoved.Raise();
    this.signals.sceneGraphChanged.Raise( object );

  },

  /****** Geometry management ******/

  addGeo: function( geo ) {

    this.geometries[ geo.name ] = geo;

  },
  setGeoName: function( geo, name ) {

    geometry.name = name;
    this.signals.sceneGraphChanged.Raise();

  },

  /****** Material management ******/
  addMat: function( mat ) {

    this.materials[ mat.name ] = mat;

  },
  setMaterialName: function( mat, name ) {

    mat.name = name;
    this.signas.sceneGraphChanged.Raise();

  },
  addTexture: function( texture ) {

    this.textures[ texture.name ] = texture;

  },

  /****** Helper management ******/
  addHelper: function () {

    var geometry = new THREE.SphereGeometry( 20, 4, 2 );
    var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );

    return function ( object ) {

      var helper;

      if ( object instanceof THREE.Camera ) {

        helper = new THREE.CameraHelper( object, 10 );

      } else if ( object instanceof THREE.PointLight ) {

        helper = new THREE.PointLightHelper( object, 10 );

      } else if ( object instanceof THREE.DirectionalLight ) {

        helper = new THREE.DirectionalLightHelper( object, 20 );

      } else if ( object instanceof THREE.SpotLight ) {

        helper = new THREE.SpotLightHelper( object, 10 );

      } else if ( object instanceof THREE.HemisphereLight ) {

        helper = new THREE.HemisphereLightHelper( object, 10 );

      } else if ( object instanceof THREE.SkinnedMesh ) {

        helper = new THREE.SkeletonHelper( object );

      } else {

        // no helper for this object type
        return;

      }

      var picker = new THREE.Mesh( geometry, material );
      picker.name = 'picker';
      picker.userData.object = object;
      picker.visible = false;
      helper.add( picker );

      this.sceneHelpers.add( helper );
      this.helpers[ object.id ] = helper;

      this.signals.helperAdded.Raise( helper );

    };

  }(),

  removeHelper: function() {
    if ( this.helpers[ object.id ] !== undefined ) {

      var helper = this.helpers[ object.id ];
      helper.parent.remove( helper );

      delete this.helpers[ object.id ];

      this.signals.helperRemoved.Raise( helper );

    }
  },

  parent: function ( object, parent ) {

    if ( parent === undefined ) {

      parent = this.scene;

    }

    parent.add( object );

    this.signals.sceneGraphChanged.Raise();

  },

  select: function ( object ) {

    this.selected = object;
    this.signals.objectSelected.Raise( object );

  },

  selectByName: function( name ) {
    var scope = this;

    this.scene.traverse( function( child ) {
      if ( child.name === name ) {
        scope.select( child );
      }
    });
  },

  deselect: function ( object ) {
    this.select( null );
  },

  /****** Utils ******/
  getObjectType: function( object ) {
    for ( var type in this.objTypes ) {
      if ( object instanceof objTypes[type] ) return type;
    }
  },

  getGeoType: function( geo ) {
    for ( var type in this.geoTypes ) {
      if ( geo instanceof geoTypes[ type ] ) return type;
    }
  },

  getMatType: function( mat ) {
    for ( var type in this.matTypes ) {
      if ( mat instanceof matTypes[ type ] ) return type;
    }
  },


  /****** Types ******/
  objTypes: {
    'Scene': THREE.Scene,
    'PerspectiveCamera': THREE.PerspectiveCamera,
    'AmbientLight': THREE.AmbientLight,
    'DirectionalLight': THREE.DirectionalLight,
    'HemisphereLight': THREE.HemisphereLight,
    'PointLight': THREE.PointLight,
    'SpotLight': THREE.SpotLight,
    'SkinnedMesh': THREE.SkinnedMesh,
    'Mesh': THREE.Mesh,
    'Sprite': THREE.Sprite,
    'Object3D': THREE.Object3D
  },
  geoTypes: {
    'BoxGeometry': THREE.BoxGeometry,
    'CircleGeometry': THREE.CircleGeometry,
    'CylinderGeometry': THREE.CylinderGeometry,
    'ExtrudeGeometry': THREE.ExtrudeGeometry,
    'IcosahedronGeometry': THREE.IcosahedronGeometry,
    'LatheGeometry': THREE.LatheGeometry,
    'OctahedronGeometry': THREE.OctahedronGeometry,
    'ParametricGeometry': THREE.ParametricGeometry,
    'PlaneGeometry': THREE.PlaneGeometry,
    'PolyhedronGeometry': THREE.PolyhedronGeometry,
    'ShapeGeometry': THREE.ShapeGeometry,
    'SphereGeometry': THREE.SphereGeometry,
    'TetrahedronGeometry': THREE.TetrahedronGeometry,
    'TextGeometry': THREE.TextGeometry,
    'TorusGeometry': THREE.TorusGeometry,
    'TorusKnotGeometry': THREE.TorusKnotGeometry,
    'TubeGeometry': THREE.TubeGeometry,
    'Geometry': THREE.Geometry,
    'BufferGeometry': THREE.BufferGeometry
  },
  matTypes: {
    'LineBasicMaterial': THREE.LineBasicMaterial,
    'LineDashedMaterial': THREE.LineDashedMaterial,
    'MeshBasicMaterial': THREE.MeshBasicMaterial,
    'MeshDepthMaterial': THREE.MeshDepthMaterial,
    'MeshFaceMaterial': THREE.MeshFaceMaterial,
    'MeshLambertMaterial': THREE.MeshLambertMaterial,
    'MeshNormalMaterial': THREE.MeshNormalMaterial,
    'MeshPhongMaterial': THREE.MeshPhongMaterial,
    'PointCloudMaterial': THREE.PointCloudMaterial,
    'ShaderMaterial': THREE.ShaderMaterial,
    'SpriteCanvasMaterial': THREE.SpriteCanvasMaterial,
    'SpriteMaterial': THREE.SpriteMaterial,
    'Material': THREE.Material
  }

}