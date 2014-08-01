CssExporter = function() {};
CssExporter.prototype = {
	constructor: CssExporter,
	parse: function( scene ) {
		// TODO: recursively follow scene object
		// 			 output flattened data in css format
		var nObjects = 0, nGeometries = 0,
		nMaterials = 0, nTextures = 0;

		var objArray = [], geoArray = [], matArray = [],
		    textureArray = [], fogArray = [];

		var geoMap = {}, matMap = {}, textureMap = {};


		var checkTexture = function( map ) {
			if ( ! map ) return;
			if ( ! ( map.id in textureMap ) ) {
				texturesMap[ map.id ] = true;
				textureArray.push( /*TODO: TextureString*/ );
				nTextures += 1;
			}
		};

		function createRuleList( object ) {
			for ( var i = 0; i < object.children.length; i++ ) {
				var node = object.children[ i ];

				if ( node instanceof THREE.Mesh ) {
					var rulesArray = ObjectRules( node );
					rulesArray = rulesArray.concat( GeometryRules( node.geometry ) );
					rulesArray = rulesArray.concat( MaterialRules( node.material ) );

				} else if ( node instanceof THREE.Light ) {
					var rulesArray = LightRules( node );

				} else if ( node instanceof THREE.Camera ) {
					var rulesArray = CameraRules ( node );

				}
				var selector = node.name.replace("_", '#');
				console.log(RuleSetString( selector, rulesArray ));
			}

		}

		createRuleList( scene );

		// Object Rule Functions
		function LightRules( light ) {
			var output = [];
			if ( light instanceof THREE.AmbientLight ) {
				output = [
					"type: AmbientLight",
					ColorRule( light.color.getHex() )
				];

			} else if ( light instanceof THREE.DirectionalLight ) {
				output = [
				  "type: DirectionalLight",
					ColorRule( light.color.getHex() ),
					"intensity: " + light.intensity,
					"x: " + light.position.x,
					"y: " + light.position.y,
					"z: " + light.position.z
				];

			} else if ( light instanceof THREE.PointLight ) {
				output = [
					"type: PointLight",
					ColorRule( light.color.getHex() ),
					"intensity: " + light.intensity,
					"x: " + light.position.x,
					"y: " + light.position.y,
					"z: " + light.position.z,
					"distance: " + light.distance
				];

			} else if ( light instanceof THREE.SpotLight ) {
				output = [
					"type: SpotLight",
					ColorRule( light.color.getHex() ),
					"intensity: " + light.intensity,
					"x: " + light.position.x,
					"y: " + light.position.y,
					"z: " + light.position.z,
					"distance: " + light.distance,
					"angle: " + light.angle,
					"exponent: " + light.exponent
				];

			} else if ( light instanceof THREE.HemisphereLight ) {
				output = [
					"type: HemisphereLight",
					"skyColor: " + "#" + light.color.getHex(),
					"groundColor: " + "#" + light.groundColor.getHex(),
					"intensity: " + light.intensity,
					"x: " + light.position.x,
					"y: " + light.position.y,
					"z: " + light.position.z
				];

			} else {
			}

			return output;
		}

		function CameraRules( cam ) {
			var output = [];
			if ( cam instanceof THREE.PerspectiveCamera) {
				output = [
					"type: PerspectiveCamera",
					"fov: " + cam.fov,
					"aspect: " + cam.aspect,
					"near: " + cam.near,
					"far: " + cam.far,
					"x: " + cam.position.x,
					"y: " + cam.position.y,
					"z: " + cam.position.z
				];

			} else if ( cam instanceof THREE.OrthographicCamera ) {
				output = [
					"type: OrthographicCamera",
					"left: " + cam.left,
					"right: " + cam.right,
					"top: " + cam.top,
					"bottom: " + cam.bottom,
					"near: " + cam.near,
					"far: " + cam.far,
					"x: " + cam.position.x,
					"y: " + cam.position.y,
					"z: " + cam.position.z
				];

			} else {
			}
			return output;

		}

		function ObjectRules( object ) {
			var output = [
				"x: " + object.position.x,
				"y: " + object.position.y,
				"z: " + object.position.z,
				"rotateX: " + object.rotation.x,
				"rotateY: " + object.rotation.y,
				"rotateZ: " + object.rotation.z,
				"scaleX: " + object.scale.x,
				"scaleY: " + object.scale.y,
				"scaleZ: " + object.scale.z,
				"visible: " + object.visible
			];
			return output;
		}

		function MeshRules( mesh ) {
			var output = [
			"x: " + mesh.position.x,
			"y: " + mesh.position.y,
			"z: " + mesh.position.z
			]
			return output;

		}

		function GeometryRules( g ) {
			var output = [];
			if ( g instanceof THREE.SphereGeometry ) {
				output = [
					"radius: " + g.parameters.radius,
				  "widthSegments: " + g.parameters.widthSegments,
					"heightSegments: " + g.parameters.heightSegments
				];

			} else if ( g instanceof THREE.BoxGeometry ) {
				output = [
					"width: " + g.parameters.width,
					"height: " + g.parameters.height,
					"depth: " + g.parameters.depth,
					"widthSegments: " + g.parameters.widthSegments,
					"heightSegments: " + g.parameters.heightSegments,
					"depthSegments: " + g.parameters.depthSegments
				];

			} else if ( g instanceof THREE.PlaneGeometry ) {
				output = [
					"width: " + g.parameters.width,
					"height: " + g.parameters.height,
					"widthSegments: " + g.parameters.widthSegments,
					"heightSegments: " + g.parameters.heightSegments
				];

			} else if ( g instanceof THREE.CylinderGeometry ) {
				output = [
					"radiusTop: " + g.parameters.radiusTop,
					"radiusBottom: " + g.parameters.radiusBottom,
					"height: " + g.parameters.height,
					"radialSegments: " + g.parameters.radialSegments,
					"heightSegments: " + g.parameters.heightSegments,
					"openEnded: " + g.parameters.openEnded
				];

			} else if ( g instanceof THREE.TetrahedronGeometry ) {
				output = [
					"radius: " + g.parameters.radius,
					"detail: " + g.parameters.detail
				];

			} else if ( g instanceof THREE.RingGeometry ) {
				output = [
					"innerRadius: " + g.parameters.innerRadius,
					"outerRadius: " + g.parameters.outerRadius,
					"thetaSegments: " + g.parameters.thetaSegments,
					"phiSegments: " + g.parameters.phiSegments,
					"thetaStart: " + g.parameters.thetaStart,
					"thetaLength: " + g.parameters.thetaLength
				];

			} else if ( g instanceof THREE.TorusGeometry ) {
				output = [
					"radius: " + g.parameters.radius,
					"tube: " + g.parameters.tube,
					"radialSegments: " + g.parameters.radialSegments,
					"tubularSegments: " + g.parameters.tubularSegments,
					"arc: " + g.parameters.arc
				];

			} else if ( g instanceof THREE.TorusKnotGeometry ) {
				output = [
					"radius: " + g.parameters.radius,
					"tube: " + g.parameters.tube,
					"radialSegments: " + g.parameters.radialSegments,
					"tubularSegments: " + g.parameters.tubularSegments,
					"p: " + g.parameters.p,
					"q: " + g.parameters.q,
					"heightScale: " + g.parameters.heightScale
				];

			} else if ( g instanceof THREE.TextGeometry ) {

			} else if ( g instanceof THREE.Geometry ) {
				if ( g.sourceType === "ascii" || g.sourceType === "ctm" || g.sourceType === "stl" || g.sourceType === "vtk" ) {

				} else {

				}
			} else {
			}
			return output;
		}

		function MaterialRules( mat ) {
			var output = [];
			if ( mat instanceof THREE.MeshBasicMaterial ) {
				output = [
					ColorRule(mat.color.getHex()),
					"reflectivity: " + mat.reflectivity,
					"transparent: " + mat.transparent,
					"opactiy: " + mat.opactiy,
					"wireframe: " + mat.wireframe,
					"wireframeLinewidth: " + mat.wireframeLinewidth
				]
				if (mat.map)
					output.push("map: " + mat.map);
				if (mat.envMap)
					output.push("envMap: " + mat.envMap);
				if (mat.specularMap)
					output.push("specularMap: " + mat.specularMap);
				if (mat.lightMap)
					output.push("lightMap: " + mat.lightMap);

			} else if ( mat instanceof THREE.MeshLambertMaterial ) {
				output = [
					ColorRule(mat.color.getHex()),
					"ambient: " + ColorRule(mat.ambient.getHex()),
					"emissive: " + ColorRule(mat.emissive.getHex()),
					"reflectivity: " + mat.reflectivity,
					"transparent: " + mat.transparent,
					"opactiy: " + mat.opactiy,
					"wireframe: " + mat.wireframe,
					"wireframeLinewidth: " + mat.wireframeLinewidth
				];
				if (mat.map)
					output.push("map: " + mat.map);
				if (mat.envMap)
					output.push("envMap: " + mat.envMap);
				if (mat.specularMap)
					output.push("specularMap: " + mat.specularMap);
				if (mat.lightMap)
					output.push("lightMap: " + mat.lightMap);

			} else if ( mat instanceof THREE.MeshPhongMaterial ) {
				output = [
					ColorRule(mat.color.getHex()),
					"ambient: " + ColorRule(mat.ambient.getHex()),
					"emissive: " + ColorRule(mat.emissive.getHex()),
					"specular: " + ColorRule(mat.specular.getHex()),
					"shininess: " + mat.shininess,
					"bumpScale: " + mat.bumpScale,
					"reflectivity: " + mat.reflectivity,
					"transparent: " + mat.transparent,
					"opacity: " + mat.opacity,
					"wireframe: " + mat.wireframe,
					"wireframeLinewidth: " + mat.wireframeLinewidth
				];
				if (mat.map)
					output.push("map: " + mat.map);
				if (mat.envMap)
					output.push("envMap: " + mat.envMap);
				if (mat.specularMap)
					output.push("specularMap: " + mat.specularMap);
				if (mat.lightMap)
					output.push("lightMap: " + mat.lightMap);
				if (mat.normalMap)
					output.push("normalMap: " + mat.normalMap);
				if (mat.bumpMap)
					output.push("bumpMap: " + mat.bumpMap);

			} else if ( mat instanceof THREE.MeshDepthMaterial ) {
				output = [
					"transparent: " + mat.transparent,
					"opacity: " + mat.opacity,
					"wireframe: " + mat.wireframe,
					"wireframeLinewidth: " + mat.wireframeLinewidth
				];

			} else if ( mat instanceof THREE.MeshNormalMaterial ) {
				output = [
					"transparent: " + mat.transparent,
					"opacity: " + mat.opacity,
					"wireframe: " + mat.wireframe,
					"wireframeLinewidth: " + mat.wireframeLinewidth
				];

			} else if ( mat instanceof THREE.MeshFaceMaterial ) {

			} else {
			}

			return output;
		}

		function TextureRules( tex ) {
			var output = [
			// url
			// repeat
			// offset
			// magFilter
			// minFilter
			// anisotropy
			];
			return output;

		}

		function FogRules( fog ) {
			var output = [];
			if ( fog instanceof THREE.Fog ) {
				output = [
					ColorRule(fog.color),
					"near: " + fog.near,
					"far: " + fog.far
				];
			} else if ( fog instanceof THREE.FogExp2 ) {
				ColorRule(fog.color),
				"density: " + fog.density
			} else {
			}

			return output;
		}

		// Utility String Functions
		function ColorRule( color ) {
			return  "color: #" + color;
		}
		function RuleSetString ( selector, rulesArray ) {
			var output = selector + " {\n\n\t";
			for ( var i = 0; i < rulesArray.length; i++ ) {
				output += RuleString( rulesArray[i] );
			}
			output += "}\n\n";
			return output;
		}
		function RuleString( rule ) {
			return ( "  " + rule + ";\n\n\t" );
		}

	}
}