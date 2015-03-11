/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function Playmola(){
    var self = this;
    var renderer;
    var camera;
    var scene; 
    var foregroundScene; //For drawing objects on top of the main scene
    var cameraControls;
    var transformControls;
    var raycaster;
    
    var movingObjects = [];
    var connectionLines = []; //To be removed
    var joints = [];
    var objectCollection = []; //Collection of all active objects in scene
    var dymolaComponentStorage = [];
    var selectedObject = null;
    var closestObject; // Target object of currently selected object
    var connectionPoint1; //Connection point of selected object
    var connectionPoint2; //Connection point of targeted object
    var connectionMarker; //Sphere for visualising connection on target object
    
    var mousePos;
    var disableControls = false;
    var schematicMode = false;
    
    var palette; //palette of 3D models to add to the scene
    var dymolaInterface;
    
    var loader = new THREE.VRMLLoader();
    
    var song = document.getElementById("havanaAffair");
    song.src = "Audio/07 Havana Affair.mp3";
    song.play();
    song.oncanplay = function(){
        alert("hejhej");
    };
    song.oncanplaythrough = function(){
        song.play();
        alert("HEJ");
    };
    
    function Palette(domElement){
        //THREE.Object3D.call(this);
        var scope = this;
        var selectedCategory = "";
        var categories = [];
        var backplanes = [];
        var dragging = null;
        var mouseover = false;
        var hoverTileX = -1;
        var hoverTileY = -1;
        
        //Sizing
        var tileWidth = 80;
        var tileHeight = 80;
        var tilesX = 3;
        var tilesY = 5;
        var tileSpacing = 10;
        var tileInnerSize = 60;
        var bounds = new THREE.Box2(new THREE.Vector2(10,110), new THREE.Vector2(10,110));

        this.palettescene = new THREE.Scene();
        
        $(domElement).on('mousedown',function(event){
            var pointer = new THREE.Vector2(event.offsetX, event.offsetY);
            if(bounds.containsPoint(pointer)){
                event.stopImmediatePropagation();
                if(hoverTileX != -1){
                    dragging = categories[selectedCategory][hoverTileX + hoverTileY * tilesX].clone();
                    
                    //clone doesn't copy connection points, so do that manually here (FIX THIS LATER!!!!!)    
                    dragging.connectionPoints = [];
    
                    if(categories[selectedCategory][hoverTileX + hoverTileY * tilesX].connectionPoints !== undefined){
                        for(var i = 0; i < categories[selectedCategory][hoverTileX + hoverTileY * tilesX].connectionPoints.length; i++){
                            var cp = new ConnectionPoint(categories[selectedCategory][hoverTileX + hoverTileY * tilesX].connectionPoints[i].position);
                            cp.coordinateSystem = categories[selectedCategory][hoverTileX + hoverTileY * tilesX].connectionPoints[i].coordinateSystem.clone();
                            cp.parentObject = dragging;
                            dragging.connectionPoints.push(cp);
                        }
                    }
                    
                    
                    dragging.rotation.set(0,0,0);
                    scope.palettescene.add(dragging);
                }
            }
        });
        
        $(domElement).on('mouseup',function(event){
            if(dragging !== null){
                //Spawn object here
                scope.palettescene.remove(dragging);
                
                objectCollection.push(dragging);
                scene.add(dragging);
                dragging.position.set(0,0,0);
                dragging.scale.set(1,1,1);
                dragging.children[0].position.add(dragging.userData.centerOffset);
                dragging.updateMatrix();
                dragging.updateMatrixWorld(true);
                dragging.castShadow = true;
                dragging.receiveShadow = true;
                
                
                dragging = null;
            }
        });
        
        $(domElement).on('mousemove',function(event){
            
            
            var pointer = new THREE.Vector2(event.offsetX, event.offsetY);
            if(dragging !== null){
                dragging.position.set(-width/2 + pointer.x, height/2 - pointer.y, -50);
            }
            
            if(bounds.containsPoint(pointer)){
                mouseover = true;
                
                var hoverTileX_ = Math.floor((pointer.x - bounds.min.x) / (tileSpacing + tileWidth));
                var hoverTileY_ = Math.floor((pointer.y - bounds.min.y) / (tileSpacing + tileHeight));
                if(hoverTileX == hoverTileX_ && hoverTileY == hoverTileY_){
                    
                } else {
                    if(hoverTileX != -1){
                        categories[selectedCategory][hoverTileX + hoverTileY * tilesX].scale.multiplyScalar(1/1.6);
                    }
                    hoverTileX = hoverTileX_;
                    hoverTileY = hoverTileY_;
                    if(hoverTileX + hoverTileY * tilesX < categories[selectedCategory].length){
                         categories[selectedCategory][hoverTileX + hoverTileY * tilesX].scale.multiplyScalar(1.6);
                    } else {
                        hoverTileX = -1;
                        hoverTileY = -1;
                    }
                }
                
            } else {
                mouseover = false;
                if(hoverTileX != -1){
                    categories[selectedCategory][hoverTileX + hoverTileY * tilesX].scale.multiplyScalar(1/1.6);
                    hoverTileX = -1;
                    hoverTileY = -1;
                }
            }
        });
       
        var directionalLight = new THREE.DirectionalLight();
        directionalLight.position.set(0,0,-1);
        directionalLight.intensity = 0.75;
        this.palettescene.add(directionalLight);

        directionalLight = directionalLight.clone();
        directionalLight.position.set(1,-1,1);
        this.palettescene.add(directionalLight);

        directionalLight = directionalLight.clone();
        directionalLight.position.set(-1,1,1);
        this.palettescene.add(directionalLight);
        
        this.palettescene.add(new THREE.AmbientLight(new THREE.Color(0.1,0.1,0.1)));

        var width = domElement.getBoundingClientRect().width;
        var height = domElement.getBoundingClientRect().height;
        this.camera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 1, 1000);


        
        

        this.update = function(){
            if(mouseover){
                //Rotate models
                for(var i = 0; i < categories[selectedCategory].length; i++){
                    switch(categories[selectedCategory][i].userData.rotationMode){
                        case 0:
                            categories[selectedCategory][i].rotateOnAxis(new THREE.Vector3(0,-1,0), 0.02);
                            break;
                        case 1:
                            if(categories[selectedCategory][i].userData.rotateDirection === 1){
                                categories[selectedCategory][i].rotateOnAxis(new THREE.Vector3(0,-1,0), 0.01);
                                categories[selectedCategory][i].userData.rotateAmount += 0.01;
                                if(categories[selectedCategory][i].userData.rotateAmount > 0.3){
                                    categories[selectedCategory][i].userData.rotateDirection = -1;
                                }
                            } else {
                                categories[selectedCategory][i].rotateOnAxis(new THREE.Vector3(0,-1,0), -0.01);
                                categories[selectedCategory][i].userData.rotateAmount -= 0.01;
                                if(categories[selectedCategory][i].userData.rotateAmount < -0.3){
                                    categories[selectedCategory][i].userData.rotateDirection = 1;
                                }
                            }
                            
                            break;
                    }  
                }
            }
        };

        this.render = function(renderer){
            renderer.render(scope.palettescene,scope.camera);
        };
        
        this.resize = function(){
            var width = domElement.getBoundingClientRect().width;
            var height = domElement.getBoundingClientRect().height;
            scope.camera.left = width / -2;
            scope.camera.right = width / 2;
            scope.camera.top = height / 2;
            scope.camera.bottom = height / -2;
            scope.camera.updateProjectionMatrix();
        };
        
        this.add = function(obj, category, tilt, rotationMode){
            if(tilt === undefined) tilt = true;
            if(rotationMode === undefined) rotationMode = 0;
            if(tilt)
                obj.rotation.set(0.1,0,-0.1);
            obj.updateMatrix();
            obj.updateMatrixWorld(true);
            var bbh = new THREE.BoundingBoxHelper(obj, 0xffffff);
            bbh.update();
            var size = bbh.box.size();
            var scaleFactor = tileInnerSize / Math.max(size.x, size.y, size.z);
            var center = bbh.box.center();
            categories[category].push(obj);
            
   
            
            //Don't forgot to move back again before "spawning"!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            obj.userData.centerOffset = center.clone();
            obj.children[0].position.sub(center);
            obj.userData.rotationMode = rotationMode;
            obj.userData.rotateAmount = 0;
            obj.userData.rotateDirection = 1;
            
            var len = categories[category].length;
            
            if(selectedCategory === category) scope.palettescene.add(obj);
           
            //obj.add(bbh);
            obj.scale.set(scaleFactor,scaleFactor,scaleFactor);
            //obj.position.set(((models.length-1)%tilesX) * (tileSpacing + tileWidth) - width/2 + tileWidth/2 + tileSpacing + center.x * scaleFactor, -Math.floor((models.length-1)/tilesX) * (tileSpacing + tileHeight) + height/2 - tileHeight/2 - tileSpacing - center.y*scaleFactor,-100);
            obj.position.set(((len-1)%tilesX) * (tileSpacing + tileWidth) - width/2 + tileWidth/2 + bounds.min.x, -Math.floor((len-1)/tilesX) * (tileSpacing + tileHeight) + height/2 - tileHeight/2 - bounds.min.y,-100);
            
           
            //bounds.min.set(tileSpacing,tileSpacing);
            if(category === selectedCategory) bounds.max.set((len < 3 ? len :tilesX)*(tileSpacing + tileWidth) + bounds.min.x, Math.ceil((len)/tilesX) * (tileSpacing + tileHeight) + bounds.min.y);
        };
        
        this.selectCategory = function(category){
            if(hoverTileX !== -1){
                categories[selectedCategory][hoverTileX + hoverTileY * tilesX].scale.multiplyScalar(1/1.6);
                hoverTileX = -1;
                hoverTileY = -1;
            }
            
            if(selectedCategory !== ""){
                for(var i = 0; i < categories[selectedCategory].length; i++){
                    scope.palettescene.remove(categories[selectedCategory][i]);
                }
            }
            
            selectedCategory = category;
            
            for(var i = 0; i < categories[selectedCategory].length; i++){
                scope.palettescene.add(categories[selectedCategory][i]);
            }     
            
            var len = categories[category].length;
            bounds.max.set((len < 3 ? len :tilesX)*(tileSpacing + tileWidth) + bounds.min.x, Math.ceil((len)/tilesX) * (tileSpacing + tileHeight) + bounds.min.y);
            
            //Show the required number of background planes
            for(var i = 0; i < backplanes.length; i++){
                if(i < len)
                    backplanes[i].visible = true;
                else
                    backplanes[i].visible = false;
            }
        };
        
        this.addCategory = function(name){
            categories[name] = [];
            $("#select-custom-1").append("<option value='" + name + "'>" + name + "</option>");
        }
        
        //generate backing planes...
        for(var i = 0; i < 25; i++){
            var backplane = new THREE.Mesh(new THREE.PlaneBufferGeometry(tileWidth, tileHeight), new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide , opacity: 0.3, transparent: true} ));        
            scope.palettescene.add(backplane);
            backplane.position.set(((i)%tilesX) * (tileSpacing + tileWidth) - width/2 + tileWidth/2 + bounds.min.x, -Math.floor((i)/tilesX) * (tileSpacing + tileHeight) + height/2 - tileHeight/2 - bounds.min.y,-500);
            backplane.visible = false;
            backplanes.push(backplane);
        }
        
        //Make a bunch of categories
        this.addCategory("Parts");
        
        $("#select-custom-1").on('change', function(event){
            scope.selectCategory(event.target.value);
        });
        categories["misc"] = [];
        
        //this.selectCategory("joints");
        this.loadParts = function(){
            
            loader.load("Piston_Study.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(0.,-0.15149054405043,0.), new Array(new ConnectionPoint(new THREE.Vector3(0.,-0.14420647088485,0.))));
                scope.add(obj, "Parts");
            });
            loader.load("Master_One_Cylinder.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(-4.5e-2,0.,0.), new Array(new ConnectionPoint(new THREE.Vector3(-4.5e-2,0.,0.))));
                scope.add(obj, "Parts");
            });
            loader.load("Rod_Study.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(0.,-8.9431700693962e-2,2.4489282256523e-2), new Array(new ConnectionPoint(new THREE.Vector3(0.,-3.465692988818e-2,4.8978561933508e-2)), new ConnectionPoint(new THREE.Vector3(0.,-0.14420647088485,0.))));
                scope.add(obj, "Parts");
            });
            loader.load("Cranck_Study.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(-2.7054598934035e-2,-9.0702960410631e-3,1.2818607418443e-2), new Array(new ConnectionPoint(new THREE.Vector3(0.,-3.465692988818e-2,4.8978561933508e-2)), new ConnectionPoint(new THREE.Vector3(-4.5e-2,0.,0.))));
                scope.add(obj, "Parts");
            });

            loader.load("models/robot/b0.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(0,0,0), new Array(new ConnectionPoint(new THREE.Vector3(0,0.351,0)),new ConnectionPoint(new THREE.Vector3(0,0,0))));
                scope.add(obj, "Parts");
            });
            loader.load("models/robot/b1.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(0,0,0), new Array(new ConnectionPoint(new THREE.Vector3(0,0.324,0.3)),new ConnectionPoint(new THREE.Vector3(0,0,0))));
                scope.add(obj, "Parts");
            });
            loader.load("models/robot/b2.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(0.172,0.205,0), new Array(new ConnectionPoint(new THREE.Vector3(0,0.65,0)),new ConnectionPoint(new THREE.Vector3(0,0,0))));
                scope.add(obj, "Parts");
            });
            loader.load("models/robot/b3.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(0.064,-0.034,0), new Array(new ConnectionPoint(new THREE.Vector3(0,0.414,-0.155)),new ConnectionPoint(new THREE.Vector3(0,0,0))));
                scope.add(obj, "Parts");
            });

            loader.load("models/robot/b4.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(0,0,0), new Array(new ConnectionPoint(new THREE.Vector3(0,0.186,0)),new ConnectionPoint(new THREE.Vector3(0,0,0))));
                scope.add(obj, "Parts");
            });
            loader.load("models/robot/b5.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(0,0,0), new Array(new ConnectionPoint(new THREE.Vector3(0,0.125,0)),new ConnectionPoint(new THREE.Vector3(0,0,0))));
                scope.add(obj, "Parts");
            });
            loader.load("models/robot/b6.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(0.05,0.05,0.05), new Array(new ConnectionPoint(new THREE.Vector3(0,0,0))));
                scope.add(obj, "Parts");

            });
        }
        
        this.addPackage = function(package, category){
            if(categories[category] === undefined){
                scope.addCategory(category);
            }
            
            var classes = dymolaInterface.ModelManagement_Structure_AST_ClassesInPackageAttributes(package);
            for(var i = 0; i < classes.length; i++){
                if(classes[i].restricted != "package"){
                    //This isn't a package, so load and add to the palette
                    var exportModelSource = dymolaInterface.exportWebGL(classes[i].fullName);
                    exportModelSource = exportModelSource.replace(/mesh.userData.parent = meshGroup;/g, '');
                    exportModelSource = exportModelSource.replace(/mesh.userData.parent = group;/g, '');
                    var obj = new Function(exportModelSource)();

                    //Remove TextGeometry
                    for(var j = 0; j < obj.children.length; j++){
                        if(obj.children[j].type == 'Mesh' && obj.children[j].geometry.type == 'TextGeometry'){
                            obj.remove(obj.children[j]);
                            j--;
                        }
                    }

                    var obj2 = new THREE.Object3D();
                    obj2.add(obj);

                    scope.add(obj2, category, false, 1);

                }   
            }
        }
        
        //Add some joints:
        //Find all the classes in Modelica.Mechanics.MultiBody.Joints, ignoring sub-packages
        
        
        
        $(document).ready(function(){
            scope.loadParts();
            scope.addPackage("Modelica.Mechanics.MultiBody.Joints", "Joints");
            scope.addPackage("Modelica.Mechanics.MultiBody.Sensors", "Sensors");
            scope.addPackage("Modelica.Mechanics.MultiBody.Interfaces", "Interfaces");
        });

        
