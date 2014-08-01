(function() {

    // Vars
    var container, camera,
        scene, renderer,

        // Camera modifiers
        controls, effect, // rift effect

        movingObjects = {},
        ray;

    var editor = TextEditor;
    editor.setCallback( buildScene );

    // Div wrapping the renderer's canvas
    container = document.getElementById( 'container' );

    //***********************************************
    // Events and Event Functions
    //***********************************************
    // Initialize our scene
    window.onload = function( error ) {
        initObjects();
        animate();
    };

    document.addEventListener( 'webkitfullscreenchange', function( event ) {
        if ( $('#container').hasClass('controlled') &&
            !document.webkitFullscreenElement ) {
            toggleControls();
        }
    }, false);

    $(".fullscreen").on('click', function() {
        event.preventDefault();
        toggleControls();
    });



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
        }
    }


    function setControls() {

        container.webkitRequestFullscreen();
        // For mobile device orientation controls
        if ( window.orientation !== undefined ) {
            controls = new THREE.DeviceOrientationControls( camera );
            controls.connect();
        // For laptop browser controls:
        } else {
            // TODO: Fix pointer Lock, idk why it won't actually request it...
             var element = document.body;
             element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
             element.requestPointerLock();

            controls = new THREE.PointerLockControls( camera );
            controls.getObject().name = "PointerLockControls";
            controls.enabled = true;
            scene.add( controls.getObject() );
        }
    }

    function toggleControls() {

        if( $('#container').hasClass('controlled') ) {
            // Remove controls
            if ( window.orientation !== undefined ) {
                controls.disconnect();
                delete controls;
            } else {
                var controlObject = scene.getObjectByName("PointerLockControls");
                scene.remove( controlObject );
            }
            $('#container').removeClass('controlled');
        } else {
            setControls();
            $('#container').addClass('controlled');
        }
    }



    //******************************************
    // Building and Running Scene
    //******************************************

    function initObjects() {
        buildScene();

        // Render
        renderer = new THREE.WebGLRenderer({
            devicePixelRatio: 1,
            alpha: false,
            autoUpdateObjects: true,
            antialias: true
        });

        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setClearColor( 0xffffff, 1 );
        renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight);
        effect = new THREE.OculusRiftEffect( renderer );

        container.appendChild( renderer.domElement );

        // Attach necessary event listeners
        window.addEventListener( 'resize', onWindowResize, false );
        document.addEventListener( 'keydown', keyPressed, false );
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
        loader.parse(cssImportObject, function( e ) {
            scene = e.scene;
        }, '.');

        var cssEx = new CssExporter();
        cssEx.parse( scene );

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

    function animate() {
        window.requestAnimationFrame( animate );

        for ( objID in movingObjects ) {
            var curObj = movingObjects[ objID ];
            scene.getObjectByName( objID ).rotation.x += toRad( curObj.spinsX || 0 );
            scene.getObjectByName( objID ).rotation.y += toRad( curObj.spinsY || 0 );
            scene.getObjectByName( objID ).rotation.z += toRad( curObj.spinsZ || 0 );
        }

        if ( controls )
            controls.update();
        // TODO: Removed VR polling in favor of device orientation
        //       Fix a way to decide the third, false arguement here
        effect.render( scene, camera, false );
    }



    //***************************************
    // Helper functions
    //***************************************
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
