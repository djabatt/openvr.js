//**********************************************
//*			View.js
//* Adds elements that the user will see
//* to the page. Inits rendering, controls, grid
//* and other helpers
//**********************************************

var View = function ( editor ) {

	var container = document.getElementById("container");

	var signals = editor.signals;
	var sceneHelpers = editor.sceneHelpers;

	var objects = [];

	// Helpers
	var grid = new THREE.GridHelper( 500, 25 );
	editor.sceneHelpers.add( grid );

	var camera = new THREE.PerspectiveCamera( 50, 1, 1, 5000 );
	camera.position.fromArray( [ 250, 125, 250 ] );
	camera.lookAt( new THREE.Vector3().fromArray( [ 0, 0, 0 ] ) );

	var selectionBox = new THREE.BoxHelper();
	selectionBox.material.depthTest = false;
	selectionBox.material.transparent = true;
	selectionBox.visible = false;
	editor.sceneHelpers.add( selectionBox );

	var transformControls = new THREE.TransformControls( camera, container );
	transformControls.addEventListener( 'change', function () {

		controls.enabled = true;

		if ( transformControls.axis !== null ) {

			controls.enabled = false;

		}

		if ( editor.selected !== null ) {

			signals.objectChanged.Raise( editor.selected );

		}

	} );
	editor.sceneHelpers.add( transformControls );

	// Effect
	var oldEffectType = "None";

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
		var y = ( event.clientY - rect.top ) / rect.height;
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
		var intersects = getIntersects( event, objects );
		if ( intersects.length > 0 && intersects[0].object === editor.selected ) {
			controls.focus( editor.selected );
		}
	};

	container.addEventListener( 'mousedown', onMouseDown, false );
	container.addEventListener( 'dblclick', onDoubleClick, false );

	var controls = new THREE.EditorControls( camera, container );
	controls.center.fromArray( new THREE.Vector3().fromArray( [ 0, 0, 0 ] ) );
	controls.addEventListener( 'change', function() {
		transformControls.update();
		editor.signals.cameraChanged.Raise( camera );
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

	editor.signals.objectAdded.AddListener( function( object ) {
		var materialsNeedUpdate = false;
		object.traverse( function( child ) {
			if ( child instanceof THREE.Light ) materialsNeedUpdate = true;
			objects.push( child );
		} );
		if ( materialsNeedUpdate === true ) updateMaterials();
	});

	editor.signals.objectChanged.AddListener( function( object ) {
		transformControls.update();

		if ( object !== camera ) {
			if ( object.geometry !== undefined ) {
				selectionBox.update( object );
			}
			if ( editor.helpers[ object.id ] !== undefined ) {
				editor.helpers[ object.id ].update();
			}
		}
		render();
	});

	editor.signals.helperAdded.AddListener( function( object ) {
		objects.push( object.getObjectByName( 'picker' ) );
	});

	editor.signals.helperRemoved.AddListener( function( object ) {
		objects.splice( objects.indexOf( object.getObjectByName( 'picker' ) ), 1);
	});

	editor.signals.materialChanged.AddListener( function( material ) {
		render();
	});

	editor.signals.fogTypeChanged.AddListener( function( fogType ) {
		if ( fogtype !== oldFogType ) {
			if ( fogtype === "None" ) {
				editor.scene.fog = null;
			} else if ( fogType === "Fog" ) {
				editor.scene.fog = new THREE.Fog( oldFogColor, oldFogNear, oldFogFar );
			} else if ( fogType === "FogExp2" ) {
				editor.scene.fog = new THREE.FogExp2( oldFogColor, oldFogDensity );
			}
			updateMaterials();
			oldFogType = fogType;
		}

		render();
	});

	editor.signals.fogColorChanged.AddListener( function( fogColor ) {
		oldFogColor = fogColor;
		updateFog( editor.scene );
		render();
	});

	editor.signals.fogParametersChanged.AddListener( function( fogObj ) {
		oldFogNear = fogObj.near;
		oldFogFar = fogObj.far;
		oldFogDensity = fogObj.density;

		updateFog( editor.scene );

		render();
	});

	editor.signals.effectChanged.AddListener( function( effectType ) {
		if ( effectType !== oldEffectType ) {
			if ( effectType === "None" ) {
				// TODO: Turn off the effects
			} else if ( effectType === "OculusRift" ) {
				// TODO: Turn on the effect
			}
			render();
		}
	});

	editor.signals.windowResize.AddListener( function() {
		camera.aspect = container.offsetWidth / container.offsetHeight;
		camera.updateProjectionMatrix();

		render.setSize( container.offsetWidth, container.offsetHeight );
		render();

	});

	var clearColor, renderer;

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.autoClear = false;
	renderer.autoUpdateScene = false;
	renderer.setSize( container.offsetWidth, container.offsetHeight );
	container.appendChild( renderer.domElement );

	animate();

	function updateMaterials() {
		editor.scene.traverse( function( node ) {
			if ( node.material ) {
				node.material.needsUpdate = true;
			}
			if ( node.material instanceof THREE.MeshFaceMaterial ) {
				for ( var i = 0; i < node.material.materials.length; i++ ) {
					node.material.materials[ i ].needsUpdate = true;
				}
			}
		});
	}

	function updateFog( root ) {

		if ( root.fog ) {
			root.fog.color.setHex( oldFogColor );
			if ( root.fog.near !== undefined ) root.fog.near = oldFogNear;
			if ( root.fog.far !== undefined ) root.fog.far = oldFogFar;
			if ( root.fog.density !== undefined ) root.fog.density = oldFogDensity;
		}
	}

	function animate() {
		requestAnimationFrame( animate );

		if ( THREE.AnimationHandler.animations.length > 0 ) {
			THREE.AnimationHandler.update( 0.016 );
			for ( var i = 0, l = editor.sceneHelpers.children.length; i < l; i ++ ) {
				var helper = editor.sceneHelpers.children[ i ];
				if ( helper instanceof THREE.SkeletonHelper ) {
					helper.update();
				}
			}
			render();
		}
	}

	function render() {
		editor.sceneHelpers.updateMatrixWorld();
		editor.scene.updateMatrixWorld();

		renderer.clear();
		renderer.render( editor.scene, camera );

		renderer.render( editor.sceneHelpers, camera );
	}

	return this;

}