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
    var joints = [];
    var objectCollection = []; //Collection of all active objects in scene
    var dymolaComponentStorage = [];
    var selectedObject = null;
    var closestObject; // Target object of currently selected object
    var connectionPoint1; //Connection point of selected object
    var connectionPoint2; //Connection point of targeted object
    var connectionMarker; //Sphere for visualising connection on target object
    
    //Foreground stuff
    var foregroundConnectors = [];
    
    var leftMouseDown = false;
    
    
    //DymolaComponent Connection-related:
    var draggingConnection = false;
    var draggingFrom = null; //The Connector the connection line starts at
    var connectionLine = null; //A line representing the connection being dragged
    var connections = []; //An array of connections - consists of a line and data about the connectors involved
    
    var mouseMovedSinceMouseDown = false;
       
    var world = null; //WORLD dymola component
    
    var mousePos;
    var disableControls = false;
    var schematicMode = true;
    
    var palette; //palette of 3D models to add to the scene
    var dymolaInterface;
    
    var loader = new THREE.VRMLLoader();
    
    var audio;
    
    var particleGroup = null;
    
//Ljudexempel   
//    var song = document.getElementById("havanaAffair");
//    song.src = "Audio/07 Havana Affair.mp3";
//    song.play();
//    song.oncanplay = function(){
//        alert("hejhej");
//    };
//    song.oncanplaythrough = function(){
//        song.play();
//        alert("HEJ");
//    };

    function generateModelicaCode() { 
        var source = "model TestModel\n";
        objectCollection.forEach(function(obj){
            if(obj.typeName === "Modelica.Mechanics.MultiBody.World")
                source += "inner "
            source += obj.typeName + " " + obj.name;
            var first = true;
            if(obj.parameters.length > 0){
                
                obj.parameters.forEach(function(param){
                    if(param.changed){
                        if(!first){
                            source += ",";
                        }
                        else {
                            source +="(";
                            first = false;
                        }
                        source += param.name + "=" + param.currentValue;
                    } 
                });
                if(first == false)
                    source +=");\n";
                else
                    source +=";\n";
            }
              //source += "\n";
        });
        
        source += "equation\n";
        
        connections.forEach(function(conn){
            source += "connect(";
            source += conn.connectorA.getParent().name + "." + conn.connectorA.userData.name;
            source += ",";
            source += conn.connectorB.getParent().name + "." + conn.connectorB.userData.name + ");\n";
        });
        source += "end TestModel;";
        //alert(source);
        return source;
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
                    var newComponent = cloneAndScaleComponent(categories[selectedCategory][hoverTileX + hoverTileY * tilesX]);
                    
                    raycaster.setFromCamera(new THREE.Vector2(( event.clientX / domElement.getBoundingClientRect().width ) * 2 - 1, - ( event.clientY / domElement.getBoundingClientRect().height ) * 2 + 1), camera);
                    var projPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0,0, -1).applyQuaternion(camera.quaternion),new THREE.Vector3());
                    projPlane.intersectLine(new THREE.Line3(camera.position, camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(100.0))),newComponent.position);
                    
                    selectObject(newComponent);
                    mouseMovedSinceMouseDown = false;
                }
            }
        });
        var objCounter = 0;
        $(domElement).on('mouseup',function(event){
//            if(dragging !== null){
//                //Spawn object here
//                scope.palettescene.remove(dragging);
//                
//                objectCollection.push(dragging);
//                scene.add(dragging);
//                dragging.name = "Obj" + objCounter;
//                objCounter++;
//                
//                if(dragging.typeName === "Modelica.Mechanics.MultiBody.World") {
//                    world = dragging;
//                    dragging.name = "world";
//                }
//                if(dragging.type === "RevoluteJoint" || dragging.type === "PrismaticJoint" || dragging.type === "RollingWheelJoint") joints.push(dragging);
//
//                dragging.scale.set(dragging.userData.sceneScale,dragging.userData.sceneScale,dragging.userData.sceneScale);
//                raycaster.setFromCamera(new THREE.Vector2(( event.clientX / domElement.getBoundingClientRect().width ) * 2 - 1, - ( event.clientY / domElement.getBoundingClientRect().height ) * 2 + 1), camera);
//                var projPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0,0, -1).applyQuaternion(camera.quaternion),new THREE.Vector3());
//                projPlane.intersectLine(new THREE.Line3(camera.position, camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(100.0))),dragging.position);
//                
//                
//                dragging.children[0].position.add(dragging.userData.centerOffset);               
//                
//                dragging = null;
//            }
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
            width = domElement.getBoundingClientRect().width;
            height = domElement.getBoundingClientRect().height;
            scope.camera.left = width / -2;
            scope.camera.right = width / 2;
            scope.camera.top = height / 2;
            scope.camera.bottom = height / -2;
            scope.camera.updateProjectionMatrix();
            
            Object.keys(categories).forEach(function(key, index){
                for(var i = 0; i < categories[key].length; i++){
                    categories[key][i].position.set(((i)%tilesX) * (tileSpacing + tileWidth) - width/2 + tileWidth/2 + bounds.min.x, -Math.floor((i)/tilesX) * (tileSpacing + tileHeight) + height/2 - tileHeight/2 - bounds.min.y,-100);
                }
            });
            
        };
        
        this.add = function(obj, category, tilt, rotationMode, sceneScale){
            if(tilt === undefined) tilt = true;
            if(rotationMode === undefined) rotationMode = 0;
            if(tilt)
                obj.rotation.set(0.1,0,-0.1);
            if(sceneScale === undefined) sceneScale = 1;
            obj.updateMatrix();
            obj.updateMatrixWorld(true);
            obj.userData.sceneScale = sceneScale;
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
            
           
            obj.traverse(function(o){
                o.castShadow = true;
            });
           
            //bounds.min.set(tileSpacing,tileSpacing);
            if(category === selectedCategory) bounds.max.set((len < 3 ? len :tilesX)*(tileSpacing + tileWidth) + bounds.min.x, Math.ceil((len)/tilesX) * (tileSpacing + tileHeight) + bounds.min.y);
            
            return obj;
        };
        
        var cloneAndScaleComponent = function(c){
            
            var newcomponent = c.clone();
            //scope.palettescene.remove(component);
            //Materials are not cloned, so do it manually here...
            newcomponent.traverse(function(o){
                if(o.material !== undefined) o.material = o.material.clone();
            });

            newcomponent.rotation.set(0,0,0);
                
            objectCollection.push(newcomponent);
            scene.add(newcomponent);
            newcomponent.name = "Obj" + objCounter;
            objCounter++;

            if(newcomponent.typeName === "Modelica.Mechanics.MultiBody.World") {
                world = newcomponent;
                newcomponent.name = "world";
            }
            if(newcomponent.type === "RevoluteJoint" || newcomponent.type === "PrismaticJoint" || newcomponent.type === "RollingWheelJoint") joints.push(newcomponent);

            newcomponent.scale.set(newcomponent.userData.sceneScale,newcomponent.userData.sceneScale,newcomponent.userData.sceneScale);


            newcomponent.children[0].position.add(newcomponent.userData.centerOffset);
            
            return newcomponent;

        }
        
        this.makeComponent = function(category, className){
            if(categories[category] === undefined)
                return null;
            
            for(var i = 0; i < categories[category].length; i++){
                if(categories[category][i].typeName == className){
                    return cloneAndScaleComponent(categories[category][i]);
                }
            }
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
            $("#select-custom-1").enhanceWithin();
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

        
        //this.selectCategory("joints");
        this.loadParts = function(){
            
            loader.load("Piston_Study.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(0.,-0.15149054405043,0.), new Array(new ConnectionPoint(new THREE.Vector3(0.,-0.14420647088485,0.))));
                scope.add(obj, "Parts",true, 0, 4);
            });
            loader.load("Master_One_Cylinder.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(-4.5e-2,0.,0.), new Array(new ConnectionPoint(new THREE.Vector3(-4.5e-2,0.,0.))));
                scope.add(obj, "Parts", true, 0, 4);
            });
            loader.load("Rod_Study.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(0.,-8.9431700693962e-2,2.4489282256523e-2), new Array(new ConnectionPoint(new THREE.Vector3(0.,-3.465692988818e-2,4.8978561933508e-2)), new ConnectionPoint(new THREE.Vector3(0.,-0.14420647088485,0.))));
                scope.add(obj, "Parts", true, 0, 4);
            });
            loader.load("Cranck_Study.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(-2.7054598934035e-2,-9.0702960410631e-3,1.2818607418443e-2), new Array(new ConnectionPoint(new THREE.Vector3(0.,-3.465692988818e-2,4.8978561933508e-2)), new ConnectionPoint(new THREE.Vector3(-4.5e-2,0.,0.))));
                scope.add(obj, "Parts", true, 0, 4);
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
        
        this.loadDymolaBox = function(){
            if(categories["Bodies"] === undefined){
                scope.addCategory("Bodies");
            }
            var bodyBoxClassName = "Modelica.Mechanics.MultiBody.Parts.BodyBox";
            var dymBox = new DymolaBox(0.5,0.5,0.5);
            var componentsInClass = dymolaInterface.Dymola_AST_ComponentsInClass(bodyBoxClassName);
            for(var i = 0; i < componentsInClass.length; i++){
                var params = [];
                params.push(bodyBoxClassName);
                params.push(componentsInClass[i]);
                if(dymolaInterface.callDymolaFunction("Dymola_AST_ComponentVariability", params) === "parameter"){
                    var componentParam = [];
                    componentParam["name"] = componentsInClass[i];
                    componentParam["sizes"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentSizes",params);
                    componentParam["fullTypeName"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentFullTypeName", params);
                    componentParam["description"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentDescription",params);
                    componentParam["changed"] = false;
                    if(componentParam.name === "length")
                        componentParam.callback = function(val){
                            if(!isNaN(val)){
                                this.length = val;
                                this.resize();
                                this.updateFrames();
                            }
                        };
                    if(componentParam.name === "height")
                        componentParam.callback = function(val){
                            if(!isNaN(val)){
                                this.height = val;
                                this.resize();
                                this.updateFrames();
                            }
                        };
                    if(componentParam.name === "width")
                        componentParam.callback = function(val){
                            if(!isNaN(val)){
                                this.width = val;
                                this.resize();
                                this.updateFrames();
                            }
                        };
                    if(componentParam.name === "r")
                        componentParam.callback = function(vector){
                            var xyz = vector.toString().replace("{","").replace("}","").split(",");
                            if(xyz.length == 3)
                                this.r = new THREE.Vector3(parseFloat(xyz[0]),parseFloat(xyz[1]),parseFloat(xyz[2]));
                            this.updateFrames();
                        };
                    if(componentParam.name === "r_shape")
                        componentParam.callback = function(vector){
                            var xyz = vector.toString().replace("{","").replace("}","").split(",");
                            if(xyz.length == 3)
                                this.r_shape = new THREE.Vector3(parseFloat(xyz[0]),parseFloat(xyz[1]),parseFloat(xyz[2]));
                            this.updateFrames();
                        };
                    if(componentParam.name === "lengthDirection")
                        componentParam.callback = function(vector){
                            var xyz = vector.toString().replace("{","").replace("}","").split(",");
                            if(xyz.length == 3)
                                this.lengthDirection = new THREE.Vector3(parseFloat(xyz[0]),parseFloat(xyz[1]),parseFloat(xyz[2]));
                            this.resize();
                            this.updateFrames();
                        };
                    dymBox.parameters.push(componentParam);
                }
            }
            
            var connPoint1 = new Connector();
            connPoint1.add(new THREE.Mesh(new THREE.SphereGeometry(0.05,20,20),new THREE.MeshPhongMaterial({color:0xff0000})));
            var connPoint2 = new Connector();
            connPoint2.add(new THREE.Mesh(new THREE.SphereGeometry(0.05,20,20),new THREE.MeshPhongMaterial({color:0xff0000})));
            connPoint1.position.set(0,0,0);
            connPoint1.actualPosition = connPoint1.position.clone();
            connPoint1.userData.name = "frame_a";
            dymBox.add(connPoint1);
            dymBox.connectors.push(connPoint1);
            connPoint2.position.set(dymBox.length,0,0);
            connPoint2.actualPosition = connPoint2.position.clone();
            connPoint2.userData.name = "frame_b";
            dymBox.add(connPoint2);
            dymBox.connectors.push(connPoint2);
            
            dymBox.typeName = bodyBoxClassName;
            
            dymBox.parameters.forEach(function(entry){
                if(entry.name === "length"){
                    entry.currentValue = dymBox.length;
                    entry.changed = true;
                }
                else if(entry.name ==="width"){
                    entry.currentValue = dymBox.width;
                    entry.changed = true;
                }
                else if(entry.name ==="height"){
                    entry.currentValue = dymBox.height;
                    entry.changed = true;
                }
                else if(entry.name ==="r"){
                    entry.currentValue = "{"+dymBox.length+",0,0}"
                    entry.changed = true;
                }
                else if(entry.name ==="r_shape"){
                    entry.currentValue = "{0,0,0}"
                    entry.changed = true;
                }
                else if(entry.name ==="lengthDirection"){
                    entry.currentValue = "{1,0,0}"
                    entry.changed = true;
                }
            });
            scope.add(dymBox, "Bodies", true, 0, 1);
        };
        
        this.loadDymolaCylinder = function(){
            if(categories["Bodies"] === undefined){
                scope.addCategory("Bodies");
            }
            var bodyCylinderClassName = "Modelica.Mechanics.MultiBody.Parts.BodyCylinder";
            var dymCyl = new DymolaCylinder();
            var componentsInClass = dymolaInterface.Dymola_AST_ComponentsInClass(bodyCylinderClassName);
            for(var i = 0; i < componentsInClass.length; i++){
                var params = [];
                params.push(bodyCylinderClassName);
                params.push(componentsInClass[i]);
                if(dymolaInterface.callDymolaFunction("Dymola_AST_ComponentVariability", params) === "parameter"){
                    var componentParam = [];
                    componentParam["name"] = componentsInClass[i];
                    componentParam["sizes"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentSizes",params);
                    componentParam["fullTypeName"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentFullTypeName", params);
                    componentParam["description"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentDescription",params);
                    componentParam["changed"] = false;
                     if(componentParam.name === "length")
                        componentParam.callback = function(val){
                            if(!isNaN(val)){
                                this.length = val;
                                this.resize();
                                this.updateFrames();
                            }
                        }
                    if(componentParam.name === "diameter")
                        componentParam.callback = function(val){
                            if(!isNaN(val)){
                                this.diameter = val;
                                this.resize();
                                this.updateFrames();
                            }
                        };
                    if(componentParam.name === "r")
                        componentParam.callback = function(vector){
                            var xyz = vector.toString().replace("{","").replace("}","").split(",");
                            if(xyz.length == 3)
                                this.r = new THREE.Vector3(parseFloat(xyz[0]),parseFloat(xyz[1]),parseFloat(xyz[2]));
                            this.updateFrames();
                        };
                    if(componentParam.name === "r_shape")
                        componentParam.callback = function(vector){
                            var xyz = vector.toString().replace("{","").replace("}","").split(",");
                            if(xyz.length == 3)
                                this.r_shape = new THREE.Vector3(parseFloat(xyz[0]),parseFloat(xyz[1]),parseFloat(xyz[2]));
                            this.updateFrames();
                        };
                    if(componentParam.name === "lengthDirection")
                        componentParam.callback = function(vector){
                            var xyz = vector.toString().replace("{","").replace("}","").split(",");
                            if(xyz.length == 3)
                                this.lengthDirection = new THREE.Vector3(parseFloat(xyz[0]),parseFloat(xyz[1]),parseFloat(xyz[2]));
                            this.resize();
                            this.updateFrames();
                        };
                        
                    dymCyl.parameters.push(componentParam);
                }
            }
            dymCyl.length = 0.5;
            dymCyl.width = 0.5;
            dymCyl.resize();
            
            var connPoint1 = new Connector();
            connPoint1.add(new THREE.Mesh(new THREE.SphereGeometry(0.05,20,20),new THREE.MeshPhongMaterial({color:0xff0000})));
            var connPoint2 = new Connector();
            connPoint2.add(new THREE.Mesh(new THREE.SphereGeometry(0.05,20,20),new THREE.MeshPhongMaterial({color:0xff0000})));
            connPoint1.position.set(0,0,0);
            connPoint1.actualPosition = connPoint1.position.clone();
            connPoint1.userData.name = "frame_a";
            dymCyl.add(connPoint1);
            dymCyl.connectors.push(connPoint1);
            connPoint2.position.set(dymCyl.length,0,0);
            connPoint2.actualPosition = connPoint2.position.clone();
            connPoint2.userData.name = "frame_b";
            dymCyl.add(connPoint2);
            dymCyl.connectors.push(connPoint2);
            
            dymCyl.typeName = bodyCylinderClassName;
            
            dymCyl.parameters.forEach(function(entry){
                if(entry.name === "length"){
                    entry.currentValue = dymCyl.length;
                    entry.changed = true;
                }
                else if(entry.name ==="diameter"){
                    entry.currentValue = dymCyl.diameter;
                    entry.changed = true;
                }
                else if(entry.name ==="r"){
                    entry.currentValue = "{"+dymCyl.length+",0,0}"
                    entry.changed = true;
                }
                else if(entry.name ==="r_shape"){
                    entry.currentValue = "{0,0,0}"
                    entry.changed = true;
                }
                else if(entry.name ==="lengthDirection"){
                    entry.currentValue = "{1,0,0}"
                    entry.changed = true;
                }
            });
            
            scope.add(dymCyl, "Bodies", true, 0, 1);
        };
        
        this.loadRevoluteJoint = function(){
            if(categories["Joints"] === undefined){
                scope.addCategory("Joints");
            }
            
            var exportModelSource = dymolaInterface.exportWebGL("Playmola.SimpleRevoluteJoint");
            var obj = new Function(exportModelSource)();
            //Remove TextGeometry
            for(var j = 0; j < obj.children.length; j++){
                if(obj.children[j].type == 'Mesh' && obj.children[j].geometry.type == 'TextGeometry'){
                    obj.remove(obj.children[j]);
                    j--;
                }
            }
            var obj2 = new RevoluteJoint();
            obj2.typeName = "Playmola.SimpleRevoluteJoint";
            var componentsInClass = dymolaInterface.Dymola_AST_ComponentsInClass("Playmola.SimpleRevoluteJoint");

            for(var j = 0; j < componentsInClass.length; j++){
                var params = [];
                params.push("Playmola.SimpleRevoluteJoint");
                params.push(componentsInClass[j]);
                if(dymolaInterface.callDymolaFunction("Dymola_AST_ComponentVariability", params) === "parameter"){
                    var componentParam = [];
                    componentParam["name"] = componentsInClass[j];
                    componentParam["sizes"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentSizes",params);
                    componentParam["fullTypeName"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentFullTypeName", params);
                    componentParam["description"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentDescription",params);
                    componentParam["changed"] = false;
                    if(componentParam.name === "StartAngle")
                        componentParam.callback = function(angle){
                            if(!isNaN(angle))
                                this.phi = angle;
                        };
                    if(componentParam.name === "AxisOfRotation")
                        componentParam.callback = function(vector){
                            var xyz = vector.toString().replace("{","").replace("}","").split(",");
                            if(xyz.length == 3)
                                this.axis = new THREE.Vector3(parseFloat(xyz[0]),parseFloat(xyz[1]),parseFloat(xyz[2]));
                            this.align();
                        };
                    obj2.parameters.push(componentParam);
                }
            }
            
            var connectors = [];

            obj2.add(obj);
            obj.traverse(function(currentObj){
                if(currentObj.userData.isConnector === true){

                    //Move the connectors to the center of their bounding boxes
                    connectors.push(currentObj);
                    
                }
            });
            
            connectors.forEach(function(currentObj){
                    var bbh = new THREE.BoundingBoxHelper(currentObj, 0xffffff);
                    bbh.update();

                    currentObj.children.forEach(function(o){
                        o.position.sub(bbh.box.center());
                    });

                    var conn = new Connector();
                    conn.userData.name = currentObj.userData.name;
                    conn.position.copy(bbh.box.center().clone());
                    conn.add(currentObj);
                    obj.add(conn);
                    obj2.connectors.push(conn); 
            });
            
            scope.add(obj2, "Joints", false, 1, 0.005);
        }
        
        this.loadPrismaticJoint = function(){
            if(categories["Joints"] === undefined){
                scope.addCategory("Joints");
            }
            
            var exportModelSource = dymolaInterface.exportWebGL("Playmola.SimplePrismaticJoint");
            var obj = new Function(exportModelSource)();
            //Remove TextGeometry
            for(var j = 0; j < obj.children.length; j++){
                if(obj.children[j].type == 'Mesh' && obj.children[j].geometry.type == 'TextGeometry'){
                    obj.remove(obj.children[j]);
                    j--;
                }
            }
            var obj2 = new PrismaticJoint();
            obj2.typeName = "Playmola.SimplePrismaticJoint";
            var componentsInClass = dymolaInterface.Dymola_AST_ComponentsInClass("Playmola.SimplePrismaticJoint");

            for(var j = 0; j < componentsInClass.length; j++){
                var params = [];
                params.push("Playmola.SimplePrismaticJoint");
                params.push(componentsInClass[j]);
                if(dymolaInterface.callDymolaFunction("Dymola_AST_ComponentVariability", params) === "parameter"){
                    var componentParam = [];
                    componentParam["name"] = componentsInClass[j];
                    componentParam["sizes"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentSizes",params);
                    componentParam["fullTypeName"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentFullTypeName", params);
                    componentParam["description"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentDescription",params);
                    componentParam["changed"] = false;
                    if(componentParam.name === "StartTranslation")
                        componentParam.callback = function(translation){
                            if(!isNaN(angle))
                                this.translation = translation;
                        };
                    if(componentParam.name === "AxisOfTranslation")
                        componentParam.callback = function(vector){
                            var xyz = vector.toString().replace("{","").replace("}","").split(",");
                            if(xyz.length == 3)
                                this.axis = new THREE.Vector3(parseFloat(xyz[0]),parseFloat(xyz[1]),parseFloat(xyz[2]));
                            this.align();
                        };
                    obj2.parameters.push(componentParam);
                }
            }
            
            var connectors = [];

            obj2.add(obj);
            obj.traverse(function(currentObj){
                if(currentObj.userData.isConnector === true){

                    //Move the connectors to the center of their bounding boxes
                    connectors.push(currentObj);
                    
                }
            });
            
            connectors.forEach(function(currentObj){
                    var bbh = new THREE.BoundingBoxHelper(currentObj, 0xffffff);
                    bbh.update();

                    currentObj.children.forEach(function(o){
                        o.position.sub(bbh.box.center());
                    });

                    var conn = new Connector();
                    conn.userData.name = currentObj.userData.name;
                    conn.position.copy(bbh.box.center().clone());
                    conn.add(currentObj);
                    obj.add(conn);
                    obj2.connectors.push(conn); 
            });
            
            scope.add(obj2, "Joints", false, 1, 0.005);
        }
        
        this.loadRollingWheelJoint = function(){
            if(categories["Joints"] === undefined){
                scope.addCategory("Joints");
            }
            
            var exportModelSource = dymolaInterface.exportWebGL("VisualMultiBody.Joints.RollingWheel");
            var obj = new Function(exportModelSource)();
            //Remove TextGeometry
            for(var j = 0; j < obj.children.length; j++){
                if(obj.children[j].type == 'Mesh' && obj.children[j].geometry.type == 'TextGeometry'){
                    obj.remove(obj.children[j]);
                    j--;
                }
            }
            var obj2 = new RollingWheelJoint();
            obj2.typeName = "VisualMultiBody.Joints.RollingWheel";
            var componentsInClass = dymolaInterface.Dymola_AST_ComponentsInClass("VisualMultiBody.Joints.RollingWheel");

            for(var j = 0; j < componentsInClass.length; j++){
                var params = [];
                params.push("VisualMultiBody.Joints.RollingWheel");
                params.push(componentsInClass[j]);
                if(dymolaInterface.callDymolaFunction("Dymola_AST_ComponentVariability", params) === "parameter"){
                    var componentParam = [];
                    componentParam["name"] = componentsInClass[j];
                    componentParam["sizes"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentSizes",params);
                    componentParam["fullTypeName"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentFullTypeName", params);
                    componentParam["description"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentDescription",params);
                    componentParam["changed"] = false;
                    if(componentParam.name === "radius")
                        componentParam.callback = function(radius){
                            if(!isNaN(radius))
                                this.radius = radius;
                        };
                    
                    obj2.parameters.push(componentParam);
                }
            }
            
            var connectors = [];

            obj2.add(obj);
            obj.traverse(function(currentObj){
                if(currentObj.userData.isConnector === true){

                    //Move the connectors to the center of their bounding boxes
                    connectors.push(currentObj);
                    
                }
            });
            
            connectors.forEach(function(currentObj){
                    var bbh = new THREE.BoundingBoxHelper(currentObj, 0xffffff);
                    bbh.update();

                    currentObj.children.forEach(function(o){
                        o.position.sub(bbh.box.center());
                    });

                    var conn = new Connector();
                    conn.userData.name = currentObj.userData.name;
                    conn.position.copy(bbh.box.center().clone());
                    conn.add(currentObj);
                    obj.add(conn);
                    obj2.connectors.push(conn); 
            });
            
            scope.add(obj2, "Joints", false, 1, 0.005);
        }
        
        this.loadFixedRotation = function(){
            if(categories["FixedRotation"] === undefined){
                scope.addCategory("FixedRotation");
            }
            
            var exportModelSource = dymolaInterface.exportWebGL("Modelica.Mechanics.MultiBody.Parts.FixedRotation");
            var obj = new Function(exportModelSource)();
            //Remove TextGeometry
            for(var j = 0; j < obj.children.length; j++){
                if(obj.children[j].type == 'Mesh' && obj.children[j].geometry.type == 'TextGeometry'){
                    obj.remove(obj.children[j]);
                    j--;
                }
            }
            var obj2 = new FixedRotation();
            obj2.typeName = "Modelica.Mechanics.MultiBody.Parts.FixedRotation";
            var componentsInClass = dymolaInterface.Dymola_AST_ComponentsInClass("Modelica.Mechanics.MultiBody.Parts.FixedRotation");

            for(var j = 0; j < componentsInClass.length; j++){
                var params = [];
                params.push("Modelica.Mechanics.MultiBody.Parts.FixedRotation");
                params.push(componentsInClass[j]);
                if(dymolaInterface.callDymolaFunction("Dymola_AST_ComponentVariability", params) === "parameter"){
                    var componentParam = [];
                    componentParam["name"] = componentsInClass[j];
                    componentParam["sizes"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentSizes",params);
                    componentParam["fullTypeName"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentFullTypeName", params);
                    componentParam["description"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentDescription",params);
                    componentParam["changed"] = false;
                    if(componentParam.name === "r")
                        componentParam.callback = function(vector){
                            var xyz = vector.toString().replace("{","").replace("}","").split(",");
                            if(xyz.length == 3)
                                this.translation = new THREE.Vector3(parseFloat(xyz[0]),parseFloat(xyz[1]),parseFloat(xyz[2]));
                            this.updateFrames();
                        };
                    else if(componentParam.name === "n")
                        componentParam.callback = function(vector){
                            var xyz = vector.toString().replace("{","").replace("}","").split(",");
                            if(xyz.length == 3)
                                this.rotationAxis = new THREE.Vector3(parseFloat(xyz[0]),parseFloat(xyz[1]),parseFloat(xyz[2]));
                            this.updateFrames();
                        };
                    else if(componentParam.name === "angle")
                        componentParam.callback = function(angle){
                            if(!isNaN(angle))
                                this.rotationAngle = angle;
                            this.updateFrames();
                        };
                    obj2.parameters.push(componentParam);
                }
            }
            
            var connectors = [];

            obj2.add(obj);
            obj.traverse(function(currentObj){
                if(currentObj.userData.isConnector === true){
                    connectors.push(currentObj);
                }
            });
            
            connectors.forEach(function(currentObj){
                    var bbh = new THREE.BoundingBoxHelper(currentObj, 0xffffff);
                    bbh.update();

                    currentObj.children.forEach(function(o){
                        o.position.sub(bbh.box.center());
                    });

                    var conn = new Connector();
                    conn.userData.name = currentObj.userData.name;
                    conn.position.copy(bbh.box.center().clone());
                    conn.add(currentObj);
                    obj.add(conn);
                    obj2.connectors.push(conn); 
            });
            
            scope.add(obj2, "FixedRotation", false, 1, 0.005);
        };
        
        
        this.addClass = function(classname, category){
            if(categories[category] === undefined){
                scope.addCategory(category);
            }
            
            var exportModelSource = dymolaInterface.exportWebGL(classname);
            var obj = new Function(exportModelSource)();
            //Remove TextGeometry
            for(var j = 0; j < obj.children.length; j++){
                if(obj.children[j].type == 'Mesh' && obj.children[j].geometry.type == 'TextGeometry'){
                    obj.remove(obj.children[j]);
                    j--;
                }
            }
            var obj2 = new DymolaComponent();
            obj2.typeName = classname;
            var componentsInClass = dymolaInterface.Dymola_AST_ComponentsInClass(classname);

            for(var j = 0; j < componentsInClass.length; j++){
                var params = [];
                params.push(classname);
                params.push(componentsInClass[j]);
                if(dymolaInterface.callDymolaFunction("Dymola_AST_ComponentVariability", params) === "parameter"){
                    var componentParam = [];
                    componentParam["name"] = componentsInClass[j];
                    componentParam["sizes"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentSizes",params);
                    componentParam["fullTypeName"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentFullTypeName", params);
                    componentParam["description"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentDescription",params);
                    componentParam["changed"] = false;
                    obj2.parameters.push(componentParam);
                }
            }

            var connectors = [];

            obj2.add(obj);
            obj.traverse(function(currentObj){
                if(currentObj.userData.isConnector === true){

                    
                    connectors.push(currentObj);
                    
                }
            });
            
            connectors.forEach(function(currentObj){
                //Move the connectors to the center of their bounding boxes
                var bbh = new THREE.BoundingBoxHelper(currentObj, 0xffffff);
                bbh.update();

                currentObj.children.forEach(function(o){
                    o.position.sub(bbh.box.center());
                });

                var conn = new Connector();
                conn.userData.name = currentObj.userData.name;
                conn.position.copy(bbh.box.center().clone());
                conn.add(currentObj);
                obj.add(conn);
                obj2.connectors.push(conn); 
            });
            
            scope.add(obj2, category, false, 1, 0.005);
        };
        
        this.addPreloadedClass = function(classToLoad, category){
            if(categories[category] === undefined){
                scope.addCategory(category);
            }
            
            var exportModelSource = dymolaInterface.exportWebGL(classToLoad.fullPathName);
            var obj = new Function(exportModelSource)();
            //Remove TextGeometry
            for(var j = 0; j < obj.children.length; j++){
                if(obj.children[j].type == 'Mesh' && obj.children[j].geometry.type == 'TextGeometry'){
                    obj.remove(obj.children[j]);
                    j--;
                }
            }
            var obj2 = new DymolaComponent();
            obj2.typeName = classToLoad.name;

            for(var j = 0; j < classToLoad.components.length; j++){
                var params = [];
                if(classToLoad.components[j].variability === "parameter"){
                    var componentParam = [];
                    componentParam["name"] = classToLoad.components[j].name;
                    componentParam["sizes"] = classToLoad.components[j].sizes;
                    componentParam["fullTypeName"] = classToLoad.components[j].fullTypeName;
                    componentParam["description"] = classToLoad.components[j].description;
                    componentParam["changed"] = false;
                    componentParam.currentValue = classToLoad.components[j].defaultvalue;
                    obj2.parameters.push(componentParam);
                }
            }
            var connectors = [];

            obj2.add(obj);
            obj.traverse(function(currentObj){
                if(currentObj.userData.isConnector === true){

                    
                    connectors.push(currentObj);
                    
                }
            });
            
            connectors.forEach(function(currentObj){
                //Move the connectors to the center of their bounding boxes
                var bbh = new THREE.BoundingBoxHelper(currentObj, 0xffffff);
                bbh.update();

                currentObj.children.forEach(function(o){
                    o.position.sub(bbh.box.center());
                });

                var conn = new Connector();
                conn.userData.name = currentObj.userData.name;
                conn.position.copy(bbh.box.center().clone());
                conn.add(currentObj);
                obj.add(conn);
                obj2.connectors.push(conn); 
            });
            
            scope.add(obj2, category, false, 1, 0.005);
        };
        
        this.addPackage = function(package, category){
            var params = [];
            params.push(package);
            var classes = dymolaInterface.callDymolaFunction("Playmola.GetComponents", params);
            for(var i = 0; i < classes.length; i++){
                if(classes[i].components.length > 0){
                    for(var j = 0; j < classes[i].components.length; j++){
                        if(classes[i].defaultValues[j].indexOf("start=") < 0){
                            var indexOfEquals = classes[i].defaultValues[j].indexOf('=');
                            var indexOfSemicolon = classes[i].defaultValues[j].indexOf(';', indexOfEquals);
                            var defaultValue = classes[i].defaultValues[j].substring(indexOfEquals+1, indexOfSemicolon);
                            classes[i].components[j].defaultvalue = defaultValue;
                        }
                        else{
                            var indexOfEquals = classes[i].defaultValues[j].indexOf('=');
                            var indexOfSemicolon = classes[i].defaultValues[j].indexOf(')', indexOfEquals);
                            var defaultValue = classes[i].defaultValues[j].substring(indexOfEquals+1, indexOfSemicolon);
                            classes[i].components[j].defaultvalue = defaultValue;
                        }
                    }
                    scope.addPreloadedClass(classes[i], category);
                }
            }
            
            
//            var classes = dymolaInterface.ModelManagement_Structure_AST_ClassesInPackageAttributes(package);
//            for(var i = 0; i < classes.length; i++){
//                if(classes[i].restricted != "package"){
//                    //This isn't a package, so load and add to the palette
//                    scope.addClass(classes[i].fullName,category);
//
//                }   
//            }
        };
        


        scope.loadParts();
        scope.loadDymolaBox();
        scope.loadDymolaCylinder();
        scope.loadRevoluteJoint();
//        scope.loadPrismaticJoint();
//        scope.loadRollingWheelJoint();
//        scope.loadFixedRotation();
//        scope.addClass("Modelica.Mechanics.MultiBody.World", "World");
//        scope.addPackage("Playmola.UserComponents", "Custom Components");
        //scope.loadDymolaCylinder();
        //scope.addPackage("Modelica.Mechanics.MultiBody.Parts", "DymolaParts");
        //scope.addPackage("Modelica.Mechanics.MultiBody.Joints", "Joints");

        
        //scope.addClass("Modelica.Mechanics.MultiBody.World", "World");
        //scope.addClass("Modelica.Mechanics.MultiBody.Joints.Revolute", "Joints");
        //scope.addClass("Modelica.Mechanics.Rotational.Components.Damper", "Damper");

        //scope.loadDymolaCylinder();
        //scope.addPackage("Modelica.Mechanics.MultiBody.Parts", "DymolaParts");
        //scope.addPackage("Modelica.Mechanics.Rotational.Components", "RotComponents");
        //scope.addPackage("Modelica.Mechanics.MultiBody.Joints", "Joints");
        
        
        
//        scope.addClass("Modelica.Mechanics.MultiBody.Joints.Revolute", "Joints");
//        scope.addClass("Modelica.Mechanics.Rotational.Components.Damper", "Damper");




    };
    Palette.prototype.constructor = THREE.Palette;

    //TO BE REMOVED!!!!
    function ConnectionPoint(position){
        
        this.position = new THREE.Vector3();
        this.position.copy(position);
        this.connectable = true;
        this.connectedTo = null; //The ConnectionPoint this is connected to
        this.parentObject = null; //The Object3D this is attached to
        this.coordinateSystem = new THREE.Matrix4();
        this.coordinateSystem.makeBasis(new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1)); //Default coordinate system
    }
    
    //Object to represent a modelica connector
    function Connector(){
        THREE.Object3D.call(this);
        this.connectedTo = null;
        this.type = "Connector";
        
        //Sometimes a connector's visual representation might not be at the 
        //same position/orientation as its physical representation
        this.actualPosition = new THREE.Vector3(); 
        this.actualOrientation = new THREE.Quaternion();
        
        this.getParent = function(){
            var component = null;
            this.traverseAncestors(function(anc){
               if(anc instanceof DymolaComponent)
                   component = anc;
            });
            return component;
        };
        
        this.clone = function(){
            var newConn = new Connector();
            THREE.Object3D.prototype.clone.call(this, newConn);
            newConn.actualPosition = this.actualPosition.clone();
            newConn.actualOrientation = this.actualOrientation.clone();
            return newConn;
        };
    }
    Connector.prototype = Object.create(THREE.Object3D.prototype);
    
    //This object holds two connectors and is visually represented by a line
    function Connection(A,B){
        THREE.Object3D.call(this);
        this.connectorA = A;
        A.connectedTo = B;
        this.connectorB = B;
        B.connectedTo = A;
        this.type = 'DymolaComponent';
        var scope = this;
        var line = new THREE.Mesh(new THREE.CylinderGeometry(0.01,0.01,1,10),new THREE.MeshBasicMaterial({color:0xffff00}));
        line.visible = false;
        scope.add(line);
       
        
//        this.clone = function(){
//            //TO DO
//        };
        
        //Updates the connection line
        this.update = function(){
            var startPos = scope.connectorA.position.clone();
            scope.connectorA.parent.localToWorld(startPos);

            var endPos = scope.connectorB.position.clone();
            scope.connectorB.parent.localToWorld(endPos);

            line.position.copy(startPos.clone().add(endPos).multiplyScalar(0.5));
            line.scale.y = startPos.distanceTo(endPos);
            line.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),endPos.clone().sub(startPos).normalize());
            line.visible = true;

        };
        
        //scope.update();
    }
    
    Connection.prototype = Object.create(THREE.Object3D.prototype);
    
    
    
    function DymolaComponent(){
        THREE.Object3D.call(this);
        this.typeName = null;
        this.connectors = [];
        this.parameters = [];
        this.type = 'DymolaComponent';
        var selfie = this;
        
        this.clone = function(){
            var newDymComp = new DymolaComponent();
            DymolaComponent.prototype.clone.call(selfie, newDymComp);
            newDymComp.typeName = selfie.typeName;
            
            newDymComp.connectors = [];
            
            newDymComp.traverse(function(currentObj){
                if(currentObj.type === "Connector")
                    newDymComp.connectors.push(currentObj);
            });
            
            newDymComp.parameters = $.extend(true, [], this.parameters);
            return newDymComp;
        };
    };
    DymolaComponent.prototype = Object.create(THREE.Object3D.prototype);
    
    //A Joint represents a revolute joint and the two DymolaComponents it is connected to
    //Used to enforce a joint's constraints in 3D mode
    function RevoluteJoint(){
        DymolaComponent.call(this);
        this.frameAConnector = null;
        this.frameBConnector = null;
        this.phi = 0;
        this.axis = new THREE.Vector3(0,0,1);
        this.type = "RevoluteJoint";
        this.animatePhi = null;
        
        this.clone = function(){
            var newRevolute = new RevoluteJoint();
            RevoluteJoint.prototype.clone.call(this, newRevolute);
            newRevolute.typeName = this.typeName;
            newRevolute.phi = this.phi;
            newRevolute.axis = this.axis.clone();
            newRevolute.connectors = [];
            
            newRevolute.traverse(function(currentObj){
                if(currentObj.type === "Connector"){
                    newRevolute.connectors.push(currentObj);
                    if(currentObj.userData.name === "frame_a")
                        newRevolute.frameAConnector = currentObj;
                    if(currentObj.userData.name === "frame_b")
                        newRevolute.frameBConnector = currentObj;
                }
            });
            
            newRevolute.parameters = $.extend(true, [], this.parameters);
            newRevolute.align();
            return newRevolute;
            
        };
        
        this.align = function(){
            this.children[0].quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0), this.axis);
        };
        
        this.enforceConstraint = function(){
            //Animate rotation
            if(this.animatePhi !== null && this.animatePhi.length > 0){
                this.phi = this.animatePhi.shift();
            }
            this.frameBConnector.actualOrientation.setFromAxisAngle(this.axis,this.phi);
        };
        
    }
    RevoluteJoint.prototype = Object.create(DymolaComponent.prototype);
    
    
    function PrismaticJoint(){
        DymolaComponent.call(this);
        this.frameAConnector = null;
        this.frameBConnector = null;
        this.translation = 0;
        this.axis = new THREE.Vector3(1,0,0);
        this.type = "PrismaticJoint";
        this.animateTranslation = null;
        
        this.clone = function(){
            var newPrismatic = new PrismaticJoint();
            PrismaticJoint.prototype.clone.call(this, newPrismatic);
            newPrismatic.typeName = this.typeName;
            newPrismatic.translation = this.translation;
            newPrismatic.axis = this.axis.clone();
            newPrismatic.connectors = [];
            
            newPrismatic.traverse(function(currentObj){
                if(currentObj.type === "Connector"){
                    newPrismatic.connectors.push(currentObj);
                    if(currentObj.userData.name === "frame_a")
                        newPrismatic.frameAConnector = currentObj;
                    if(currentObj.userData.name === "frame_b")
                        newPrismatic.frameBConnector = currentObj;
                }
            });
            
            newPrismatic.parameters = $.extend(true, [], this.parameters);
            newPrismatic.align();
            return newPrismatic;
            
        };
        
        this.align = function(){
            this.children[0].quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0), this.axis);
        };
        
        this.enforceConstraint = function(){
            //Animate translation
            if(this.animateTranslation !== null && this.animateTranslation.length > 0){
                this.translation = this.animateTranslation.shift();
            }
            this.frameBConnector.actualPosition.copy(this.axis.clone().multiplyScalar(this.translation));
        };
        
    }
    PrismaticJoint.prototype = Object.create(DymolaComponent.prototype);
    
    function RollingWheelJoint(){
        DymolaComponent.call(this);
        this.frameAConnector = null;
        this.frameBConnector = null;
        this.translation = 0;
        this.phi = 0;
        this.radius = 0;
        this.type = "RollingWheelJoint";
        this.animateTranslation = null;
        this.animatePhi = null;
        
        this.clone = function(){
            var newRollingWheel = new RollingWheelJoint();
            RollingWheelJoint.prototype.clone.call(this, newRollingWheel);
            newRollingWheel.typeName = this.typeName;
            newRollingWheel.translation = this.translation;
            newRollingWheel.phi = this.phi;
            newRollingWheel.connectors = [];
            
            newRollingWheel.traverse(function(currentObj){
                if(currentObj.type === "Connector"){
                    newRollingWheel.connectors.push(currentObj);
                    if(currentObj.userData.name === "frame_a")
                        newRollingWheel.frameAConnector = currentObj;
                    if(currentObj.userData.name === "frame_b")
                        newRollingWheel.frameBConnector = currentObj;
                }
            });
            
            newRollingWheel.parameters = $.extend(true, [], this.parameters);
            return newRollingWheel;
            
        };
        
        
        
        this.enforceConstraint = function(){
            //Animate translation
            if(this.animateTranslation !== null && this.animateTranslation.length > 0){
                this.translation = this.animateTranslation.shift();
            }
            //Animate rotation
            if(this.animatePhi !== null && this.animatePhi.length > 0){
                this.phi = this.animatePhi.shift();
            }
            this.frameBConnector.actualOrientation.setFromAxisAngle(new THREE.Vector3(0,0,1),this.phi);
            this.frameBConnector.actualPosition.set(this.translation,this.radius,0);
        };
        
    }
    RollingWheelJoint.prototype = Object.create(DymolaComponent.prototype);
    
    function FixedRotation(){
        DymolaComponent.call(this);
        this.frameAConnector = null;
        this.frameBConnector = null;
        this.translation = new THREE.Vector3();
        this.rotationAxis = new THREE.Vector3(0,0,1);
        this.rotationAngle = 0;
        
        this.clone = function(){
            var newFixedRotation = new FixedRotation();
            FixedRotation.prototype.clone.call(this, newFixedRotation);
            newFixedRotation.typeName = this.typeName;
            newFixedRotation.translation = this.translation.clone();
            newFixedRotation.rotationAxis = this.rotationAxis.clone();
            newFixedRotation.rotationAngle = this.rotationAngle;
            newFixedRotation.connectors = [];
            
            newFixedRotation.traverse(function(currentObj){
                if(currentObj.type === "Connector"){
                    newFixedRotation.connectors.push(currentObj);
                    if(currentObj.userData.name === "frame_a")
                        newFixedRotation.frameAConnector = currentObj;
                    if(currentObj.userData.name === "frame_b")
                        newFixedRotation.frameBConnector = currentObj;
                }
            });
            
            newFixedRotation.parameters = $.extend(true, [], this.parameters);
            return newFixedRotation;
            
        };
        
        this.updateFrames = function(){
            this.frameBConnector.actualPosition = this.translation.clone();
            this.frameBConnector.actualOrientation.setFromAxisAngle(this.rotationAxis, THREE.Math.degToRad(this.rotationAngle));
        };
    }
    FixedRotation.prototype = Object.create(DymolaComponent.prototype);
    
    function DymolaBox(length,width,height){
        DymolaComponent.call(this);
        var centeredMesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshLambertMaterial({color:0x00ff00}));
        this.mesh = new THREE.Object3D();
        this.mesh.add(centeredMesh);
        centeredMesh.position.set(0.5,0,0);
        this.add(this.mesh);
        centeredMesh.castShadow = true;
        this.frameAConnector = null;
        this.frameBConnector = null;
        this.length = length;
        this.width = width;
        this.height = height;
        this.lengthDirection = new THREE.Vector3(1,0,0);
        this.r = new THREE.Vector3(this.length,0,0);
        this.r_shape = new THREE.Vector3();
                
        var moi = this;
        
        this.clone = function(){
            var newDymBox = new DymolaBox(this.length,this.width,this.height);
            DymolaBox.prototype.clone.call(moi, newDymBox);
            newDymBox.remove(newDymBox.children[0]);
            newDymBox.typeName = this.typeName;
            newDymBox.length = this.length;
            newDymBox.width = this.width;
            newDymBox.height = this.height;
            newDymBox.lengthDirection = this.lengthDirection.clone();
            newDymBox.r = this.r.clone();
            newDymBox.r_shape = this.r_shape.clone();
            newDymBox.mesh = newDymBox.children[0];
            newDymBox.connectors = [];
            
            newDymBox.traverse(function(currentObj){
                if(currentObj.type === "Connector"){
                    newDymBox.connectors.push(currentObj);
                    if(currentObj.userData.name === "frame_a")
                        newDymBox.frameAConnector = currentObj;
                    if(currentObj.userData.name === "frame_b")
                        newDymBox.frameBConnector = currentObj;
                }
            });
            
            newDymBox.parameters = $.extend(true, [], this.parameters);
            newDymBox.resize();
            return newDymBox;
        };
        
        this.resize = function(){    
            this.mesh.scale.set(this.length,this.width,this.height);
            this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),this.lengthDirection);
            
        };
        
        this.updateFrames = function(){
            this.frameAConnector.position.set(0,0,0).sub(this.r_shape);
            this.frameAConnector.actualPosition = this.frameAConnector.position.clone();
            this.frameBConnector.position.copy(this.frameAConnector.position).add(this.r);
            this.frameBConnector.actualPosition = this.frameBConnector.position.clone();
        };
        
        this.resize();
    };
    
    DymolaBox.prototype = Object.create(DymolaComponent.prototype);
    
    function DymolaCylinder(){
        DymolaComponent.call(this);
        

        var centeredMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 16), new THREE.MeshLambertMaterial({color:0x00ff00}));
        this.mesh = new THREE.Object3D();
        this.mesh.add(centeredMesh);
        centeredMesh.position.set(0.5,0,0);
        centeredMesh.quaternion.setFromAxisAngle(new THREE.Vector3(0,0,1),THREE.Math.degToRad(90));
        this.add(this.mesh);
        centeredMesh.castShadow = true;
        this.frameAConnector = null;
        this.frameBConnector = null;
        this.length = 0.5;
        this.diameter = 0.5;
        this.lengthDirection = new THREE.Vector3(1,0,0);
        this.r = new THREE.Vector3(this.length,0,0);
        this.r_shape = new THREE.Vector3();
        
        var moi = this;
        this.clone = function(){
            var newDymCyl = new DymolaCylinder();
            DymolaCylinder.prototype.clone.call(moi, newDymCyl);
            newDymCyl.remove(newDymCyl.children[0]);
            newDymCyl.typeName = this.typeName;
            newDymCyl.mesh = newDymCyl.children[0];
            newDymCyl.length = this.length;
            newDymCyl.diameter = this.diameter;
            newDymCyl.numOfRadiusSeg = this.numOfRadiusSeg;
            newDymCyl.typeName = this.typeName;
            newDymCyl.lengthDirection = this.lengthDirection.clone();
            newDymCyl.r = this.r.clone();
            newDymCyl.r_shape = this.r_shape.clone();
            
            newDymCyl.connectors = [];
            
            newDymCyl.traverse(function(currentObj){
                if(currentObj.type === "Connector"){
                    newDymCyl.connectors.push(currentObj);
                    if(currentObj.userData.name === "frame_a")
                        newDymCyl.frameAConnector = currentObj;
                    if(currentObj.userData.name === "frame_b")
                        newDymCyl.frameBConnector = currentObj;
                }
            });
            
          newDymCyl.parameters = $.extend(true,[], this.parameters);
          newDymCyl.resize();
          return newDymCyl;
        };
        
        this.resize = function(){    
            this.mesh.scale.set(this.length,this.diameter,this.diameter);
            this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),this.lengthDirection);
            
        };
        
        this.updateFrames = function(){
            this.frameAConnector.position.set(0,0,0).sub(this.r_shape);
            this.frameAConnector.actualPosition = this.frameAConnector.position.clone();
            this.frameBConnector.position.copy(this.frameAConnector.position).add(this.r);
            this.frameBConnector.actualPosition = this.frameBConnector.position.clone();
        };

    };
    
    DymolaCylinder.prototype = Object.create(DymolaComponent.prototype);
    
    function loadDymolaComponent(componentString){
        var component = new DymolaComponent();
        var exportModelSource = dymolaInterface.exportWebGL(componentString);
        var temp = new Function(exportModelSource)();
        component.add(temp);
        component.scale.set(0.005,0.005,0.005);
        
        component.traverse(function(obj){
           if(obj.userData.isConnector === true){
               component.connectors.push(obj);
           }
        });
//        var subcomponents = dymolaInterface.Dymola_AST_ComponentsInClass(componentString);
//        for(var i = 0; i < subcomponents.length; i++){
//            var subcomponentAttribute = dymolaInterface.ModelManagement_Structure_AST_GetComponentAttributes(componentString, subcomponents[i]);
//            if(subcomponentAttribute.fullTypeName.indexOf("Interfaces") != -1){
//                component.connectors.push(subcomponentAttribute.fullTypeName);
//            }
//        }
        
        dymolaComponentStorage[componentString] = component;
    }
   
    
    function init(){
        
        
        
        
        try{
            dymolaInterface = new DymolaInterface();
            if(!dymolaInterface.isDymolaRunning()){
                alert("Dymola interface initialization failed");
            }
        }
        catch(err){
            alert("Dymola interface initialization failed");
        }
        renderer = new THREE.WebGLRenderer({antialias:true});
        renderer.shadowMapEnabled = true;
        renderer.shadowMapType=THREE.PCFSoftShadowMap;
        renderer.setClearColor( 0x7EC0EE, 1 );
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.autoClear = false;
        document.querySelector("#container").appendChild(renderer.domElement);

        camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,1000);
        camera.position.set(0,0.25,4);
        
        
        $(renderer.domElement).on('mousedown',function(event){
            if(event.button == 0)
                leftMouseDown = true;
        });
        $(renderer.domElement).on('mouseup',function(event){
            if(event.button == 0)
                leftMouseDown = false;
        });
        
        palette = new Palette(renderer.domElement);   
        
        audio = new PlaymolaAudio();


        $(renderer.domElement).on('mousemove', function(event){
            if(draggingConnection){
                event.stopImmediatePropagation();
                dragConnection(event);
            }
        });
        
        $(renderer.domElement).on('mouseup', function(event){
            if(draggingConnection){
                event.stopImmediatePropagation();
                completeConnection(event);
            }
        });
        
        $(document).bind('keydown', function(e) {
            if(e.keyCode == 13){ //enter
		var source = generateModelicaCode();
                
                try{

                    if(dymolaInterface.setClassText("", source)){
                        dymolaInterface.simulateModel("TestModel",0,5,0,0,"Dassl", 0.0001,0.0, "testmodelresults");
                        joints.forEach(function(j){
                            var times = [];
                            for(var i = 0; i <= 5; i+=1/60)
                                times.push(i);
                            if(j.type === "RevoluteJoint"){
                                var phis = dymolaInterface.interpolateTrajectory("testmodelresults.mat",new Array(j.name + ".phi"),times);
                                j.animatePhi = phis[0];
                            } 
                            else if (j.type === "PrismaticJoint"){
                                var translations = dymolaInterface.interpolateTrajectory("testmodelresults.mat",new Array(j.name + ".s"),times);
                                j.animateTranslation = translations[0];
                            }
                            else if (j.type === "RollingWheelJoint"){
                                var translations = dymolaInterface.interpolateTrajectory("testmodelresults.mat",new Array(j.name + ".prismatic.s"),times);
                                j.animateTranslation = translations[0];
                                var phis = dymolaInterface.interpolateTrajectory("testmodelresults.mat",new Array(j.name + ".revolute.phi"),times);
                                j.animatePhi = phis[0];
                            }
                        });
                        
                    }

                }
                catch(err)
                {
                    console.log(err.message);
                }
                
            }
            else if (e.keyCode == 46){ //delete
                if(selectedObject !== null){

                    for(var i = 0; i < connections.length; i++){
                        if(connections[i].connectorA.getParent() === selectedObject || connections[i].connectorB.getParent() === selectedObject){
                            connections[i].connectorA.connectedTo = null;
                            connections[i].connectorB.connectedTo = null;
                            scene.remove(connections[i]);
                            connections.splice(i,1);
                            i--;
                        }
                    }
                    objectCollection.splice(objectCollection.indexOf(selectedObject),1);
                    scene.remove(selectedObject);
                    
                    if(joints.indexOf(selectedObject) != -1){
                        joints.splice(joints.indexOf(selectedObject),1);
                    }
                    deselectObject();
                    
                }
            }
            else if (e.keyCode == 36){ //home
                camera.position.set(0,0.25,4);
            }
        });
        
        
        transformControls = new CustomTransformControls(camera, renderer.domElement,new THREE.Box3(new THREE.Vector3(-5,-2.5,-5), new THREE.Vector3(5,2.5,5)));
       
        
        scene = new THREE.Scene();
        //scene.add(camera);
        //scene.add(transformControls);
        foregroundScene = new THREE.Scene();
        
        var directionalLight = new THREE.DirectionalLight();
        directionalLight.position.set(5,10,10);
        directionalLight.intensity = 0.5;
        directionalLight.castShadow = true;
        directionalLight.shadowCameraNear = 5;
        directionalLight.shadowCameraFar = 30;
        directionalLight.shadowCameraLeft = -10; 
        directionalLight.shadowCameraRight = 10;
        directionalLight.shadowCameraTop = 10;
        directionalLight.shadowCameraBottom = -10;
        directionalLight.shadowBias = 0.0003;
        directionalLight.shadowDarkness = 0.5;
        directionalLight.shadowMapWidth = 1024;
        directionalLight.shadowMapHeight = 1024;
        scene.add(directionalLight);
        
        directionalLight = new THREE.DirectionalLight();
        directionalLight.position.set(5,10,-10);
        directionalLight.intensity = 0.5;
        directionalLight.castShadow = false;
        scene.add(directionalLight);
        
        directionalLight = new THREE.DirectionalLight();
        directionalLight.position.set(1,1,1);
        directionalLight.intensity = 0.5;
        directionalLight.castShadow = false;
        foregroundScene.add(directionalLight);

        
        scene.add(new THREE.AmbientLight(new THREE.Color(0.1,0.1,0.1)));
        
        raycaster = new THREE.Raycaster();
        mousePos = new THREE.Vector2(-1,-1);
        
        window.addEventListener('mousemove', onMouseMove, false);
        
//        $(document).on('mousemove', function(event){
//            onMouseMove(event);
//        });
        
        $(document).on('mouseup', function(event){
            onMouseUp(event);
            mouseMovedSinceMouseDown = false;
        });
        
        $(renderer.domElement).on('mousedown', function(event){
            mouseMovedSinceMouseDown = false;
            if(event.button == 0 && intersectionTest() === true){
                event.preventDefault();
                event.stopImmediatePropagation();
                event.stopPropagation();
                return false;
            }
 
        });
        
        $(renderer.domElement).on('mousemove', function(event){
            if(!mouseMovedSinceMouseDown && selectedObject && leftMouseDown){
                HighlightCompatibleConnectors(selectedObject);
            }
            if(leftMouseDown && selectedObject){
                var widthHalf = window.innerWidth / 2;
                var heightHalf = window.innerHeight / 2;

                var thisConnector = null;
                var closestConnector = null;
                var distance = 10000000;

                selectedObject.connectors.forEach(function(c){
                    var cPos = c.position.clone();
                    c.parent.localToWorld(cPos);
                    cPos.project(camera);
                    cPos.x = ( cPos.x * widthHalf ) + widthHalf;
                    cPos.y = - ( cPos.y * heightHalf ) + heightHalf;
                    cPos.z = 0;
                    var closest = checkForConnection(cPos, selectedObject);
                    if(closest !== null && c.connectedTo !== closest && closest.userData.tempDistSquared < distance){
                        closestConnector = closest;
                        distance = closest.userData.tempDistSquared;
                        thisConnector = c;
                    }
                });
                HighlightOverlappedConnector(closestConnector);
            }
            mouseMovedSinceMouseDown = true;
        });

        window.addEventListener('resize', onWindowResize, false);
        

        cameraControls = new CustomCameraControls(camera, renderer.domElement, new THREE.Box3(new THREE.Vector3(-5,-2.5,-5), new THREE.Vector3(5,2.5,5)), new THREE.Vector3(0,0,0));
        loadDymolaComponent(revoluteJoint);
//        loadDymolaComponent(prismaticJoint);
//        loadDymolaComponent(cylindricalJoint);

        
        
        
        //Add some scenery!
//        var room = new THREE.Mesh(new THREE.BoxGeometry(10,5,10), new THREE.MeshLambertMaterial({color: 0xffffff, side: THREE.DoubleSide }));
//        room.receiveShadow = true;
//        room.castShadow = false;
//        scene.add(room);
//        var desk = new THREE.Mesh(new THREE.BoxGeometry(1.5,0.5,0.75), new THREE.MeshLambertMaterial({color: 0xccaa22 }));
//        desk.position.set(0,-2.25,0);
//        desk.castShadow = true;
//        desk.receiveShadow = true;
//        scene.add(desk);


 
        
        var jsonloader = new THREE.JSONLoader();
        
        jsonloader.load( "models/room.json", function(geometry, mat) {
            var materials = new THREE.MeshFaceMaterial(mat);
            var room = new THREE.Mesh(geometry, materials );
            room.receiveShadow = true;
            room.castShadow = false;
            scene.add(room);
        });
        
        jsonloader.load("models/desk.json", function(geometry,mat){
            var desk = new THREE.Mesh(geometry, mat[0]);
            desk.position.set(0,-1.05,0);
            desk.castShadow = true;
            desk.receiveShadow = true;
            scene.add(desk);
        }, "models/");
        

        var pointlight = new THREE.PointLight(0xffffff, 1, 10);
        pointlight.position.set(0,2,0);
        scene.add(pointlight);
    }
    
    function initParticleSystem(origin){
        if(particleGroup)
            scene.remove(particleGroup.mesh);
        particleGroup = new SPE.Group({
                texture : THREE.ImageUtils.loadTexture('particle.png'),
                transparent : false,
                depthWrite : true,
                maxAge: 2
        });

        var emitter = new SPE.Emitter({
                position: origin,
                positionSpread: new THREE.Vector3( 0, 0, 0 ),

                acceleration: new THREE.Vector3(0, -1, 0),
                accelerationSpread: new THREE.Vector3( 1, 0, 1 ),

                velocity: new THREE.Vector3(0, 1, 0),
                velocitySpread: new THREE.Vector3(1, .5, 1),

                colorStart: new THREE.Color('white'),
                colorEnd: new THREE.Color('red'),

                sizeStart: 0.1,
                sizeEnd: 0.02,

                particleCount: 100
        });

        particleGroup.addEmitter( emitter );
        scene.add( particleGroup.mesh );
        audio.playWelding();
    }
    
    function shutdownParticleSystem(){
        scene.remove(particleGroup.mesh);
        particleGroup = null;
        audio.stopWelding();
    }
    
    
    
    function loadModel(object, centerOfMass, connectionPoints){
        //Extract the part of the Object3D containing the meshes and puts it in a 
        //new object positioned at the center of mass
        var obj = new DymolaComponent();
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
            
            var connPoint = new Connector();
            connPoint.add(new THREE.Mesh(new THREE.SphereGeometry(0.1,20,20),new THREE.MeshPhongMaterial({color:0xff0000})));
            
            connPoint.position.copy(connectionPoints[i].position.clone().sub(centerOfMass));
            connPoint.userData.isConnector = true;
            connPoint.userData.name = "ADD_ME_LATER";
            obj.add(connPoint);
            obj.connectors.push(connPoint);
            
            
            
            
            //connectionPoints[i].position = v;
            connectionPoints[i].parentObject = obj; //Record the Object3D this ConnectionPoint is attached to for future reference!
        }

        return obj;
    }
    
    //Resets the camera and renderer when the window is resized
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
        palette.resize();
    }
    
    function saveColor(object){
        if(object.hasOwnProperty('material'))
            object.userData.initColor = object.material.color;
        object.children.forEach(function(child){
            saveColor(child);
        });
    }
    
    
    function onMouseMove(event) {
	mousePos.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mousePos.y = - ( event.clientY / window.innerHeight ) * 2 + 1;	
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
//            if(intersectionFound !== null && intersectionFound.userData.isConnector === true){
//                selectObject(intersectFound);
//                return true;
//            }
            //Check if the intersected  object was a DymolaComponent and check if the intersection was on a connector
            if(intersectionFound !== null && intersectionFound.type == 'DymolaComponent' || intersectionFound instanceof DymolaComponent){
                //Loop through the connectors to see if one is intersected
                var connectorPicked = false;
                for(var i = 0; i < intersectionFound.connectors.length; i++){
                    if(raycaster.intersectObject(intersectionFound.connectors[i],true).length > 0){
                        connectorPicked = true;
                        draggingConnection = true;
                        draggingFrom = intersectionFound.connectors[i];
                        break;
                    }
                }
                if(connectorPicked) return true;
            }
            //Don't reselect the currently selected object
            if(intersectionFound === selectedObject && selectedObject !== null){
                //transformControls.forceDrag();
                return true;
            }
            //Deselect the selected object if there is one
            if(selectedObject !== null) 
                deselectObject();
            //Select the new object
            if(intersectionFound !== null){
                selectObject(intersectionFound);
                //transformControls.forceDrag();
                return true;
            }
            return false;
        }
    }
    
    function dragConnection(event){
        if(draggingConnection){
            if(foregroundConnectors.length == 0){
                HighlightCompatibleConnectors(draggingFrom);
            }
            
            var startPos = draggingFrom.position.clone();
            draggingFrom.parent.localToWorld(startPos);

            var endPos = new THREE.Vector3();
            var lookAt = new THREE.Vector3(0,0, -1).applyQuaternion(camera.quaternion);
            raycaster.setFromCamera(new THREE.Vector2(( event.clientX / renderer.domElement.getBoundingClientRect().width ) * 2 - 1, - ( event.clientY / renderer.domElement.getBoundingClientRect().height ) * 2 + 1), camera);
            var projPlane = new THREE.Plane(lookAt);
            projPlane.intersectLine(new THREE.Line3(camera.position, camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(100.0))),endPos);

            if(connectionLine === null){
                connectionLine = new THREE.Mesh(new THREE.CylinderGeometry(0.01,0.01,1,10),new THREE.MeshBasicMaterial({color:0xff0000}));
                scene.add(connectionLine);
            }
            
            var closest = checkForConnection(new THREE.Vector3(event.clientX, event.clientY, 0));
            HighlightOverlappedConnector(closest);
            if(closest !== null)
                connectionLine.material.color.setHex(0xffff00);
            else
                connectionLine.material.color.setHex(0xff0000);
            
            connectionLine.position.copy(startPos.clone().add(endPos).multiplyScalar(0.5));
            connectionLine.scale.y = startPos.distanceTo(endPos);
            connectionLine.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),endPos.clone().sub(startPos).normalize());        
            

            
        }
    }
    
    function checkForConnection(position, toExclude){
        var widthHalf = window.innerWidth / 2;
        var heightHalf = window.innerHeight / 2;
        var distance = 1000000;
        var closest = null;

        for(var i = 0; i < objectCollection.length; i++){
            //if(objectCollection[i].type == 'DymolaComponent'){
                for(var j = 0; j < objectCollection[i].connectors.length; j++){
                    //If an object to be excluded has been specified, skip its connectors
                    if(toExclude !== undefined && toExclude == objectCollection[i]) break;
                    //Don't allow connecting a connector to itself
                    if(objectCollection[i].connectors[j] !== draggingFrom){
                        //Get the screen position of the connector
                        var connectorScreenPos = objectCollection[i].connectors[j].position.clone();
                        objectCollection[i].connectors[j].parent.localToWorld(connectorScreenPos);
                        connectorScreenPos.project(camera);
                        connectorScreenPos.x = ( connectorScreenPos.x * widthHalf ) + widthHalf;
                        connectorScreenPos.y = - ( connectorScreenPos.y * heightHalf ) + heightHalf;
                        connectorScreenPos.z = 0;
                        var distSquared = position.distanceToSquared(connectorScreenPos);
                        if(distSquared < 400 && distSquared < distance){
                            distance = distSquared;
                            closest = objectCollection[i].connectors[j];
                            closest.userData.tempDistSquared = distSquared;
                        }
                    }
                }
            //}
        }
        return closest;
    }
    
    //If a connection line is being drawn and the mouse button is released, check for a potential connection
    function completeConnection(event){
        if(draggingConnection){
            scene.remove(connectionLine);
            connectionLine = null;
            
            var closest = checkForConnection(new THREE.Vector3(event.clientX, event.clientY, 0));
            
            if(closest !== null){
                var connection = new Connection(draggingFrom, closest);
                connections.push(connection);
                scene.add(connection);
                audio.playClick();
            }
            
            draggingConnection = false;
            draggingFrom = null;
            transformControls.dragging = false;
            ClearForegroundScene();
        }
    }
    
    //Needs a lot of work......
    function AreConnectorsCompatible(c1,c2){
        if(c1.userData.name == "frame_a"){
            if(c2.userData.name == "frame_b")
                return true;
            return false;
        }
        if(c1.userData.name == "frame_b"){
            if(c2.userData.name == "frame_a")
                return true;
            return false;
        }
        if(c2.userData.name == "frame_a"){
            if(c1.userData.name == "frame_b")
                return true;
            return false;
        }
        if(c2.userData.name == "frame_b"){
            if(c1.userData.name == "frame_a")
                return true;
            return false;
        }
        return true;
    }
    
    function HighlightSelectableConnectors(){
        
    }
    
    function HighlightCompatibleConnectors(dymolaComponent){
        if(dymolaComponent instanceof Connector){
            objectCollection.forEach(function(o){
                if(o !== dymolaComponent.getParent()){
                    o.connectors.forEach(function(c){
                        
                        if(AreConnectorsCompatible(c,dymolaComponent)){

                            //Make a sphere:
                            var sphere = new THREE.Mesh( new THREE.SphereGeometry(0.1, 20,20), new THREE.MeshPhongMaterial( {color: 0xff00ff, opacity: 0.5, transparent: true} ) );                     
                            sphere.position.copy(c.position);
                            c.parent.localToWorld(sphere.position);
                            foregroundScene.add(sphere);
                            foregroundConnectors.push(sphere);

                            c.foregroundBuddy = sphere;
                        }
                    });
                }
            });
        }
        else {
            objectCollection.forEach(function(o){
                if(o !== dymolaComponent){
                    o.connectors.forEach(function(c){
                        for(var i = 0; i < dymolaComponent.connectors.length; i++){
                            if(AreConnectorsCompatible(c,dymolaComponent.connectors[i]) && c.connectedTo !== dymolaComponent.connectors[i]){

                                //Make a sphere:
                                var sphere = new THREE.Mesh( new THREE.SphereGeometry(0.1, 20,20), new THREE.MeshPhongMaterial( {color: 0xff00ff, opacity: 0.5, transparent: true} ) );                     
                                sphere.position.copy(c.position);
                                c.parent.localToWorld(sphere.position);
                                foregroundScene.add(sphere);
                                foregroundConnectors.push(sphere);

                                c.foregroundBuddy = sphere;

                                break;
                            }
                        }
                    });
                }
            });
        }
    }
    
    function HighlightOverlappedConnector(connector){
        foregroundConnectors.forEach(function(c){
            c.material.opacity = 0.5;
            c.material.color.setHex(0xff00ff);
        });
        if(connector !== null && connector.foregroundBuddy !== undefined){
            connector.foregroundBuddy.material.opacity = 1.0;
            connector.foregroundBuddy.material.color.setHex(0x00ff00);
        }
    }
    
    function ClearForegroundScene(){
        foregroundConnectors.forEach(function(c){
            foregroundScene.remove(c);
        });
        foregroundConnectors.length = 0;
    }
    
    var numOfDetailElements = 3;
    function selectObject(object){
        if(selectedObject !== null){
            deselectObject();
        }
        selectedObject = object;
        initParticleSystem(object.position);
        transformControls.attach(selectedObject);
        transformControls.dragging = true;
        
        
        selectedObject.traverse(function(child){
            if(child instanceof THREE.Mesh){
                if(child.userData.initColor === undefined)
                    child.userData.initColor = child.material.color;
                child.material.color = new THREE.Color(0xB0E2FF);
             }
        });
        if(selectedObject instanceof DymolaComponent){
            $("#detailsPanel").css({"overflow-y":"auto"});
            $("#detailsPanel").panel("open");
            for(var i = 0; i < selectedObject.parameters.length; i++){
                generateNewDetailsForm(selectedObject.parameters[i]);
            }
            $("#detailsPanel").enhanceWithin();
        }
    }
    
    function generateNewDetailsForm(parameter){
        var id = "id"+parameter.name;
        $("#parameters").append('<div id="' + id +'_" style="padding-bottom:5px">');
        $("#"+id+"_").append('<label for="'+id+'">'+ parameter.name + '' +'</label>'); 
        var value = (typeof parameter.currentValue !== 'undefined') ? 'value="' + parameter.currentValue + '"' : "";
        if(parameter.fullTypeName === "Boolean"){
            $("#"+id+"_").append('<span><input name="' + id + '" id="' + id + '" type="checkbox" data-role="none" data-mini="true"></span>');
        }
        else if(parameter.fullTypeName === "Real" && parameter.sizes[0] === 3){
            $("#"+id+"_").append('<span><input name="' + id + '" id="' + id + '" placeholder="x,y,z"' + value + ' data-mini="true" data-role="none"></span>');
        }
        else{
            $("#"+id+"_").append('<span><input name="' + id + '" id="' + id + '"' + value + ' data-mini="true" data-role="none"></span>');
        }
        $("#"+id+"_").append('<div class="clear"></div>');
        //$("#"+id+"_").append('<a href="#popup' + parameter.name + '" data-rel="popup" class="ui-btn ui-corner-all ui-shadow ui-btn-inline" data-transition="pop">?</a><div data-role="popup" id="popup' + parameter.name + '"><p>' + parameter.description + '</p></div>');
        if(parameter.fullTypeName === "Boolean"){
            $("#"+id).change(function(){
               parameter.currentValue = this.checked; 
               parameter.changed = true;
               if(parameter.callback !== undefined)
                   parameter.callback.call(selectedObject, parameter.currentValue);
            });
        }
        else{
            $("#"+id).on('input', function(){
               parameter.currentValue = $(this).val();
               parameter.changed = true;
               if(parameter.callback !== undefined)
                   parameter.callback.call(selectedObject, parameter.currentValue);
            });
        }
        $("#detailsPanel").enhanceWithin();
        
        //alert($("#parameters").html());
        //alert($("#"+id+"_ label").attr('class'));
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
        
    }
    
    function deselectObject(){
        $("#detailsPanel").panel("close");
        if(selectedObject)
        {
            selectedObject.traverse(function(child){
               if(child instanceof THREE.Mesh)
                   child.material.color = child.userData.initColor;
            });
            transformControls.detach(selectedObject);
            selectedObject = null;
            shutdownParticleSystem();
        }
    } 
    
    var connectorFrom, connectorTo;
    
    function onMouseUp(event){
        ClearForegroundScene();
        if(event.button == 0 && selectedObject && mouseMovedSinceMouseDown){
            
            
            
            var widthHalf = window.innerWidth / 2;
            var heightHalf = window.innerHeight / 2;

            var thisConnector = null;
            var closestConnector = null;
            var distance = 10000000;

            selectedObject.connectors.forEach(function(c){
                var cPos = c.position.clone();
                c.parent.localToWorld(cPos);
                cPos.project(camera);
                cPos.x = ( cPos.x * widthHalf ) + widthHalf;
                cPos.y = - ( cPos.y * heightHalf ) + heightHalf;
                cPos.z = 0;
                var closest = checkForConnection(cPos, selectedObject);
                if(closest !== null && c.connectedTo !== closest && closest.userData.tempDistSquared < distance){
                    closestConnector = closest;
                    distance = closest.userData.tempDistSquared;
                    thisConnector = c;
                }
            });
            

            if(closestConnector !== null && thisConnector !== null){
                //Make a new joint, then set up the connections
//                var connection = new Connection(, closest);
//                connections.push(connection);
//                scene.add(connection);
                if(thisConnector.userData.name == "frame_b"){
                    connectorFrom = thisConnector;
                    connectorTo = closestConnector;
                } else {
                    connectorTo = thisConnector;
                    connectorFrom = closestConnector;
                }
                $( "#jointPopup" ).popup('open');
            }
            

        }
    }
    
    this.connectObjects = function(jointType){
        if(jointType == "none"){
            var connection = new Connection(connectorFrom, connectorTo);
            connections.push(connection);
            scene.add(connection);
            audio.playClick();
        } else {
            var joint = palette.makeComponent("Joints", jointType);
            if(joint != null){
                joint.position.set(0,0,0);//CHANGE THIS!!
                var connection1 = new Connection(connectorFrom, joint.frameAConnector);
                connections.push(connection1);
                scene.add(connection1);
                var connection2 = new Connection(joint.frameBConnector, connectorTo);
                connections.push(connection2);
                scene.add(connection2);
                audio.playClick();
            }
        }
    };
    
