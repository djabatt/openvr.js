//*********************************************
//* VREditor
//* Manages Scene and its children
//* Responds to changes requested by a UI
//*********************************************

var VrEditor = function () {
  this.SceneLoader = new THREE.SceneLoader();
  this.CssExporter = new CssExporter();
  this.CssObjectLoader = CssObjectLoader;

  // Static scene objects
  this.scene = new THREE.Scene();
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



};

VrEditor.prototype = {
  setScene: function( scene ) {
    this.scene.name = scene.name;

    for ( var child = 0; child < scene.children.length; child++ ) {
      this.addObject( scene.children[ child ] );
    }
  },

  /****** Object management ******/

  addObject: function( object ) {
    object.traverse( function( child ) {
      if ( child.geometry !== undefined ) this.addGeo( child.geometry );
      if ( child.material !== undefined ) this.addMat( child.material );

      // TODO: Add a helper?
    } );

    this.scene.add( object );
    // TODO: notify dependent modules of addition

  },
  setObjName: function( object, name ) {
    object.name = name;

  },
  removeObj: function( object ) {
    if ( object.parent === undefined ) return;
    if ( confirm( 'Delete ' + object.name + '?' ) === false ) return;

    // TODO: Remove child helpers if we implement them

    object.parent.remove( object );

  },

  /****** Geometry management ******/

  addGeo: function( geo ) {
    this.geometries[ geometry.name ] = geo;
  },
  setGeoName: function( geo, name ) {
    geometry.name = name;
  },

  /****** Material management ******/
  addMaterial: function( mat ) {
    this.materials[ material.name ] = mat;

  },
  setMaterialName: function( mat, name ) {
    mat.name = name;
  },
  addTexture: function( texture ) {
    this.textures[ texture.name ] = texture;
  },

  /****** Helper management ******/
  addHelper: function() {

  },
  removeHelper: function() {

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