(function() {

    // Vars
    var camera,
        scene,
        renderer,

        geometry,
        material,
        mesh,

        controls,
        time = Date.now(),

        effect, // rift effect
        objects = [],
        movingObjects = [],
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


    // CSS Parsing -> Importable JSON
    // Work in Progress, just toy code to get things going
    // TODO: refactor and move to its own file
    var cssImportObject = CssObjectLoader.loadCss();
    console.log(JSON.stringify(cssImportObject));

    // Helper function

    function toRad( angle ) {
        return angle * (Math.PI / 180);
    }

    // Initialize VR.js
    vr.load( function( error ) {
        if ( error ) {
            alert('Plugin load failed: ' + error.toString());
        }

        initObjects();
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

    function initObjects() {
        // Clear objects and moving objects list
        objects = [];
        // Init camera
        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

        // Init scene
        scene = new THREE.Scene();

        // Add some sweet lighting effects to the scene
        if ( SCENE.light && SCENE.light.length >= 1 ) {
            SCENE.light.forEach( function( lightParams ) {
                var light = lightSource( lightParams );
                scene.add( light );
            });
        }
        else {
            scene.add( lightSource( defaultLightParams ) );
        }

        // Fog (optional)
        if ( SCENE.scene.fog )
            scene.fog = new THREE.Fog( 0xffffff, 0, 750 );

        // Init controls
        // controls = new THREE.OculusRiftControls( camera );
        controls = new THREE.PointerLockControls( camera );
        scene.add( controls.getObject() );

        // Light ray caster
        ray = new THREE.Raycaster();
        ray.ray.direction.set( 0, -1, 0 );

        // Floor - aka the plane (width, height, widthSegments, heightSegments )
        geometry = new THREE.PlaneGeometry( SCENE.floor.width, SCENE.floor.height, 1, 1 );
        geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );

        for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {
            var face = geometry.faces[ i ];
            var hexcolor = parseInt( "0x" + SCENE.floor.color );
            face.vertexColors[ 0 ] = new THREE.Color().setHex( hexcolor );
            face.vertexColors[ 1 ] = new THREE.Color().setHex( hexcolor );
            face.vertexColors[ 2 ] = new THREE.Color().setHex( hexcolor );
            face.vertexColors[ 3 ] = new THREE.Color().setHex( hexcolor );
        }

        // Compile floor
        material = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );
        mesh = new THREE.Mesh( geometry, material );

        // Add floor to scene
        scene.add( mesh );

        // Objects
        SCENE.objects.forEach( function( object ) {
            // Default values
            object.scale = object.scale ? parseInt(object.scale) : 20;
            object.color = object.color || "ffffff"
            object.colors = object.colors || [];
            if (object.colors.length < 3) {
                for (var i = 0; i < 3; i ++) {
                    object.colors[ i ] = object.colors[ i ] || parseInt("ffffff");
                }
            }
            if (!object.position)
                object.position = {};
            object.position.x = object.position.x || 0;
            object.position.y = object.position.y || 0;
            object.position.z = object.position.z || 0;

            switch (object.type) {
                case "cube":
                    geometry = new THREE.BoxGeometry( object.scale, object.scale, object.scale );

                    for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {

                        var face = geometry.faces[ i ];
                        face.vertexColors[ 0 ] = new THREE.Color().setHex( parseInt( "0x" + object.colors[ 0 ] ) );
                        face.vertexColors[ 1 ] = new THREE.Color().setHex( parseInt( "0x" + object.colors[ 1 ] ) );
                        face.vertexColors[ 2 ] = new THREE.Color().setHex( parseInt( "0x" + object.colors[ 2 ] ) );
                        face.vertexColors[ 3 ] = new THREE.Color().setHex( parseInt( "0x" + object.colors[ 3 ] ) );

                        material = new THREE.MeshPhongMaterial( { specular: 0xffffff, shading: THREE.FlatShading,
                            vertexColors: THREE.VertexColors } );
                    }
                    break;
                case "sphere":
                    geometry = new THREE.SphereGeometry( object.scale, 32 );
                    material = new THREE.MeshLambertMaterial( { color: parseInt("0x" + object.color ) } );
                    break;
                case "cylinder":
                    geometry = new THREE.CylinderGeometry( object.topr, object.botr, object.height, 20, 32 );
                    material = new THREE.MeshLambertMaterial( { color: parseInt("0x" + object.color ) } );
                    break;
                case "plane":
                    geometry = new THREE.PlaneGeometry( object.width, object.height );
                    material = new THREE.MeshBasicMaterial( { color: parseInt("0x" + object.color ) } );
                    break;
                case "tetrahedron":
                    object.radius = parseInt(object.radius || 10);
                    object.detail = parseFloat(object.detail || 0);
                    geometry = new THREE.TetrahedronGeometry( object.radius, object.detail );
                    material = new THREE.MeshLambertMaterial( { color: parseInt("0x" + object.color ) } );
                    break;
                case "ring":
                    object.innerRadius = parseInt( object.innerRadius || 5 );
                    object.outerRadius = parseInt( object.outerRadius || 10 );
                    object.smoothness = parseInt( object.smoothness || 8 );
                    geometry = new THREE.RingGeometry( object.innerRadius, object.outerRadius, object.smoothness );
                    material = new THREE.MeshLambertMaterial( { color: parseInt( "0x" + object.color ) } );
                    break;
                case "torus":
                    object.radius = parseInt(object.radius || 10);
                    object.thickness = parseInt(object.thickness || 3);
                    object.circularSmooth = parseInt(object.circularSmooth || 10);
                    object.tubeSmooth = parseInt(object.tubeSmooth || 10);
                    geometry = new THREE.TorusGeometry( object.radius, object.thickness,
                        object.circularSmooth, object.tubeSmooth);
                    material = new THREE.MeshLambertMaterial( { color: parseInt( "0x" + object.color ) } );
                    break;
                case "torusknot":
                    object.radius = parseInt(object.radius || 10);
                    object.tube = parseInt(object.tube || 5);
                    object.circularSmooth = parseInt(object.circularSmooth || 10);
                    object.tubeSmooth = parseInt(object.tubeSmooth || 10);
                    object.p = parseInt(object.p || 2);
                    object.q = parseInt(object.q || 3);
                    geometry = new THREE.TorusKnotGeometry( object.radius, object.tube,
                            object.circularSmooth, object.tubeSmooth, object.p, object.q);
                    material = new THREE.MeshLambertMaterial( { color: parseInt( "0x" + object.color ) } );
                    break;
                case "text":
                    parameters = {};
                    object.text = object.text || "OpenVR!";
                    parameters.size = parseFloat(object.size || 20);
                    parameters.height = parseFloat(object.height || 50);
                    parameters.weight = object.weight || "normal";
                    geometry = new THREE.TextGeometry(object.text, parameters);
                    break;

            }

            if (object.rotx)
                geometry.applyMatrix( new THREE.Matrix4().makeRotationX( toRad( parseInt(object.rotx) ) ) );
            if (object.roty)
                geometry.applyMatrix( new THREE.Matrix4().makeRotationY( toRad( parseInt(object.roty) ) ) );
            if (object.rotz)
                geometry.applyMatrix( new THREE.Matrix4().makeRotationZ( toRad( parseInt(object.rotz) ) ) )

            var mesh = new THREE.Mesh( geometry, material );
            mesh.position.x = object.position.x;
            mesh.position.y = object.position.y;
            mesh.position.z = object.position.z;
            scene.add( mesh );

            // Check if animation commands exist
            if ( object.spins || object.orbits ) {
                if (object.spins)
                    mesh.spins = object.spins;
                if (object.orbits)
                    mesh.orbits = object.orbits;
                movingObjects.push(mesh);
            }

            material.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

            objects.push( mesh );
        });

        // var exporter = new THREE.SceneExporter();
        // var sceneJson = JSON.stringify(exporter.parse(scene));
        // localStorage.setItem('scene', sceneJson);

        var loader = new THREE.SceneLoader();
        // var jScene = JSON.parse(localStorage.getItem('scene'));
        loader.parse(cssImportObject, function( e ) {
            scene = e.scene;
        }, '.');

        // Render

        renderer = new THREE.WebGLRenderer({
            devicePixelRatio: 1,
            alpha: false,
            clearColor: 0xffffff,
            antialias: true
        });

        effect = new THREE.OculusRiftEffect( renderer );

        document.body.appendChild( renderer.domElement );

        //

        window.addEventListener( 'resize', onWindowResize, false );
        document.addEventListener( 'keydown', keyPressed, false );
    }

    function onWindowResize() {
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
        vr.requestAnimationFrame(animate);

        controls.isOnObject( false );
        controls.update();

        ray.ray.origin.copy( controls.getObject().position );
        ray.ray.origin.y -= 10;

        var intersections = ray.intersectObjects( objects );
        if ( intersections.length > 0 ) {
            var distance = intersections[ 0 ].distance;
            if ( distance > 0 && distance < 10 ) {
                controls.isOnObject( true );
            }
        }

        // Object motion will be included here
        for ( var i = 0; i < movingObjects.length; i ++) {
            movingObjects[i].rotation.x += toRad( movingObjects[i].spins.x || 0 );
            movingObjects[i].rotation.y += toRad( movingObjects[i].spins.y || 0 );
            movingObjects[i].rotation.z += toRad( movingObjects[i].spins.z || 0 );
        }
        // Poll VR, if it's ready.
         var polled = vr.pollState(vrstate);
        // controls.update( Date.now() - time, polled ? vrstate : null );

        controls.update();
        //renderer.render( scene, camera );
        effect.render( scene, camera, polled ? vrstate : null );

        time = Date.now();
    }

    vrObjFile = document.getElementById("vr-obj-file");
    vrObjFile.addEventListener('change', function(event) {
        var fr = new FileReader();
        fr.onload = function(theFile) {
            SCENE = JSON.parse(fr.result);
            initObjects();
        }
        fr.readAsText(event.target.files[0]);
    }, false);
})();