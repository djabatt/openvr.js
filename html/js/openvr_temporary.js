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
        ray,

        vrstate = new vr.State();

    // Initialize VR.js
    vr.load( function( error ) {
        if ( error ) {
            alert('Plugin load failed: ' + error.toString());
        }

        try {
            initObjects();
            animate();
        } catch ( e ) {
            console.log( e );
        }
    });

    function initObjects() {
        var light = new THREE.DirectionalLight( parseInt( "0x" + SCENE.scene.light.color ), SCENE.scene.light.intensity )

        // Init camera
        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );

        // Init scene
        scene = new THREE.Scene();

        // Add some sweet lighting effects to the scene
        light.position.set(
            SCENE.scene.light.position.x,
            SCENE.scene.light.position.y,
            SCENE.scene.light.position.z
        );

        // Fog (optional)
        if ( SCENE.scene.fog )
            scene.fog = new THREE.Fog( 0xffffff, 0, 750 );

        scene.add( light );

        // Init controls
        controls = new THREE.OculusRiftControls( camera );
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

            object.scale = object.scale ? parseInt(object.scale) : 20;
            console.log(object.scale);
            switch (object.type) {
                case "cube":
                    geometry = new THREE.CubeGeometry( object.scale, object.scale, object.scale );

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

            material.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

            objects.push( mesh );
        });


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

        ray.ray.origin.copy( controls.getObject().position );
        ray.ray.origin.y -= 10;

        var intersections = ray.intersectObjects( objects );
        if ( intersections.length > 0 ) {
            var distance = intersections[ 0 ].distance;
            if ( distance > 0 && distance < 10 ) {
                controls.isOnObject( true );
            }
        }

        // Poll VR, if it's ready.
        var polled = vr.pollState(vrstate);
        controls.update( Date.now() - time, polled ? vrstate : null );

        //renderer.render( scene, camera );
        effect.render( scene, camera, polled ? vrstate : null );

        time = Date.now();
    }

    vrObjFile = document.getElementById("vr-obj-file");
    vrObjFile.addEventListener('change', function(event) {
        var fr = new FileReader();
        fr.onload = function(theFile) {
            console.log(fr.result);
            SCENE = JSON.parse(fr.result);
            initObjects();
        }
        console.log(event.target.files);
        fr.readAsText(event.target.files[0]);
    }, false);

    function toRad( angle ) {
        return angle * (Math.PI / 180);
    }
})();