//        component.add(temp);
//        component.scale.set(0.005,0.005,0.005);
//        dymolaComponentStorage[componentString] = component;


    };
    Palette.prototype.constructor = THREE.Palette;

    
    function ConnectionPoint(position){
        this.position = new THREE.Vector3();
        this.position.copy(position);
        this.connectable = true;
        this.connectedTo = null; //The ConnectionPoint this is connected to
        this.parentObject = null; //The Object3D this is attached to
        this.coordinateSystem = new THREE.Matrix4();
        this.coordinateSystem.makeBasis(new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1)); //Default coordinate system
    }
    
    function DymolaComponent(){
        THREE.Object3D.call(this);
        this.typeName = null;
        this.connectors = [];
        var selfie = this;
        
        this.clone = function(){
            var newDymComp = new DymolaComponent();
            DymolaComponent.prototype.clone.call(selfie, newDymComp);
            newDymComp.typeName = this.typeName;
            newDymComp.connectors = this.connectors.slice(0);
            return newDymComp;
        };
    };
    
    DymolaComponent.prototype = Object.create(THREE.Object3D.prototype);
    
    function loadDymolaComponent(componentString){
        var component = new DymolaComponent();
        var exportModelSource = dymolaInterface.exportWebGL(componentString);
        //exportModelSource = exportModelSource.replace(/mesh.userData.parent = meshGroup;/g, '');
        //exportModelSource = exportModelSource.replace(/mesh.userData.parent = group;/g, '');
        //console.log(exportModelSource); 
        var temp = new Function(exportModelSource)();
        component.add(temp);
        component.scale.set(0.005,0.005,0.005);
        var subcomponents = dymolaInterface.Dymola_AST_ComponentsInClass(componentString);
//        for(var i = 0; i < subcomponents.length; i++){
//            var subcomponentAttribute = dymolaInterface.ModelManagement_Structure_AST_GetComponentAttributes(componentString, subcomponents[i]);
//            if(subcomponentAttribute.fullTypeName.indexOf("Interfaces") != -1){
//                component.connectors.push(subcomponentAttribute.fullTypeName);
//            }
//        }
        dymolaComponentStorage[componentString] = component;
    }
    
    function Joint(type){
        THREE.Object3D.call( this );
        this.dymolaType = type;
        this.connectionA = null;
        this.connectionB = null;
        var self = this;
        var lineA = null;
        var lineB = null;
        
        function init(){
            self.visible = false;
            self.add(dymolaComponentStorage[type].clone());
        }
        
        //Return the ConnectionPoint on the "other" side of the joint
        this.getConnection = function(connectionPoint){
            if(connectionPoint === self.connectionA)
                return self.connectionB;
            if(connectionPoint === self.connectionB)
                return self.connectionA;
            return null;
        };
        
        this.makeLines = function(){
            self.lineA = new ConnectionLine(self.connectionA,self);
            self.lineB = new ConnectionLine(self.connectionB,self);
        };
        
        this.update = function(){
            if(self.lineA !== null){
                self.lineA.update();
            }
            if(self.lineB !== null){
                self.lineB.update();
            }
        };
        
        init();
    }
    
    Joint.prototype = Object.create( THREE.Object3D.prototype );
    
    function ConnectionLine(connectionPoint, joint){
        var startPos = new THREE.Vector3();
        var endPos = new THREE.Vector3();
        
        startPos = connectionPoint.position.clone();
        
        connectionPoint.parentObject.localToWorld(startPos);
        joint.worldToLocal(startPos);
        endPos = joint.position.clone();
        //joint.localToWorld(endPos);
        
        
        var material = new THREE.LineBasicMaterial({
                color: 0xffffff
        });

        var geometry = new THREE.Geometry();
       
        
        geometry.vertices.push(
                startPos,
                endPos
        );

        var line = new THREE.Line( geometry, material);
        line.position.sub(joint.position);
        joint.add( line );
        
        this.update = function(){

            startPos = connectionPoint.position.clone();
            connectionPoint.parentObject.localToWorld(startPos);
            endPos = joint.position.clone();
            //joint.localToWorld(endPos);
            
            var geometry = new THREE.Geometry();


            geometry.vertices.push(
                    startPos,
                    endPos
            );
            joint.remove(line);
            line = new THREE.Line(geometry, material );
            line.position.sub(joint.position);
            joint.add(line);

        };
        
    }
    
    function init(){
        
        try{
            dymolaInterface = new DymolaInterface();
        }
        catch(err){
            alert("Dymola interface initialization failed");
        }
        
        renderer = new THREE.WebGLRenderer({antialias:true});
        renderer.setClearColor( 0x7EC0EE, 1 );
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.autoClear = false;
        document.querySelector("#container").appendChild(renderer.domElement);

        camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,1000);
        camera.position.set(50,0,0);
        
        palette = new Palette(renderer.domElement);       

        transformControls = new THREE.TransformControls( camera, renderer.domElement );
        transformControls.addEventListener( 'objectChange', checkForConnections );
        transformControls.addEventListener('mouseUp', onMouseUp );
        
        
       
        
        scene = new THREE.Scene();
        //scene.add(camera);
        scene.add(transformControls);
        foregroundScene = new THREE.Scene();

        var directionalLight = new THREE.DirectionalLight();
        directionalLight.position.set(0,0,-1);
        directionalLight.intensity = 0.75;
        directionalLight.castShadow = true;
        renderer.shadowMapEnabled = true;
        scene.add(directionalLight);

        directionalLight = directionalLight.clone();
        directionalLight.position.set(1,-1,1);
        scene.add(directionalLight);

        directionalLight = directionalLight.clone();
        directionalLight.position.set(-1,1,1);
        scene.add(directionalLight);
        
        scene.add(new THREE.AmbientLight(new THREE.Color(0.1,0.1,0.1)));
        
        raycaster = new THREE.Raycaster();
        mousePos = new THREE.Vector2(-1,-1);
        
        window.addEventListener('mousemove', onMouseMove, false);
        $(document).on('mousedown', function(event){
            if(intersectionTest() === true){
                event.preventDefault();
                event.stopImmediatePropagation();
                event.stopPropagation();
                return false;
            }
        });
        //$(transformControls).on('mouseDown', intersectionTest);
