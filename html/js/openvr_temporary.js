(function() {

    // Vars
    var container,
        camera,
        scene,
        renderer,

        geometry,
        material,
        mesh,

        controls,
        time = Date.now(),

        effect, // rift effect
        objects = [],
        movingObjects = {},
        ray,

        vrstate = new vr.State(),

        defaultLightParams = {
            color: "ffffff",
            intensity: 1.5,
            position: {
                x: 1.5,
                y: 1.5,
                z: 1.5
            }
        };

    container = document.getElementById( 'container' );
    // Helper function
    function toRad( angle ) {
        return angle * (Math.PI / 180);
    }

    // Initialize VR.js
    vr.load( function( error ) {
        // if ( error ) {
        //     alert('Plugin load failed: ' + error.toString());
        // }

        initObjects();
        if ( controls && controls.connect ) {
            controls.connect();
        }
        animate();
    });

    function lightSource( params ) {
        var light = new THREE.DirectionalLight( parseInt( "0x" + params.color ), params.intensity )
        light.position.set(
            params.position.x,
            params.position.y,
            params.position.z
        );
        return light;
    }

    function setupPointerLock() {
        var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

        if ( havePointerLock ) {
         var element = document.body;

         var fullscreenchange = function ( event ) {
             if (document.fullscreenElement === element ||
                     document.mozFullscreenElement === element ||
                     document.mozFullScreenElement === element) {
                 document.removeEventListener( 'fullscreenchange', fullscreenchange );
                 document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
                 element.requestPointerLock();
             }
         }

         document.addEventListener( 'fullscreenchange', fullscreenchange, false );
         document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

         element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

         var pointerlockchange = function ( event ) {
             if (document.pointerLockElement === element ||
                     document.mozPointerLockElement === element ||
                     document.webkitPointerLockElement === element) {
                 controls.enabled = true;
             } else {
                 controls.enabled = false;
             }
         }

         var pointerlockerror = function ( event ) {
         }

         // Hook pointer lock state change events
         document.addEventListener( 'pointerlockchange', pointerlockchange, false );
         document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
         document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

         document.addEventListener( 'pointerlockerror', pointerlockerror, false );
         document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
         document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

         document.body.addEventListener( 'click', function ( event ) {
             // Ask the browser to lock the pointer
             element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
             element.requestPointerLock();
         }, false );
        } else {
         instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
        }
    }


    function initObjects() {
        // Clear objects and moving objects list
        objects = [];

        // Init scene
        scene = new THREE.Scene();

        // Light ray caster
        ray = new THREE.Raycaster();
        ray.ray.direction.set( 0, -1, 0 );

        // CSS Parsing -> Importable JSON
        var cssImportObject = CssObjectLoader.getObjects();
        movingObjects = CssObjectLoader.getAnimations();

        var loader = new THREE.SceneLoader();
        // var jScene = JSON.parse(localStorage.getItem('scene'));
        loader.parse(cssImportObject, function( e ) {
            scene = e.scene;
        }, '.');

        // Init camera
        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1100 );

        scene.add(camera);
        // Init controls
        // For laptop browser controls:
        // controls = new THREE.PointerLockControls( camera );
        if ( window.orientation ) {
            controls = new THREE.DeviceOrientationControls( camera );
        } else {
            controls = new THREE.PointerLockControls( camera );
            scene.add( controls.getObject() );
            setupPointerLock();
        }


        // Render
        renderer = new THREE.WebGLRenderer({
            devicePixelRatio: 1,
            alpha: false,
            clearColor: 0xffffff,
            autoUpdateObjects: true,
            antialias: true
        });

        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.domElement.style.position = "absolute";
        renderer.domElement.style.top = 0;
        effect = new THREE.OculusRiftEffect( renderer );

        container.appendChild( renderer.domElement );

        // Attach necessary event listeners
        window.addEventListener( 'resize', onWindowResize, false );
        document.addEventListener( 'keydown', keyPressed, false );
    }

    // function makeMotionMatrix( object ) {
    //     var totalMatrix = new THREE.Matrix4().identity();
    //     var tempMatrix = new THREE.Matrix4().identity();
    //     if ( object.spins ) {
    //         if (object.spins.x)
    //             totalMatrix.multiply( tempMatrix.makeRotationX( toRad(parseInt(object.spins.x)) ) );
    //         if (object.spins.y)
    //             totalMatrix.multiply( tempMatrix.makeRotationY( toRad(parseInt(object.spins.y)) ) );
    //         if (object.spins.z)
    //             totalMatrix.multiply( tempMatrix.makeRotationZ( toRad(parseInt(object.spins.z)) ) );
    //     }
    //     if ( object.orbits ) {
    //         totalMatrix.multiply( tempMatrix.makeTranslationX( parseInt(object.orbits.radius) ) );
    //         if ( object.orbits.x )
    //             totalMatrix.multiply( tempMatrix.makeRotationX( toRad( parseInt(object.orbits.x) ) ) );
    //         if ( object.orbits.y )
    //             totalMatrix.multiply( tempMatrix.makeRotationY( toRad( parseInt(object.orbits.y) ) ) );
    //         if ( object.orbits.z )
    //             totalMatrix.multiply( tempMatrix.makeRotationZ( toRad( parseInt(object.orbits.z) ) ) );
    //     }
    //     return totalMatrix;
    // }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }

    function keyPressed (event) {
        switch ( event.keyCode ) {
            case 79: // o
                effect.setInterpupillaryDistance(
                        effect.getInterpupillaryDistance() - 0.001);
                break;
            case 80: // p
                effect.setInterpupillaryDistance(
                        effect.getInterpupillaryDistance() + 0.001);
                break;

            case 70: // f
                if (!vr.isFullScreen()) {
                    vr.enterFullScreen();
                } else {
                    vr.exitFullScreen();
                }
                e.preventDefault();
                break;

            case 32: // space
                vr.resetHmdOrientation();
                event.preventDefault();
                break;
        }
    }

    function animate() {
        // vr.requestAnimationFrame(animate);
        window.requestAnimationFrame( animate );

        // controls.isOnObject( false );

        // ray.ray.origin.copy( controls.getObject().position );
        // ray.ray.origin.y -= 10;

        // var intersections = ray.intersectObjects( objects );
        // if ( intersections.length > 0 ) {
        //     var distance = intersections[ 0 ].distance;
        //     if ( distance > 0 && distance < 10 ) {
        //         controls.isOnObject( true );
        //     }
        // }

        for ( objID in movingObjects ) {
            var curObj = movingObjects[ objID ];
            scene.getObjectByName( objID ).rotation.x += toRad( curObj.spinsX || 0 );
            scene.getObjectByName( objID ).rotation.y += toRad( curObj.spinsY || 0 );
            scene.getObjectByName( objID ).rotation.z += toRad( curObj.spinsZ || 0 );
        }

        // Poll VR, if it's ready.
         var polled = vr.pollState(vrstate);
        // controls.update( Date.now() - time, polled ? vrstate : null );

        controls.update();
        //renderer.render( scene, camera );
        effect.render( scene, camera, polled ? vrstate : null );
    }
})();
