(function() {

    // Vars
    var container, camera,
        renderer,

        // Camera modifiers
        controls, effect, // rift effect

        movingObjects = {};

    var textEditor = TextEditor;
    textEditor.setCallback( buildScene );
    var sceneEditor = new SceneEditor();
    var scene = sceneEditor.scene;

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
            sceneEditor.scene.add( controls.getObject() );
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

        // CSS Parsing -> Importable JSON
        sceneEditor.setSceneFromCss();
        sceneEditor.initRotations();

        // Init camera
        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1100 );

        sceneEditor.scene.add(camera);

    }

    function animate() {
        window.requestAnimationFrame( animate );

        for ( objID in sceneEditor.movingObjects ) {
            var curObj = sceneEditor.movingObjects[ objID ];
            sceneEditor.scene.getObjectByName( objID ).rotation.x += toRad( curObj.spinsX || 0 );
            sceneEditor.scene.getObjectByName( objID ).rotation.y += toRad( curObj.spinsY || 0 );
            sceneEditor.scene.getObjectByName( objID ).rotation.z += toRad( curObj.spinsZ || 0 );
        }

        if ( controls )
            controls.update();
        // TODO: Removed VR polling in favor of device orientation
        //       Fix a way to decide the third, false arguement here
        effect.render( sceneEditor.scene, camera, false );
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