//        $(cameraControls).on('start', function(){
//            var blah = true;
//        });
        window.addEventListener('resize', onWindowResize, false);
        

        createCameraControls();
        loadDymolaComponent(revoluteJoint);
        loadDymolaComponent(prismaticJoint);
        loadDymolaComponent(cylindricalJoint);
        //scene.add(dymolaComponentStorage["Modelica.Mechanics.MultiBody.Joints.Revolute"]);	
    }
    
    
    function loadModel(object, centerOfMass, connectionPoints){
        //Extract the part of the Object3D containing the meshes and puts it in a 
        //new object positioned at the center of mass
        var obj = new THREE.Object3D();
        obj.add(object.children[1]);
        obj.children[0].position.sub(centerOfMass);
        obj.children.forEach(function(child) {
            saveColor(child);
        });
        obj.centerOfMass = centerOfMass;
        obj.connectionPoints = connectionPoints;
        
        obj.updateMatrixWorld(true);
        obj.updateMatrix();

        //Corrects the position of the connection points and initializes them
        for(var i = 0; i < connectionPoints.length; i++){
            var v = connectionPoints[i].position;
            v.sub(centerOfMass);
            connectionPoints[i].position = v;
            connectionPoints[i].parentObject = obj; //Record the Object3D this ConnectionPoint is attached to for future reference!
        }

        return obj;
    }
    
    function createCameraControls(){
        cameraControls = new THREE.TrackballControls( camera );
        cameraControls.rotateSpeed = 5.0;
        cameraControls.zoomSpeed = 1.2;
        cameraControls.panSpeed = 0.8;
        cameraControls.noZoom = false;
        cameraControls.noPan = false;
        cameraControls.staticMoving = true;
        cameraControls.dynamicDampingFactor = 0.3;
        cameraControls.keys = [ 65, 83, 68 ];
    }
    //Resets the camera and renderer when the window is resized
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
        createCameraControls();
        palette.resize();
    }
    
    function saveColor(object){
        if(object.hasOwnProperty('material'))
            object.userData.initColor = object.material.color;
        object.children.forEach(function(child){
            saveColor(child);
        });
    }
    
    function loadModels(){

        loader.load("Piston_Study.wrl", function(object){
            var obj = loadModel(object, new THREE.Vector3(0.,-0.15149054405043,0.), new Array(new ConnectionPoint(new THREE.Vector3(0.,-0.14420647088485,0.))));
            objectCollection.push(obj);
            scene.add(obj);
        });
        loader.load("Master_One_Cylinder.wrl", function(object){
            var obj = loadModel(object, new THREE.Vector3(-4.5e-2,0.,0.), new Array(new ConnectionPoint(new THREE.Vector3(-4.5e-2,0.,0.))));
            objectCollection.push(obj);
            scene.add(obj);
        });
        loader.load("Rod_Study.wrl", function(object){
            var obj = loadModel(object, new THREE.Vector3(0.,-8.9431700693962e-2,2.4489282256523e-2), new Array(new ConnectionPoint(new THREE.Vector3(0.,-3.465692988818e-2,4.8978561933508e-2)), new ConnectionPoint(new THREE.Vector3(0.,-0.14420647088485,0.))));
            objectCollection.push(obj);
            scene.add(obj);
        });
        loader.load("Cranck_Study.wrl", function(object){
            var obj = loadModel(object, new THREE.Vector3(-2.7054598934035e-2,-9.0702960410631e-3,1.2818607418443e-2), new Array(new ConnectionPoint(new THREE.Vector3(0.,-3.465692988818e-2,4.8978561933508e-2)), new ConnectionPoint(new THREE.Vector3(-4.5e-2,0.,0.))));
            objectCollection.push(obj);
            scene.add(obj);
        });
        
        loader.load("models/robot/b0.wrl", function(object){
            var obj = loadModel(object, new THREE.Vector3(0,0,0), new Array(new ConnectionPoint(new THREE.Vector3(0,0.351,0)),new ConnectionPoint(new THREE.Vector3(0,0,0))));
            objectCollection.push(obj);
            scene.add(obj);
        });
        loader.load("models/robot/b1.wrl", function(object){
            var obj = loadModel(object, new THREE.Vector3(0,0,0), new Array(new ConnectionPoint(new THREE.Vector3(0,0.324,0.3)),new ConnectionPoint(new THREE.Vector3(0,0,0))));
            objectCollection.push(obj);
            scene.add(obj);
        });
        loader.load("models/robot/b2.wrl", function(object){
            var obj = loadModel(object, new THREE.Vector3(0.172,0.205,0), new Array(new ConnectionPoint(new THREE.Vector3(0,0.65,0)),new ConnectionPoint(new THREE.Vector3(0,0,0))));
            objectCollection.push(obj);
            scene.add(obj);
        });
        loader.load("models/robot/b3.wrl", function(object){
            var obj = loadModel(object, new THREE.Vector3(0.064,-0.034,0), new Array(new ConnectionPoint(new THREE.Vector3(0,0.414,-0.155)),new ConnectionPoint(new THREE.Vector3(0,0,0))));
            objectCollection.push(obj);
            scene.add(obj);
        });
        
        loader.load("models/robot/b4.wrl", function(object){
            var obj = loadModel(object, new THREE.Vector3(0,0,0), new Array(new ConnectionPoint(new THREE.Vector3(0,0.186,0)),new ConnectionPoint(new THREE.Vector3(0,0,0))));
            objectCollection.push(obj);
            scene.add(obj);
        });
        loader.load("models/robot/b5.wrl", function(object){
            var obj = loadModel(object, new THREE.Vector3(0,0,0), new Array(new ConnectionPoint(new THREE.Vector3(0,0.125,0)),new ConnectionPoint(new THREE.Vector3(0,0,0))));
            objectCollection.push(obj);
            scene.add(obj);
        });
        loader.load("models/robot/b6.wrl", function(object){
            var obj = loadModel(object, new THREE.Vector3(0.05,0.05,0.05), new Array(new ConnectionPoint(new THREE.Vector3(0,0,0))));
            objectCollection.push(obj);
            scene.add(obj);
        });
    }
    
    function onMouseMove(event) {
	mousePos.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mousePos.y = - ( event.clientY / window.innerHeight ) * 2 + 1;	
    }
    function generateSphere(x,y,z, valid){
        var geometry = new THREE.SphereGeometry(0.1, 10,10);
        var material = valid ? new THREE.MeshBasicMaterial( {color: 0xffffff} ) : new THREE.MeshBasicMaterial( {color: 0x000000} );
        var sphere = new THREE.Mesh( geometry, material );
        sphere.position.set(x,y,z);
        return sphere;
    }
    //Returns true if an intersection was found, false otherwise
    function intersectionTest(){
        //Only allow selection and deselection if the controls are enabled
        if(!disableControls){
            raycaster.setFromCamera(mousePos, camera);
            var intersectionFound = null;
            var distance = 1000000;
            for(var i = 0; i < objectCollection.length; i++){
                var intersect = raycaster.intersectObject(objectCollection[i],true);
                if(intersect.length > 0){
                    if(intersect[0].distance < distance){
                        distance = intersect[0].distance;
                        intersectionFound = objectCollection[i];
                    }
                }
            }
            //Don't reselect the currently selected object
            if(intersectionFound === selectedObject && selectedObject !== null){
                transformControls.forceDrag();
                return true;
            }
            //Deselect the selected object if there is one
            if(selectedObject !== null) 
                deselectObject();
            //Select the new object
            if(intersectionFound !== null){
                selectObject(intersectionFound);
                transformControls.forceDrag();
                return true;
            }
            return false;
        }
    }
    function selectObject(object){
        selectedObject = object;
        transformControls.attach(selectedObject);
        transformControls.setMode("translate");
        transformControls.setSpace("world");
        
        
        selectedObject.traverse(function(child){
            if(child instanceof THREE.Mesh){
                if(child.userData.initColor === undefined)
                    child.userData.initColor = child.material.color;
                child.material.color = new THREE.Color(0xB0E2FF);
             }
        });
    }
    //Generates a new Object3D based on the two parameters, removes the parameters from the objectCollection
    //and adds the newly generated object instead
    function generateNewObject(obj1, obj2){
        if(obj1.group === undefined && obj2.group === undefined){
            var newGroup = new THREE.Object3D();
            newGroup.group = true;
            var vec1 = obj1.position.clone();
            var vec2 = obj2.position.clone();
            newGroup.add(obj1);
            newGroup.add(obj2);
            vec2.add(vec1);
            vec2.multiplyScalar(0.5);
            newGroup.position.copy(vec2);
            obj1.position.sub(newGroup.position);
            obj2.position.sub(newGroup.position);
            newGroup.updateMatrix();
            newGroup.updateMatrixWorld(true);
            var newConnectionPoints = [];
            for(var i = 0; i < obj1.connectionPoints.length; i++){
                var newPosition = newGroup.worldToLocal(obj1.localToWorld(obj1.connectionPoints[i].position.clone()));
                //newPosition.sub(newObj.position);
                var newConnectionPoint = new ConnectionPoint(newPosition);
                newConnectionPoint.connectable = obj1.connectionPoints[i].connectable;
                newConnectionPoint.coordinateSystem.multiply(obj1.matrixWorld);
                newConnectionPoint.coordinateSystem.multiply(newGroup.matrix);
                newConnectionPoint.parent = obj1.connectionPoints[i];
                newConnectionPoints.push(newConnectionPoint);
            }

            for(var i = 0; i < obj2.connectionPoints.length; i++){
                var newPosition = newGroup.worldToLocal(obj2.localToWorld(obj2.connectionPoints[i].position.clone()));
                //newPosition.sub(newObj.position);
                var newConnectionPoint = new ConnectionPoint(newPosition);
                newConnectionPoint.connectable = obj2.connectionPoints[i].connectable;
                newConnectionPoint.coordinateSystem.multiply(obj2.matrixWorld);
                newConnectionPoint.coordinateSystem.multiply(newGroup.matrix);
                newConnectionPoint.parent = obj2.connectionPoints[i];
                newConnectionPoints.push(newConnectionPoint);
            }

            //newConnectionPoints = newConnectionPoints.concat(obj1.connectionPoints, obj2.connectionPoints);
            newGroup.connectionPoints = newConnectionPoints;
            selectObject(newGroup);
            var index = objectCollection.indexOf(obj1);
            objectCollection.splice(index,1);
            index = objectCollection.indexOf(obj2);
            objectCollection.splice(index,1);
            objectCollection.push(newGroup);
            scene.add(newGroup);
        }
        else if (obj2.group === true && obj1.group === true){
            var newGroup = new THREE.Object3D();
            newGroup.group = true;
            var cMass = new THREE.Vector3();
            while(obj1.children.length > 0){
                cMass.add(obj1.position).add(obj1.children[0].position);
                var child = obj1.children[0];
                THREE.SceneUtils.detach(obj1.children[0], obj1, scene);
                newGroup.add(child);
                //child.position.add(obj1.position);
            }
            while(obj2.children.length > 0){
                cMass.add(obj2.position).add(obj2.children[0].position);
                var child = obj2.children[0];
                THREE.SceneUtils.detach(obj2.children[0], obj2, scene);
                newGroup.add(child);
                //child.position.add(obj2.position);
            }
            cMass.multiplyScalar(1/(newGroup.children.length));
            newGroup.position.copy(cMass);
            for(var i = 0; i < newGroup.children.length; i++){
                newGroup.children[i].position.sub(newGroup.position);
            }
            newGroup.updateMatrix();
            newGroup.updateMatrixWorld(true);
            var newConnectionPoints = [];
            for(var j = 0; j < newGroup.children.length; j++){
                for(var i = 0; i < newGroup.children[j].connectionPoints.length; i++){
                    var newPosition = newGroup.worldToLocal(newGroup.children[j].localToWorld(newGroup.children[j].connectionPoints[i].position.clone()));
                    //newPosition.sub(newObj.position);
                    var newConnectionPoint = new ConnectionPoint(newPosition);
                    newConnectionPoint.connectable = newGroup.children[j].connectionPoints[i].connectable;
                    newConnectionPoint.coordinateSystem.multiply(newGroup.children[j].matrixWorld);
                    newConnectionPoint.coordinateSystem.multiply(newGroup.matrix);
                    newConnectionPoint.parent = newGroup.children[j].connectionPoints[i];
                    newConnectionPoints.push(newConnectionPoint);
                }
            }
            //newConnectionPoints = newConnectionPoints.concat(obj1.connectionPoints, obj2.connectionPoints);
            newGroup.connectionPoints = newConnectionPoints;
            selectObject(newGroup);
            var index = objectCollection.indexOf(obj1);
            objectCollection.splice(index,1);
            index = objectCollection.indexOf(obj2);
            objectCollection.splice(index,1);
            objectCollection.push(newGroup);
            scene.add(newGroup);
        }
        else if(obj1.group === undefined){
            var newGroup = new THREE.Object3D();
            newGroup.group = true;
            scene.add(newGroup);
            var cMass = obj1.position.clone();
            newGroup.add(obj1);
            while(obj2.children.length > 0){
                cMass.add(obj2.position).add(obj2.children[0].position);
                var child = obj2.children[0];
                //THREE.SceneUtils.detach(obj2.children[i], obj2, scene);
                newGroup.add(child);
                child.position.add(obj2.position);
            }
            cMass.multiplyScalar(1/(newGroup.children.length));
            newGroup.position.copy(cMass);
            for(var i = 0; i < newGroup.children.length; i++){
                newGroup.children[i].position.sub(newGroup.position);
            }
            newGroup.updateMatrix();
            newGroup.updateMatrixWorld(true);
            var newConnectionPoints = [];
            for(var j = 0; j < newGroup.children.length; j++){
                for(var i = 0; i < newGroup.children[j].connectionPoints.length; i++){
                    var newPosition = newGroup.worldToLocal(newGroup.children[j].localToWorld(newGroup.children[j].connectionPoints[i].position.clone()));
                    //newPosition.sub(newObj.position);
                    var newConnectionPoint = new ConnectionPoint(newPosition);
                    newConnectionPoint.connectable = newGroup.children[j].connectionPoints[i].connectable;
                    newConnectionPoint.coordinateSystem.multiply(newGroup.children[j].matrixWorld);
                    newConnectionPoint.coordinateSystem.multiply(newGroup.matrix);
                    newConnectionPoint.parent = newGroup.children[j].connectionPoints[i];
                    newConnectionPoints.push(newConnectionPoint);
                }
            }
            //newConnectionPoints = newConnectionPoints.concat(obj1.connectionPoints, obj2.connectionPoints);
            newGroup.connectionPoints = newConnectionPoints;
            selectObject(newGroup);
            var index = objectCollection.indexOf(obj1);
            objectCollection.splice(index,1);
            index = objectCollection.indexOf(obj2);
            objectCollection.splice(index,1);
            objectCollection.push(newGroup);
            scene.add(newGroup);
        }
        else if(obj2.group === undefined){
            var newGroup = new THREE.Object3D();
            scene.add(newGroup);
            newGroup.group = true;
            var cMass = obj2.position.clone();
            newGroup.add(obj2);
            while(obj1.children.length > 0){
                cMass.add(obj1.position).add(obj1.children[0].position);
                var child = obj1.children[0];
                THREE.SceneUtils.detach(obj1.children[0], obj1, scene);
                newGroup.add(child);
                //child.position.add(obj1.position);
            }
            cMass.multiplyScalar(1/(newGroup.children.length));
            newGroup.position.copy(cMass);
            for(var i = 0; i < newGroup.children.length; i++){
                newGroup.children[i].position.sub(newGroup.position);
            }
            newGroup.updateMatrix();
            newGroup.updateMatrixWorld(true);
            var newConnectionPoints = [];
            for(var j = 0; j < newGroup.children.length; j++){
                for(var i = 0; i < newGroup.children[j].connectionPoints.length; i++){
                    var newPosition = newGroup.worldToLocal(newGroup.children[j].localToWorld(newGroup.children[j].connectionPoints[i].position.clone()));
                    //newPosition.sub(newObj.position);
                    var newConnectionPoint = new ConnectionPoint(newPosition);
                    newConnectionPoint.connectable = newGroup.children[j].connectionPoints[i].connectable;
                    newConnectionPoint.coordinateSystem.multiply(newGroup.children[j].matrixWorld);
                    newConnectionPoint.coordinateSystem.multiply(newGroup.matrix);
                    newConnectionPoint.parent = newGroup.children[j].connectionPoints[i];
                    newConnectionPoints.push(newConnectionPoint);
                }
            }
            //newConnectionPoints = newConnectionPoints.concat(obj1.connectionPoints, obj2.connectionPoints);
            newGroup.connectionPoints = newConnectionPoints;
            selectObject(newGroup);
            var index = objectCollection.indexOf(obj2);
            objectCollection.splice(index,1);
            index = objectCollection.indexOf(obj1);
            objectCollection.splice(index,1);
            objectCollection.push(newGroup);
        }
    }
    function moveObjects(){
        for(var i = 0; i < movingObjects.length; i++){
            var interpolationSpeed = 0.07;
            movingObjects[i].position.lerp(movingObjects[i].userData.targetPosition,interpolationSpeed);
            movingObjects[i].quaternion.slerp(movingObjects[i].userData.targetQuaternion, interpolationSpeed);
            movingObjects[i].updateMatrix();
            movingObjects[i].updateMatrixWorld(true);
            
            if(movingObjects[i].position.distanceTo(movingObjects[i].userData.targetPosition) < 0.1){
                movingObjects[i].position.copy(movingObjects[i].userData.targetPosition);
                movingObjects[i].quaternion.copy(movingObjects[i].userData.targetQuaternion);
                movingObjects[i].updateMatrix();
                movingObjects[i].updateMatrixWorld(true);
                if(movingObjects[i].userData.targetObject != null)
                    generateNewObject(movingObjects[i], movingObjects[i].userData.targetObject);
                movingObjects.splice(i,1);
                i--;
                if(movingObjects.length == 0){
                    disableControls = false;
                }
            }
            
            
        }
        
        for(var j = 0; j < joints.length; j++){
            joints[j].update();
        }
    }
    function deselectObject(){
        if(selectedObject)
        {
            selectedObject.traverse(function(child){
               if(child instanceof THREE.Mesh)
                   child.material.color = child.userData.initColor;
            });
            transformControls.detach(selectedObject);
            selectedObject = null;
        }
    }    
    function checkForConnections(){
    if(selectedObject){
        var minDistSquared = Math.pow(50,2);
        var widthHalf = window.innerWidth / 2;
        var heightHalf = window.innerHeight / 2;
        foregroundScene.remove(connectionMarker);
        closestObject = null;
        connectionPoint1 = null;
        connectionPoint2 = null;
        for(var i = 0; i < selectedObject.connectionPoints.length; i++){
            
            var connectionClone = selectedObject.connectionPoints[i].position.clone();
            selectedObject.localToWorld(connectionClone);
            var selectedObjScreenPos = connectionClone;
            selectedObjScreenPos = selectedObjScreenPos.project(camera);
            selectedObjScreenPos.x = ( selectedObjScreenPos.x * widthHalf ) + widthHalf;
            selectedObjScreenPos.y = - ( selectedObjScreenPos.y * heightHalf ) + heightHalf;
            for(var j = 0; j < objectCollection.length; j++){
                if(objectCollection[j] !== selectedObject){
                    for(var k = 0; k < objectCollection[j].connectionPoints.length; k++){
                        connectionClone = objectCollection[j].connectionPoints[k].position.clone();
                        var comparisonObjScreenPos = objectCollection[j].localToWorld(connectionClone);
                        comparisonObjScreenPos.project(camera);
                        comparisonObjScreenPos.x = ( comparisonObjScreenPos.x * widthHalf ) + widthHalf;
                        comparisonObjScreenPos.y = - ( comparisonObjScreenPos.y * heightHalf ) + heightHalf;
                        var diff = new THREE.Vector3();
                        diff.x = selectedObjScreenPos.x - comparisonObjScreenPos.x;
                        diff.y = selectedObjScreenPos.y - comparisonObjScreenPos.y;
                        var distanceSquared = Math.pow(diff.x,2) + Math.pow(diff.y,2);
                        if(distanceSquared < minDistSquared && 
                                selectedObject.connectionPoints[i].connectable &&
                                objectCollection[j].connectionPoints[k].connectable){
                            closestObject = objectCollection[j];
                            connectionPoint1 = selectedObject.connectionPoints[i];
                            connectionPoint2 = objectCollection[j].connectionPoints[k];
                            minDistSquared = distanceSquared;
                        }
                    }
                }
            }
        }
        if(closestObject){
            var connectionClone = connectionPoint2.position.clone();
            closestObject.localToWorld(connectionClone);
            if(connectionPoint2.connectable)
                connectionMarker = generateSphere(connectionClone.x,connectionClone.y,connectionClone.z, true);
            else
                connectionMarker = generateSphere(connectionClone.x,connectionClone.y,connectionClone.z, false);
                
            foregroundScene.add(connectionMarker);
        }
    }
}
    function onMouseUp(){
        if(selectedObject && closestObject){

            mousePos.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            mousePos.y = - ( event.clientY / window.innerHeight ) * 2 + 1;	

            var mouseX = (mousePos.x + 1)/2 * window.innerWidth;
            var mouseY = -(mousePos.y - 1)/2 * window.innerHeight;

            //$('#test').css('left', '' + mouseX + 'px').css('top', '' + mouseY + 'px').show();
            $( "#jointPopup" ).popup( "open", { x: mouseX, y: mouseY, transition: "slideup" } );

            disableControls = true;
            transformControls.detach(selectedObject);
            foregroundScene.remove(connectionMarker);
            //self.connectObjects();
        }
    }
    this.connectObjects = function(type){
        connectionMarker = null;
        if(connectionPoint1.connectable && connectionPoint2.connectable){
            //Set up the logical connection:
            
            var joint = new Joint(type);
            scene.add(joint);
            
            joint.visible = false;
           
            connectionPoint1.connectedTo = joint;
            connectionPoint2.connectedTo = joint;
            joint.connectionA = (connectionPoint1.parent !== undefined) ? connectionPoint1.parent : connectionPoint1;
            joint.connectionB = (connectionPoint2.parent !== undefined) ? connectionPoint2.parent : connectionPoint2;
            connectionPoint1.connectable = false;
            if(connectionPoint1.parent !== undefined){
                connectionPoint1.parent.connectable = false;
                connectionPoint1.parent.connectedTo = joint;
            }
            connectionPoint2.connectable = false;
            if(connectionPoint2.parent !== undefined){
                connectionPoint2.parent.connectable = false;
                connectionPoint2.parent.connectedTo = joint;
            }
            
            joint.makeLines();
            var temp = connectionPoint1.position.clone();
            selectedObject.localToWorld(temp);
           //Move the joint:
            joint.position.copy(temp);
            
            joints.push(joint);
            
            
            //selectedObject.userData.targetRotation = closestObject.quaternion.clone();
            var transform = connectionPoint1.coordinateSystem.clone();
            transform.multiplyMatrices(selectedObject.matrixWorld, transform);
            transform.getInverse(transform);
            var matrix = connectionPoint2.coordinateSystem.clone();
            matrix.multiplyMatrices(closestObject.matrixWorld, matrix);
            var t = new THREE.Matrix4().multiplyMatrices(matrix,transform);
            var objClone = selectedObject.clone();
            objClone.applyMatrix(t);
            objClone.updateMatrix();
            objClone.updateMatrixWorld(true);
            selectedObject.userData.targetQuaternion = objClone.quaternion;
            
            var oldRotation = selectedObject.rotation.clone();
            selectedObject.quaternion.copy(selectedObject.userData.targetQuaternion);
            selectedObject.updateMatrix();
            selectedObject.updateMatrixWorld(true);
            var cp1Clone = connectionPoint1.position.clone();
            var cp2Clone = connectionPoint2.position.clone();
            
            cp1Clone = selectedObject.localToWorld(cp1Clone);
            cp2Clone = closestObject.localToWorld(cp2Clone);
            var displacement = new THREE.Vector3(cp2Clone.x, cp2Clone.y, cp2Clone.z).sub(cp1Clone);
            displacement = displacement.add(selectedObject.position);
            selectedObject.userData.targetPosition = displacement;
            selectedObject.userData.targetObject = closestObject;
            selectedObject.rotation.copy(oldRotation);
            selectedObject.updateMatrix();
            selectedObject.updateMatrixWorld(true);
            movingObjects[movingObjects.length] = selectedObject;
            closestObject = null;
        }
    }
    this.cancelConnectObjects = function(){
        disableControls = false;
        selectObject(selectedObject);
    }
    this.enterSchematicMode = function(){
        //Loop through all objects and push apart
        for(var i = 0; i < objectCollection.length; i++){
            if(objectCollection[i].group === undefined){
                //Do nothing, since this isn't a group
            } else {
                //This is a group, move objects apart along the axes of their connection points
                //Start with one object and traverse connections:
                schematicPushApart(objectCollection[i].children[0], null, new THREE.Vector3(0,0,0));
            }
        }
        
//        for(var i = 0; i < joints.length; i++){
//            joints[i].visible = true;
//        }
        
        
    }
    
    //CONNECTION LOOPS ARE NOT ALLOWED!
    function schematicPushApart(obj, prevObj, accumulatedTranslation){

        obj.userData.oldPosition = obj.position.clone();
        obj.userData.targetQuaternion = obj.quaternion.clone();
        obj.userData.targetPosition = obj.position.clone().add(accumulatedTranslation);
        obj.userData.targetObject = null;
        movingObjects.push(obj);

        for(var i = 0; i < obj.connectionPoints.length; i++){
            //Skip the object we came from
            if(obj.connectionPoints[i].connectable ||obj.connectionPoints[i].connectedTo.getConnection(obj.connectionPoints[i]).parentObject === prevObj)
                continue;
            
            
            
            var translation = new THREE.Vector3();
            var y = new THREE.Vector3();
            var z = new THREE.Vector3();
            obj.connectionPoints[i].coordinateSystem.extractBasis(translation,y,z);
            translation.multiplyScalar(2);
            var m = new THREE.Matrix4();
            m.extractRotation(obj.matrix);
            translation.applyMatrix4(m);
            
            
            var temp = obj.connectionPoints[i].position.clone();
            obj.localToWorld(temp);
           //Move the joint:
            obj.connectionPoints[i].connectedTo.position.copy(temp);
            obj.connectionPoints[i].connectedTo.userData.oldPosition = temp.clone();
            obj.connectionPoints[i].connectedTo.visible = true;
            obj.connectionPoints[i].connectedTo.userData.targetQuaternion = obj.connectionPoints[i].connectedTo.quaternion.clone();
            var halfTranslation = translation.clone();
            halfTranslation.multiplyScalar(0.5);
            halfTranslation.add(accumulatedTranslation);
            obj.connectionPoints[i].connectedTo.userData.targetPosition = obj.connectionPoints[i].connectedTo.position.clone().add(halfTranslation);
            movingObjects.push(obj.connectionPoints[i].connectedTo);
            
            translation.add(accumulatedTranslation);
            
            
            
            
            
            schematicPushApart(obj.connectionPoints[i].connectedTo.getConnection(obj.connectionPoints[i]).parentObject, obj,translation);
        }
    }
    
    this.exitSchematicMode = function(){
        //Loop through all objects and return to their original positions
        for(var i = 0; i < objectCollection.length; i++){
            if(objectCollection[i].group === undefined){
                //Do nothing, since this isn't a group
            } else {
                //Return the group's children to their original positions
                for(var j = 0; j < objectCollection[i].children.length; j++){
                    objectCollection[i].children[j].userData.targetPosition = objectCollection[i].children[j].userData.oldPosition.clone();
                    movingObjects.push(objectCollection[i].children[j]);
                }
                for(var j = 0; j < joints.length; j++){
                    joints[j].userData.targetPosition = joints[j].userData.oldPosition.clone();
                    movingObjects.push(joints[j]);
                }
            }
        }
    }
    function logic() {
        moveObjects();
        requestAnimationFrame(render);
        if(!disableControls){
            cameraControls.update();
        }
        transformControls.update();
        palette.update();
    }
    function render(){
        renderer.clear();
        renderer.render(scene,camera);
        renderer.clearDepth();
        renderer.render(foregroundScene, camera);
        renderer.clearDepth();
        palette.render(renderer);
    }
    
    init();
    //loadModels();
    setInterval(logic, 1000/60);
}

var playmola = new Playmola();