//    function onMouseMover(){
//        if(selectedObject && transformControls.dragging){
//            //Highlight possible connections
//        }
//    }

    this.cancelConnectObjects = function(){
        disableControls = false;
        //selectObject(selectedObject);
        transformControls.dragging = false;
    }
    
    this.enterSchematicMode = function(){
        //Loop through all objects and push apart
//        for(var i = 0; i < objectCollection.length; i++){
//            if(objectCollection[i].group === undefined){
//                //Do nothing, since this isn't a group
//            } else {
//                //This is a group, move objects apart along the axes of their connection points
//                //Start with one object and traverse connections:
//                schematicPushApart(objectCollection[i].children[0], null, new THREE.Vector3(0,0,0));
//            }
//        }
        
//        for(var i = 0; i < joints.length; i++){
//            joints[i].visible = true;
//        }
        schematicMode = true;
        
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
//        for(var i = 0; i < objectCollection.length; i++){
//            if(objectCollection[i].group === undefined){
//                //Do nothing, since this isn't a group
//            } else {
//                //Return the group's children to their original positions
//                for(var j = 0; j < objectCollection[i].children.length; j++){
//                    objectCollection[i].children[j].userData.targetPosition = objectCollection[i].children[j].userData.oldPosition.clone();
//                    movingObjects.push(objectCollection[i].children[j]);
//                }
//                for(var j = 0; j < joints.length; j++){
//                    joints[j].userData.targetPosition = joints[j].userData.oldPosition.clone();
//                    movingObjects.push(joints[j]);
//                }
//            }
//        }

        schematicMode = false;
    };
    function logic() {
        //moveObjects();
        
        if(!disableControls){
            cameraControls.update();
        }
        transformControls.update();
        palette.update();
        
        
        if(!schematicMode){
            joints.forEach(function(j){
               j.enforceConstraint(); 
               //j.animationUpdatedThisFrame = false;
            });
            
            //Enforce CONNECTION constraints here:
            if(world != null){
                world.connectors.forEach(function(c){
                    resolveConnection(c);
                });
            }


            
        }
        
        connections.forEach(function(c){
            c.update();
        });
        
        requestAnimationFrame(render);
    }
    
    function resolveConnection(c){
        if(c.userData.name == "frame_b" && c.connectedTo !== null && c.connectedTo !== undefined && c.connectedTo.userData.name == "frame_a"){

            //Rotate the object connected to frame B
            var q = c.getParent().quaternion.clone();
            q.multiply(c.actualOrientation);
            q.multiply(c.connectedTo.actualOrientation);
            c.connectedTo.getParent().quaternion.copy(q);
            c.connectedTo.getParent().updateMatrixWorld(true);
            
            //Move the object connected to frame B
            var connAWorld = c.actualPosition.clone().multiplyScalar(1/c.getParent().scale.x); //FIX SCALE HERE!
            c.getParent().localToWorld(connAWorld);
            var connBWorld = c.connectedTo.actualPosition.clone().multiplyScalar(1/c.connectedTo.getParent().scale.x);
            c.connectedTo.getParent().localToWorld(connBWorld);
            c.connectedTo.getParent().position.sub(connBWorld.sub(connAWorld));
            c.connectedTo.getParent().updateMatrixWorld(true);
            
            c.connectedTo.getParent().connectors.forEach(function(c_){
                if(c_ !== c.connectedTo)
                    resolveConnection(c_);
            });
        }
    }
    
    function render(){
        renderer.clear();
        if(particleGroup)
            particleGroup.tick();
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

