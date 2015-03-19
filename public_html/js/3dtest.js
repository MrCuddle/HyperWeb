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
    
    
    //DymolaComponent Connection-related:
    var draggingConnection = false;
    var draggingFrom = null; //The Connector the connection line starts at
    var connectionLine = null; //A line representing the connection being dragged
    var connections = []; //An array of connections - consists of a line and data about the connectors involved
       
   
    
    var mousePos;
    var disableControls = false;
    var schematicMode = false;
    
    var palette; //palette of 3D models to add to the scene
    var dymolaInterface;
    
    var loader = new THREE.VRMLLoader();
    
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

    function generateModelicaCode(){  
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
        alert(source);
        return source;
    }
    
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
                    
                    //Materials are not cloned, so do it manually here...
                    dragging.traverse(function(o){
                        if(o.material !== undefined) o.material = o.material.clone();
                    });
                    
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
        var objCounter = 0;
        $(domElement).on('mouseup',function(event){
            if(dragging !== null){
                //Spawn object here
                scope.palettescene.remove(dragging);
                
                objectCollection.push(dragging);
                scene.add(dragging);
                dragging.name = "Obj" + objCounter;
                objCounter++;
                
                if(dragging.typeName === "Modelica.Mechanics.MultiBody.World") dragging.name = "world";
                if(dragging.type === "RevoluteJoint") joints.push(dragging);

                dragging.scale.set(dragging.userData.sceneScale,dragging.userData.sceneScale,dragging.userData.sceneScale);
                raycaster.setFromCamera(new THREE.Vector2(( event.clientX / domElement.getBoundingClientRect().width ) * 2 - 1, - ( event.clientY / domElement.getBoundingClientRect().height ) * 2 + 1), camera);
                var projPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0,0, -1).applyQuaternion(camera.quaternion),new THREE.Vector3());
                projPlane.intersectLine(new THREE.Line3(camera.position, camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(100.0))),dragging.position);
                dragging.children[0].position.add(dragging.userData.centerOffset);               
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
            })
           
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
                    dymBox.parameters.push(componentParam);
                }
            }
            
            var connPoint1 = new Connector();
            connPoint1.add(new THREE.Mesh(new THREE.SphereGeometry(0.1,20,20),new THREE.MeshPhongMaterial({color:0xff0000})));
            var connPoint2 = new Connector();
            connPoint2.add(new THREE.Mesh(new THREE.SphereGeometry(0.1,20,20),new THREE.MeshPhongMaterial({color:0xff0000})));
            connPoint1.position.set(-dymBox.length/2,0,0);
            connPoint1.userData.name = "frame_a";
            dymBox.add(connPoint1);
            dymBox.connectors.push(connPoint1);
            connPoint2.position.set(dymBox.length/2,0,0);
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
                    dymCyl.parameters.push(componentParam);
                }
            }
            dymCyl.length = 0.5;
            dymCyl.diameter = 0.1;
            dymCyl.parameters.forEach(function(entry){
                if(entry.name === "length"){
                    entry.currentValue = dymCyl.length;
                    entry.changed = true;
                }
                else if(entry.name ==="diameter"){
                    entry.currentValue = dymCyl.diameter;
                    entry.changed = true;
                }
            });
            var geometry = new THREE.CylinderGeometry(dymCyl.diameter * 0.5, dymCyl.diameter * 0.5, dymCyl.length, dymCyl.numOfRadiusSeg);
            var material = new THREE.MeshLambertMaterial({color:0x00ff00});
            var mesh = new THREE.Mesh(geometry, material);
            dymCyl.mesh = mesh;
            dymCyl.add(mesh);
            scope.add(dymCyl, "Bodies", true, 0, 1);
        };
        
        this.loadRevoluteJoint = function(){
            if(categories["Joints"] === undefined){
                scope.addCategory("Joints");
            }
            
            var exportModelSource = dymolaInterface.exportWebGL("Modelica.Mechanics.MultiBody.Joints.Revolute");
            var obj = new Function(exportModelSource)();
            //Remove TextGeometry
            for(var j = 0; j < obj.children.length; j++){
                if(obj.children[j].type == 'Mesh' && obj.children[j].geometry.type == 'TextGeometry'){
                    obj.remove(obj.children[j]);
                    j--;
                }
            }
            var obj2 = new RevoluteJoint();
            obj2.typeName = "Modelica.Mechanics.MultiBody.Joints.Revolute";
            var componentsInClass = dymolaInterface.Dymola_AST_ComponentsInClass("Modelica.Mechanics.MultiBody.Joints.Revolute");

            for(var j = 0; j < componentsInClass.length; j++){
                var params = [];
                params.push("Modelica.Mechanics.MultiBody.Joints.Revolute");
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
                if(classes[i].components.length > 0)
                    scope.addPreloadedClass(classes[i], category);
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
        


        //scope.loadParts();
        scope.loadDymolaBox();
        scope.loadRevoluteJoint();
        //scope.loadDymolaCylinder();
        //scope.addPackage("Modelica.Mechanics.MultiBody.Parts", "DymolaParts");
        //scope.addPackage("Modelica.Mechanics.MultiBody.Joints", "Joints");

        
        //scope.addClass("Modelica.Mechanics.MultiBody.World", "World");
        //scope.addClass("Modelica.Mechanics.MultiBody.Joints.Revolute", "Joints");
        //scope.addClass("Modelica.Mechanics.Rotational.Components.Damper", "Damper");

        //scope.loadDymolaCylinder();
        scope.addPackage("Modelica.Mechanics.MultiBody.Parts", "DymolaParts");
        //scope.addPackage("Modelica.Mechanics.Rotational.Components", "RotComponents");
        //scope.addPackage("Modelica.Mechanics.MultiBody.Joints", "Joints");
        
        
        scope.addClass("Modelica.Mechanics.MultiBody.World", "World");
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
        var line;
        
//        this.clone = function(){
//            //TO DO
//        };
        
        //Updates the connection line
        this.update = function(){
            var startPos = scope.connectorA.position.clone();
            scope.connectorA.parent.localToWorld(startPos);

            var endPos = scope.connectorB.position.clone();
            scope.connectorB.parent.localToWorld(endPos);

            var geometry = new THREE.Geometry();
            geometry.vertices.push(
                    startPos,
                    endPos
            );
            
            scope.remove(line);
            line = new THREE.Line( geometry, new THREE.LineBasicMaterial({ color: 0x0000ff }));
            scope.add(line);
        };
        
        scope.update();
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
        this.phi = 1.0;
        this.type = "RevoluteJoint";
        var scope = this;
        this.animatePhi = null;
        
        this.clone = function(){
            var newRevolute = new RevoluteJoint();
            RevoluteJoint.prototype.clone.call(this, newRevolute);
            newRevolute.typeName = this.typeName;
            newRevolute.phi = this.phi;
            
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
            return newRevolute;
            
        }
        
        this.enforceConstraint = function(){
            //Enfore the revolute joint's constraint
            var connA = this.frameAConnector.connectedTo;
            var connB = this.frameBConnector.connectedTo;
            //Check that the joint is connected to two things
            if(connA === null || connA === undefined || connB === null || connB === undefined){
                return;
            }
            
            //Animate rotation
            if(this.animatePhi !== null && this.animatePhi.length > 0){
                this.phi = this.animatePhi.shift();
            }

            //Rotate the object connected to frame B
            var q = connA.parent.quaternion.clone();
            q.multiply(connA.quaternion);
            q.multiply(connB.quaternion);
            q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),this.phi));
            connB.getParent().quaternion.copy(q);
            connB.getParent().updateMatrixWorld(true);
            
            //Move the object connected to frame B
            var connAWorld = connA.position.clone();
            connA.parent.localToWorld(connAWorld);
            var connBWorld = connB.position.clone();
            connB.parent.localToWorld(connBWorld);
            connB.getParent().position.sub(connBWorld.sub(connAWorld));
            connB.getParent().updateMatrixWorld(true);
            
            
            
            
            
        }
        
    }
    RevoluteJoint.prototype = Object.create(DymolaComponent.prototype);
    
    
    
    function DymolaBox(length,width,height){
        DymolaComponent.call(this);
        var mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshLambertMaterial({color:0x00ff00}));
        this.add(mesh);

        this.length = length;
        this.width = width;
        this.height = height;
        var moi = this;
        
        this.clone = function(){
            var newDymBox = new DymolaBox(this.length,this.width,this.height);
            DymolaBox.prototype.clone.call(moi, newDymBox);
            newDymBox.remove(newDymBox.children[1]);
            newDymBox.typeName = this.typeName;
            
            newDymBox.connectors = [];
            
            newDymBox.traverse(function(currentObj){
                if(currentObj.type === "Connector")
                    newDymBox.connectors.push(currentObj);
            });
            
            newDymBox.parameters = $.extend(true, [], this.parameters);
            newDymBox.resize();
            return newDymBox;
        };
        
        this.resize = function(){    
            mesh.scale.set(this.length,this.width,this.height);
        };
        
        this.resize();
    };
    
    DymolaBox.prototype = Object.create(DymolaComponent.prototype);
    
    function DymolaCylinder(){
        DymolaComponent.call(this);
        this.mesh;
        this.length;
        this.diameter;
        this.numOfRadiusSeg = 32;
        var moi = this;
        this.clone = function(){
          var newDymCyl = new DymolaCylinder();
          DymolaCylinder.prototype.clone.call(moi, newDymCyl);
          newDymCyl.mesh = newDymCyl.children[0];
          newDymCyl.length = this.length;
          newDymCyl.diameter = this.diameter;
          newDymCyl.numOfRadiusSeg = this.numOfRadiusSeg;
          newDymCyl.typeName = this.typeName;
            
            newDymCyl.connectors = [];
            
            newDymCyl.traverse(function(currentObj){
                if(currentObj.type === "Connector")
                    newDymCyl.connectors.push(currentObj);
            });
            
          newDymCyl.parameters = $.extend(true,[], this.parameters);
          return newDymCyl;
        };
        this.resize = function(){
                if(typeof this.mesh !== 'undefined'){
                scene.remove(this);
                this.remove(this.mesh);
                geometry = new THREE.CylinderGeometry(this.diameter * 0.5, this.diameter * 0.5, this.length, this.numOfRadiusSeg);
                material = new THREE.MeshLambertMaterial( {color: 0x00ff00} );
                this.mesh = new THREE.Mesh(geometry, material);
                this.mesh.userData.initColor = this.mesh.material.color;
                this.mesh.material.color = new THREE.Color(0xB0E2FF);
                this.add(this.mesh);
                scene.add(this);
            }
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
        camera.position.set(3,-2,0);
        
        palette = new Palette(renderer.domElement);       


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
        
        $(document).bind('keypress', function(e) {
            if(e.keyCode==13){
		var source = generateModelicaCode();
                
                try{

                    if(dymolaInterface.setClassText("", source)){
                        dymolaInterface.simulateModel("TestModel",0,3,0,0,"Dassl", 0.0001,0.0, "testmodelresults");
                        joints.forEach(function(j){
                            var phis = dymolaInterface.interpolateTrajectory("testmodelresults.mat",new Array(j.name + ".phi"),"0:" + 1/60 + ":2");
                        });
                        
                    }

                }
                catch(err)
                {
                    console.log(err.message);
                }
                
            }
        });
        
        
        transformControls = new CustomTransformControls(camera, renderer.domElement,new THREE.Box3(new THREE.Vector3(-5,-2.5,-5), new THREE.Vector3(5,2.5,5)));
       
        
        scene = new THREE.Scene();
        //scene.add(camera);
        //scene.add(transformControls);
        foregroundScene = new THREE.Scene();
        
        var directionalLight = new THREE.DirectionalLight();
        directionalLight.position.set(5,10,10);
        directionalLight.intensity = 0.75;
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
        directionalLight.intensity = 0.75;
        directionalLight.castShadow = false;
        scene.add(directionalLight);

        
        scene.add(new THREE.AmbientLight(new THREE.Color(0.1,0.1,0.1)));
        
        raycaster = new THREE.Raycaster();
        mousePos = new THREE.Vector2(-1,-1);
        
        window.addEventListener('mousemove', onMouseMove, false);
        
        $(document).on('mousemove', function(){
            checkForConnections();
        });
        
        $(document).on('mouseup', function(){
            onMouseUp();
        });
        
        $(renderer.domElement).on('mousedown', function(event){
            if(intersectionTest() === true){
                event.preventDefault();
                event.stopImmediatePropagation();
                event.stopPropagation();
                return false;
            }
        });

        window.addEventListener('resize', onWindowResize, false);
        

        cameraControls = new CustomCameraControls(camera, renderer.domElement, new THREE.Box3(new THREE.Vector3(-5,-2.5,-5), new THREE.Vector3(5,2.5,5)), new THREE.Vector3(0,-1,0));
        loadDymolaComponent(revoluteJoint);
//        loadDymolaComponent(prismaticJoint);
//        loadDymolaComponent(cylindricalJoint);

        
        
        
        //Add some scenery!
        var room = new THREE.Mesh(new THREE.BoxGeometry(10,5,10), new THREE.MeshLambertMaterial({color: 0xffffff, side: THREE.DoubleSide }));
        room.receiveShadow = true;
        room.castShadow = false;
        scene.add(room);
        var desk = new THREE.Mesh(new THREE.BoxGeometry(1.5,0.5,0.75), new THREE.MeshLambertMaterial({color: 0xccaa22 }));
        desk.position.set(0,-2.25,0);
        desk.castShadow = true;
        desk.receiveShadow = true;
        scene.add(desk);
        

        var pointlight = new THREE.PointLight(0xffffff, 1, 100);
        pointlight.position.set(2,2,2);
        scene.add(pointlight);
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
            
            
            var startPos = draggingFrom.position.clone();
            draggingFrom.parent.localToWorld(startPos);

//            var endPos = scope.connectorB.position.clone();
//            scope.connectorB.parent.localToWorld(endPos);

            var endPos = new THREE.Vector3();
            var lookAt = new THREE.Vector3(0,0, -1).applyQuaternion(camera.quaternion);
            raycaster.setFromCamera(new THREE.Vector2(( event.clientX / renderer.domElement.getBoundingClientRect().width ) * 2 - 1, - ( event.clientY / renderer.domElement.getBoundingClientRect().height ) * 2 + 1), camera);
            var projPlane = new THREE.Plane(lookAt);
            projPlane.intersectLine(new THREE.Line3(camera.position, camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(100.0))),endPos);

            var geometry = new THREE.Geometry();
            geometry.vertices.push(
                    startPos,
                    endPos
            );
    
    

            if(connectionLine !== null)
                scene.remove(connectionLine);
            
            var closest = checkForConnection(new THREE.Vector3(event.clientX, event.clientY, 0));
            if(closest !== null)
                connectionLine = new THREE.Line( geometry, new THREE.LineBasicMaterial({ color: 0xff0000 }));
            else
                connectionLine = new THREE.Line( geometry, new THREE.LineBasicMaterial({ color: 0x0000ff }));
            scene.add(connectionLine);
            
        }
    }
    
    function checkForConnection(position){
        var widthHalf = window.innerWidth / 2;
        var heightHalf = window.innerHeight / 2;
        var distance = 1000000;
        var closest = null;

        for(var i = 0; i < objectCollection.length; i++){
            if(objectCollection[i].type == 'DymolaComponent'){
                for(var j = 0; j < objectCollection[i].connectors.length; j++){
                    //Don't allow connecting a connector to itself
                    if(objectCollection[i].connectors[j] !== draggingFrom ){
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
                        }
                    }
                }
            }
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
            }
            
            draggingConnection = false;
            draggingFrom = null;
        }
    }
    
    var numOfDetailElements = 3;
    function selectObject(object){
        selectedObject = object;
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
            if(selectedObject instanceof DymolaBox){
                $("#idlength").on('input', function(){
                    var lengthValInForm = $(this).val(); 
                    if(!isNaN(lengthValInForm)){
                        selectedObject.length = lengthValInForm;
                        selectedObject.resize();
                    }
            });
                $("#idwidth").on('input', function(){
                    var widthValInForm = $(this).val(); 
                    if(!isNaN(widthValInForm)){
                        selectedObject.width = widthValInForm;
                        selectedObject.resize();
                    }
            });
                 $("#idheight").on('input', function(){
                    var heightValInForm = $(this).val(); 
                    if(!isNaN(heightValInForm)){
                        selectedObject.height = heightValInForm;
                        selectedObject.resize();
                    }
            });
            }
            else if(selectedObject instanceof DymolaCylinder){
                $("#idlength").on('input', function(){
                    var lengthValInForm = $(this).val(); 
                    if(!isNaN(lengthValInForm)){
                        selectedObject.length = lengthValInForm;
                        selectedObject.resize();
                    }
            });
                $("#iddiameter").on('input', function(){
                    var diameterValInForm = $(this).val(); 
                    if(!isNaN(diameterValInForm)){
                        selectedObject.diameter = diameterValInForm;
                        selectedObject.resize();
                    }
            });
            }
//            $('#detailsPanel').on('mousedown', function(event){
//                //event.stopImmediatePropagation();
//                event.stopPropagation();
//            });
//            $('#detailsPanel').on('mouseup', function(event){
//                //event.stopImmediatePropagation();
//                event.stopPropagation();
//            });
//            $('#detailsPanel').on('click', function(event){
//                //event.stopImmediatePropagation();
//                event.stopPropagation();
//            });
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
            });
        }
        else{
            $("#"+id).on('input', function(){
               parameter.currentValue = $(this).val();
               parameter.changed = true;
            });
        }
        $("#detailsPanel").enhanceWithin();
        
        //alert($("#parameters").html());
        //alert($("#"+id+"_ label").attr('class'));
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
        
//        for(var j = 0; j < joints.length; j++){
//            joints[j].update();
//        }
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
    };
    function logic() {
        //moveObjects();
        
        if(!disableControls){
            cameraControls.update();
        }
        transformControls.update();
        palette.update();
        
        for(var i = 0; i < joints.length; i++){
            joints.forEach(function(j){
               j.enforceConstraint(); 
            });
        }
        
        connections.forEach(function(c){
            c.update();
        });
        
        requestAnimationFrame(render);
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

