//**********************************************
//*			View.js
//* Adds elements that the user will see
//* to the page. Inits rendering, controls, grid
//* and other helpers
//**********************************************

var View = function ( editor ) {

	var container = document.getElementById("container");

	var signals = editor.signals;
	var scene = editor.scene;
	var sceneHelpers = editor.sceneHelpers;

	var objects = [];

	// Helpers
	var grid = new THREE.GridHelper( 500, 25 );
	sceneHelpers.add( grid );

	var camera = new THREE.PerspectiveCamera( 50, 1, 1, 5000 );
	camera.position.fromArray( [ 500, 250, 500 ] );
	camera.lookAt( new THREE.Vector3().fromArray( [ 0, 0, 0 ] ) );

	var selectionBox = new THREE.BoxHelper();
	selectionBox.material.depthTest = false;
	selectionBox.material.transparent = true;
	selectionBox.visible = false;
	sceneHelpers.add( selectionBox );

	// TODO: Set a container for all of this, to enable the transform controls
	var transformConrols = new THREE.transformConrols( camera, container );
	transformControls.addEventListener( 'change', function () {

		controls.enabled = true;

		if ( transformControls.axis !== null ) {

			controls.enabled = false;

		}

		if ( editor.selected !== null ) {

			signals.objectChanged.dispatch( editor.selected );

		}

	} );
	sceneHelpers.add( transformControls );

	// fog
	var oldFogType = "None";
	var oldFogColor = 0xaaaaaa;
	var oldFogNear = 1;
	var oldFagFar = 5000;
	var oldFogDensity = 0.00025;

	// object picking
	var ray = new THREE.Raycaster();
	var projector = new THREE.Projector();

	// events
	var getIntersects = function( event, object ) {
		var rect = container.getBoundingClientRect();
		var x = ( event.clientX - rect.left ) / rect.width;
		var y = ( event.clientY - rect.top ) / rect.height;
		var vector = new THREE.Vector3( ( x ) * 2 - 1, - ( y ) * 2 + 1, 0.5 );
		projector.unprojectVector( vector, camera );

		ray.set( camera.position, vector.sub( camera.position ).normalize() );

		if ( object instanceof Array ) {
			return ray.intersectObjects( object );
		}
		return ray.intersectObject( object );
	};

	var onMouseDownPosition = new THREE.Vector2();
	var onMouseUpPosition = new THREE.Vector2();

	var onMouseDown = function ( event ) {
		event.preventDefault();

		var rect = container.getBoundingClientRect();
		var x = ( event.clientX - rect.left ) / rect.width;
		var y = ( event.clintY - rect.top ) / rect.height;
		onMouseDownPosition.set( x, y );

		document.addEventListener( 'mouseup', onMouseUp, false );

	}
	var onMouseUp = function ( event ) {
		var rect = container.getBoundingClientRect();
		var x = (event.clientX - rect.left) / rect.width;
		var y = (event.clientY - rect.top) / rect.height;
		onMouseUpPosition.set( x, y );

		if ( onMouseDownPosition.distanceTo( onMouseUpPosition ) == 0 ) {
			var intersects = getIntersects( event, objects );
			if ( intersects.length > 0 ) {
				var object = intersects[ 0 ].object;
				if ( object.userData.object !== undefined ) {
					// helper
					editor.select( object.userData.object );
				} else {
					editor.select( object );
				}
			} else {
				editor.select( null );
			}
			render();
		}
		document.removeEventListener( 'mouseup', onMouseUp );
	};
	var onDoubleClick = function( event ) {
		var intersets = getIntersects( event, objects );
		if ( intersects.length > 0 && intersects[0].object === editor.selected ) {
			controls.focus( editor.selected );
		}
	};

	container.addEventListener( 'mousedown', onMouseDown, false );
	container.addEventListener( 'dblclick', onDoubleClick, false );

	var controls = new THREE.EditorControls( camera, container );
	controls.center.fromArray( new THREE.Vector3().fromArray( [ 0, 0, 0 ] ) );
	controls.addEventListener( 'change', function() {
		tranformControls.update();
		editor.cameraChanged.Raise( camera );
	});

	// Transform control events
	editor.signals.transformModeChanged.AddListener( function( mode ) {
		transformControls.setMode( mode );
	});
	editor.signals.snapChanged.AddListener( function( dist ) {
		transformControls.setSnap( dist );
	});
	editor.signals.spaceChanged.AddListener( function( space ) {
		transformControls.setSpace( space );
	});

	// Scene changed events

	editor.signals.sceneGraphChanged.AddListener( function() {
		render();
	});

	editor.signals.objectSelected.AddListener( function( object ) {

		selectionBox.visible = false;
		transformControls.detach();

		if ( object !== null ) {
			if ( object.geometry !== undefined && object instanceof THREE.Sprite === false ) {
				selectionBox.update( object );
				selectionBox.visible = true;
			}

			if ( object instanceof THREE.PerspectiveCamera === false ) {
				transformControls.attach( object );
			}
		}
		render();
	});

	editor.signals.objectAdded.add( function( object ) {
		var materialsNeedUpdate = false;
		object.traverse( function( child ) {
			if ( child instanceof THREE.Light ) materialsNeedUpdate = true;
			objects.push( child );
		} );
		if ( materialsNeedUpdate === true ) updateMaterials();
	});

	editor.signals.objectChanged.add( function( object ) {
		transformControls.update();

		if ( object !== camera ) {
			if ( object.geometry !== undefined ) {
				selectionBox.update( object );
			}
			if ( editor.helpers[ object.id ] !== undefined ) {
				editors.helpers[ object.id ].update();
			}
		}
		render();
	});
	// TODO keep adding in these signals based on UI changes. Basically hookup the
	// Transform and Editor controls to the SceneEditor for state changes.
}