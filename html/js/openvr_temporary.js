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

    var editor = Editor;
    editor.setCallback( buildScene );

    container = document.getElementById( 'container' );

    // Initialize VR.js
    vr.load( function( error ) {
        // if ( error ) {
        //     alert('Plugin load failed: ' + error.toString());
        // }

        initObjects();
        if (controls && controls.connect) {
            controls.connect();
        }
        animate();

    });

    $(".fullscreen").on('click', function() {
        event.preventDefault();
        toggleControls();
    });

    function setControls() {

        // For mobile device orientation controls
        if ( window.orientation ) {
            controls = new THREE.DeviceOrientationControls( camera );
        // For laptop browser controls:
        } else {
            // TODO: Fix pointer Lock, idk why it won't actually request it...
             var element = document.body;
             element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
             element.requestPointerLock();

            controls = new THREE.PointerLockControls( camera );
            controls.enabled = true;
            scene.add( controls.getObject() );
        }
        container.webkitRequestFullscreen();
    }

    document.addEventListener( 'webkitfullscreenchange', function( event ) {
        if ( $('#container').hasClass('controlled') ) {
            console.log('toggleControls');
            toggleControls();
        }
    }, false);

    function toggleControls() {
        if( $('#container').hasClass('controlled') ) {
            controls = undefined;
            $('container').removeClass('controlled');
        } else {
            setControls();
            $('#container').addClass('controlled');
        }
    }


    function buildScene() {
        // Clear objects and moving objects list
        objects = [];

        // Light ray caster
        ray = new THREE.Raycaster();
        ray.ray.direction.set( 0, -1, 0 );

        // CSS Parsing -> Importable JSON
        var cssImportObject = CssObjectLoader.getObjects();
        movingObjects = CssObjectLoader.getAnimations();
        rotatedObjects = CssObjectLoader.getRotations();

        var loader = new THREE.SceneLoader();
        // var jScene = JSON.parse(localStorage.getItem('scene'));
        loader.parse(cssImportObject, function( e ) {
            scene = e.scene;
        }, '.');

        // Apply initial static rotations
        for ( objID in rotatedObjects ) {
            var currentObj = scene.getObjectByName( objID );
            var currentRot = rotatedObjects[ objID ];
            if ( currentRot.rotateX ) {
                currentObj.geometry.applyMatrix(
                    new THREE.Matrix4().makeRotationX( toRad( parseInt(currentRot.rotateX) ) )
                );
            }
            if ( currentRot.rotateY ) {
                currentObj.geometry.applyMatrix(
                    new THREE.Matrix4().makeRotationY( toRad( parseInt(currentRot.rotateY) ) )
                );
            }
            if ( currentRot.rotateZ ) {
                currentObj.geometry.applyMatrix(
                    new THREE.Matrix4().makeRotationZ( toRad( parseInt(currentRot.rotateZ) ) )
                );
            }
        }

        // Init camera
        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1100 );

        scene.add(camera);
    }

    function initObjects() {
        buildScene();

        // Render
        renderer = new THREE.WebGLRenderer({
            devicePixelRatio: 1,
            alpha: false,
            clearColor: 0xffffff,
            autoUpdateObjects: true,
            antialias: true
        });

        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight);
        effect = new THREE.OculusRiftEffect( renderer );


        // container.onclick = function() {
        //     container.webkitRequestFullscreen();
        // }

        container.appendChild( renderer.domElement );

        // Attach necessary event listeners
        window.addEventListener( 'resize', onWindowResize, false );
        document.addEventListener( 'keydown', keyPressed, false );
    }

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
                    toggleControls();
                    vr.exitFullScreen();
                }
                event.preventDefault();
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

        if (controls && controls.isOnObject) {
            controls.isOnObject( false );

            ray.ray.origin.copy( controls.getObject().position );
            ray.ray.origin.y -= 10;

            var intersections = ray.intersectObjects( objects );
            if ( intersections.length > 0 ) {
                var distance = intersections[ 0 ].distance;
                if ( distance > 0 && distance < 10 ) {
                    controls.isOnObject( true );
                }
            }
        }

        for ( objID in movingObjects ) {
            var curObj = movingObjects[ objID ];
            scene.getObjectByName( objID ).rotation.x += toRad( curObj.spinsX || 0 );
            scene.getObjectByName( objID ).rotation.y += toRad( curObj.spinsY || 0 );
            scene.getObjectByName( objID ).rotation.z += toRad( curObj.spinsZ || 0 );
        }

        // Poll VR, if it's ready.
         var polled = vr.pollState(vrstate);
        // controls.update( Date.now() - time, polled ? vrstate : null );

        if ( controls )
            controls.update();
        //renderer.render( scene, camera );
        effect.render( scene, camera, polled ? vrstate : null );
    }

    // Helper functions
    function toRad( angle ) {
        return angle * (Math.PI / 180);
    }
    function lightSource( params ) {
        var light = new THREE.DirectionalLight( parseInt( "0x" + params.color ), params.intensity )
        light.position.set(
            params.position.x,
            params.position.y,
            params.position.z
        );
        return light;
    }
})();