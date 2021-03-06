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
    
    var worldHidden = false;
    
    var radio;
    var big_red_button;
    var desk;
    var screwdriver;
    var fancyRoom;
    var simpleRoom;
    var isFancy = false;
    
    var axisHelper;
    
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
    
    //Little hack to help with dragging into scene from the palette...
    var dontCheckConnectors = false;
    
    var sceneScale = 0.3;
    var importedComponentScale = 0.009;
    var connectorHightlightRadius = 0.08;
    
    //DymolaComponent Connection-related:
    var draggingConnection = false;
    var draggingFrom = null; //The Connector the connection line starts at
    var connectionLine = null; //A line representing the connection being dragged
    var connections = []; //An array of connections - consists of a line and data about the connectors involved
    var selectedConnection = null;
    
    var mouseMovedSinceMouseDown = false;
    
    var objCounter = 0;
       
    var world = null; //WORLD dymola component

    var disableControls = false;
    var schematicMode = false;
    var simulationMode = false;
    
    var palette; //palette of 3D models to add to the scene
    var dymolaInterface;
    
    var loader = new THREE.VRMLLoader();
    
    var audio;
    
    var particleGroup = null;
   
    var playAnimation = false;
    var animationIsDone = false;


    this.getCamera = function(){
        return camera;
    };

    function generateModelicaCode() { 
        var source = "model TestModel\n";
        objectCollection.forEach(function(obj){
            if(obj.typeName === "Playmola.SimpleWorld")
                source += "inner "
            source += obj.typeName + " " + obj.name;
            var first = true;
            if(obj.parameters.length > 0)
            {
                obj.parameters.forEach(function(param){
                    if(param.toSimulate){
                        if(param.changed){
                            if(!first){
                                source += ",";
                            }
                            else {
                                source +="(";
                                first = false;
                                if(obj.userData.shouldAnimatePosition){
                                    var worldToR = new THREE.Vector3();
                                    var magic = obj.frameAConnector.actualPosition.clone();
                                    obj.localToWorld(magic);
                                    worldToR.subVectors(magic, world.position).multiplyScalar(1/sceneScale);
                                    source += "r_0(start={"+worldToR.x+","+worldToR.y+","+worldToR.z+"}),";
                                }
                            }
                            if(param.convertToRadians != undefined && param.convertToRadians == true)
                                source += param.name + "=" + THREE.Math.degToRad(parseFloat(param.currentValue));
                            else
                                source += param.name + "=" + param.currentValue;
                        }
                    }
                });
                if(first == false)
                    source +=");\n";
                else
                    source +=";\n";
                
            } else {
                source+=";\n";
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
        
        $(domElement).on('vmousedown',function(event){
            var pointer = new THREE.Vector2(event.clientX, event.clientY);
            if(event.originalEvent.originalEvent instanceof MouseEvent){
                if(event.originalEvent.button != 0){  
                    return;
                }
            }
            else { //TouchEvent
                if(bounds.containsPoint(pointer)){
                    var hoverTileX_ = Math.floor((pointer.x - bounds.min.x) / (tileSpacing + tileWidth));
                    var hoverTileY_ = Math.floor((pointer.y - bounds.min.y) / (tileSpacing + tileHeight));
                    
                    if(hoverTileX_ + hoverTileY_ * tilesX < categories[selectedCategory].length){
                        hoverTileX = hoverTileX_;
                        hoverTileY = hoverTileY_;
                    } else{
                        hoverTileX = -1;
                        hoverTileY = -1;
                    }
                } else {
                    hoverTileX = -1;
                    hoverTileY = -1;
                }
            }

            if(bounds.containsPoint(pointer)){
                if(hoverTileX != -1){
                    var newComponent = cloneAndScaleComponent(categories[selectedCategory][hoverTileX + hoverTileY * tilesX]);
                    if(simulationMode)
                        leaveSimulationMode();
                    
                    raycaster.setFromCamera(new THREE.Vector2(( event.clientX / domElement.getBoundingClientRect().width ) * 2 - 1, - ( event.clientY / domElement.getBoundingClientRect().height ) * 2 + 1), camera);
                    var projPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0,0, -1).applyQuaternion(camera.quaternion),new THREE.Vector3());
                    projPlane.intersectLine(new THREE.Line3(camera.position, camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(100.0))),newComponent.position);
                    
                    selectObject(newComponent);
                    mouseMovedSinceMouseDown = false;
                    
                    transformControls.dragging = true;
                    
                    dontCheckConnectors = true; //Don't accidentally drag a connector instead of a component
                    
                    event.stopImmediatePropagation();
                }
            }
        });
        

        
        $(domElement).on('vmousemove',function(event){
            
            
            var pointer = new THREE.Vector2(event.clientX, event.clientY);

            if(bounds.containsPoint(pointer)){
                mouseover = true;
                
                var hoverTileX_ = Math.floor((pointer.x - bounds.min.x) / (tileSpacing + tileWidth));
                var hoverTileY_ = Math.floor((pointer.y - bounds.min.y) / (tileSpacing + tileHeight));
                if(hoverTileX == hoverTileX_ && hoverTileY == hoverTileY_){
                    
                } else {
                    if(hoverTileX != -1){
                        categories[selectedCategory][hoverTileX + hoverTileY * tilesX].scale.multiplyScalar(1/1.6);
                        $("#label_hovered").text("");
                    }
                    hoverTileX = hoverTileX_;
                    hoverTileY = hoverTileY_;
                    if(hoverTileX + hoverTileY * tilesX < categories[selectedCategory].length){
                         categories[selectedCategory][hoverTileX + hoverTileY * tilesX].scale.multiplyScalar(1.6);
                         $("#label_hovered").text(categories[selectedCategory][hoverTileX + hoverTileY * tilesX].typeName);
                    } else {
                        hoverTileX = -1;
                        hoverTileY = -1;
                    }
                }
                
            } else {
                mouseover = false;
                $("#label_hovered").text("");
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
        camera.add
           

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
            
            //Reposition planes:
            
            for(var i = 0; i < 25; i++){
                backplanes[i].position.set(((i)%tilesX) * (tileSpacing + tileWidth) - width/2 + tileWidth/2 + bounds.min.x, -Math.floor((i)/tilesX) * (tileSpacing + tileHeight) + height/2 - tileHeight/2 - bounds.min.y,-500);
            }
            
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
            
            
            obj.connectors.forEach(function(c){
                c.visible = false;
            });
            
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
            //newcomponent.name = "Obj" + objCounter;
            var index = 1;
            var simplifiedTypeName = newcomponent.typeName;
            var lastDot = simplifiedTypeName.lastIndexOf(".");
            simplifiedTypeName = simplifiedTypeName.substring(lastDot + 1);
            for(var i = 0; i < objectCollection.length; i++){
                if(objectCollection[i].name === simplifiedTypeName + index){
                    index++;
                    i = 0;
                }
            }
            newcomponent.name = simplifiedTypeName + index;
            objCounter++;

            if(newcomponent.typeName === "Playmola.SimpleWorld") {
                world = newcomponent;
                newcomponent.name = "world";
            }
            if(newcomponent.type === "RevoluteJoint" || newcomponent.type === "PrismaticJoint" || newcomponent.type === "RollingWheelJoint") joints.push(newcomponent);

            newcomponent.scale.set(newcomponent.userData.sceneScale,newcomponent.userData.sceneScale,newcomponent.userData.sceneScale).multiplyScalar(sceneScale);


            newcomponent.children[0].position.add(newcomponent.userData.centerOffset);
            
            
            newcomponent.connectors.forEach(function(c){
                c.visible = true;
            });
            
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
        
        this.makeComponentUnkownCategory = function(className){
            var keys = Object.keys(categories);
            for(var i = 0; i < keys.length; i++){
                for(var j = 0; j < categories[keys[i]].length;j++){
                    if(categories[keys[i]][j].typeName == className){
                        return cloneAndScaleComponent(categories[keys[i]][j]);
                    }
                }    
            }
        }

        
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
        
        this.addCategory = function(name, hidden){
            categories[name] = [];
            if(hidden == undefined || hidden == false){
                $("#select-custom-1").append("<option value='" + name + "' id='opt" + name + "'>" + name + "</option>");
                $("#select-custom-1").enhanceWithin();
            }
        }
        
        scope.addCategory("Joints",true);
        scope.addCategory("Components",true);
        
        $("#select-custom-1").on('change', function(event){
            scope.selectCategory(event.target.value);
        });
        
        this.hideCategory = function(category){
            
            $("#opt" + category).remove();
             $("#select-custom-1").selectmenu({style:'dropdown'});
             $("#select-custom-1").selectmenu("refresh");
            
             $("#select-custom-1").enhanceWithin();
        };
        
        this.unhideCategory = function(category){
            $("#select-custom-1").append("<option value='" + category + "' id='opt" + category + "'>" + category + "</option>");
            $("#select-custom-1").selectmenu({style:'dropdown'});
            $("#select-custom-1").selectmenu("refresh");
            $("#select-custom-1").enhanceWithin();
        };
        
        //generate backing planes...
        for(var i = 0; i < 25; i++){
            var backplane = new THREE.Mesh(new THREE.PlaneBufferGeometry(tileWidth, tileHeight), new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide , opacity: 0.3, transparent: true} ));        
            scope.palettescene.add(backplane);
            backplane.position.set(((i)%tilesX) * (tileSpacing + tileWidth) - width/2 + tileWidth/2 + bounds.min.x, -Math.floor((i)/tilesX) * (tileSpacing + tileHeight) + height/2 - tileHeight/2 - bounds.min.y,-500);
            backplane.visible = false;
            backplanes.push(backplane);
        }
        
        //Make a bunch of categories
        //this.addCategory("Parts");
        
        
        

        
        //this.selectCategory("joints");
        this.loadParts = function(){
            scope.addCategory("Robot");
//            loader.load("Piston_Study.wrl", function(object){
//                var obj = loadModel(object, new THREE.Vector3(0.,-0.15149054405043,0.), new Array(new ConnectionPoint(new THREE.Vector3(0.,-0.14420647088485,0.))));
//                scope.add(obj, "Parts",true, 0, 4);
//            });
//            loader.load("Master_One_Cylinder.wrl", function(object){
//                var obj = loadModel(object, new THREE.Vector3(-4.5e-2,0.,0.), new Array(new ConnectionPoint(new THREE.Vector3(-4.5e-2,0.,0.))));
//                scope.add(obj, "Parts", true, 0, 4);
//            });
//            loader.load("Rod_Study.wrl", function(object){
//                var obj = loadModel(object, new THREE.Vector3(0.,-8.9431700693962e-2,2.4489282256523e-2), new Array(new ConnectionPoint(new THREE.Vector3(0.,-3.465692988818e-2,4.8978561933508e-2)), new ConnectionPoint(new THREE.Vector3(0.,-0.14420647088485,0.))));
//                scope.add(obj, "Parts", true, 0, 4);
//            });
//            loader.load("Cranck_Study.wrl", function(object){
//                var obj = loadModel(object, new THREE.Vector3(-2.7054598934035e-2,-9.0702960410631e-3,1.2818607418443e-2), new Array(new ConnectionPoint(new THREE.Vector3(0.,-3.465692988818e-2,4.8978561933508e-2)), new ConnectionPoint(new THREE.Vector3(-4.5e-2,0.,0.))));
//                scope.add(obj, "Parts", true, 0, 4);
//            });

            loader.load("models/robot/b0.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(0,0,0), new Array(new ConnectionPoint(new THREE.Vector3(0,0,0)),new ConnectionPoint(new THREE.Vector3(0,0.351,0))));
                scope.add(obj, "Robot", true, 0, 1.5);
                
            });
            loader.load("models/robot/b1.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(0,0,0), new Array(new ConnectionPoint(new THREE.Vector3(0,0,0)),new ConnectionPoint(new THREE.Vector3(0,0.324,0.3))));
                scope.add(obj, "Robot", true, 0, 1.5);
            });
            loader.load("models/robot/b2.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(0.172,0.205,0), new Array(new ConnectionPoint(new THREE.Vector3(0,0,0)),new ConnectionPoint(new THREE.Vector3(0,0.65,0))));
                scope.add(obj, "Robot", true, 0, 1.5);
            });
            loader.load("models/robot/b3.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(0.064,-0.034,0), new Array(new ConnectionPoint(new THREE.Vector3(0,0,0)),new ConnectionPoint(new THREE.Vector3(0,0.414,-0.155))));
                scope.add(obj, "Robot", true, 0, 1.5);
            });

            loader.load("models/robot/b4.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(0,0,0), new Array(new ConnectionPoint(new THREE.Vector3(0,0,0)),new ConnectionPoint(new THREE.Vector3(0,0.186,0))));
                scope.add(obj, "Robot", true, 0, 1.5);
            });
            loader.load("models/robot/b5.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(0,0,0), new Array(new ConnectionPoint(new THREE.Vector3(0,0,0)),new ConnectionPoint(new THREE.Vector3(0,0.125,0))));
                scope.add(obj, "Robot", true, 0, 1.5);
            });
            loader.load("models/robot/b6.wrl", function(object){
                var obj = loadModel(object, new THREE.Vector3(0.05,0.05,0.05), new Array(new ConnectionPoint(new THREE.Vector3(0,0,0))));
                scope.add(obj, "Robot", true, 0, 1.5);

            });
        }
        
        function colorParametersDecorator(obj){
            var color = {
                name : "Color",
                fullTypeName : "Color",
                currentValue : "#00ff00",
                toSimulate : false,
                callback : function(val){
                    if(true){
                        this.currentColor = parseInt(val.replace(/^#/, '0x'));
                        this.recolor();
                    }
                }
            };
            var red = {
                name : "Red",
                fullTypeName : "Integer",
                currentValue : 0,
                toSimulate : false,
                callback : function(val){
                    if(!isNaN(val) && val <= 255 && val >= 0){
                        this.currentRed = val;
                        this.recolor();
                    }
                }
            }
            var green = {
                name : "Green",
                fullTypeName : "Integer",
                currentValue : 255,
                toSimulate : false,
                callback : function(val){
                    if(!isNaN(val) && val <= 255 && val >= 0){
                        this.currentGreen = val;
                        this.recolor();
                    }
                }
            }
            var blue = {
                name : "Blue",
                fullTypeName : "Integer",
                currentValue : 0,
                toSimulate : false,
                callback : function(val){
                    if(!isNaN(val) && val <= 255 && val >= 0){
                        this.currentBlue = val;
                        this.recolor();
                    }
                }
            }
            obj.push(color);
        };
        
        this.loadDymolaBox = function(){
            if(categories["Bodies"] === undefined){
                scope.addCategory("Bodies");
            }
            var bodyBoxClassName = "Playmola.SimpleBodyBox";
            var dymBox = new DymolaBox(0.5,0.5,0.5);
            var componentsInClass = dymolaInterface.Dymola_AST_ComponentsInClass(bodyBoxClassName);
            for(var i = 0; i < componentsInClass.length; i++){
                var params = [];
                params.push(bodyBoxClassName);
                params.push(componentsInClass[i]);
                if(dymolaInterface.callDymolaFunction("Dymola_AST_ComponentVariability", params) === "parameter"){
                    var componentParam = [];
                    componentParam["name"] = componentsInClass[i];
                    componentParam.name = componentParam.name.substring(1);
                    componentParam["sizes"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentSizes",params);
                    componentParam["fullTypeName"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentFullTypeName", params);
                    componentParam["description"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentDescription",params);
                    componentParam["changed"] = false;
                    componentParam.toSimulate = true;
                    if(componentParam.name === "length"){
                        componentParam.callback = function(val){
                            if(!isNaN(val)){
                                this.length = val;
                                this.resize();
                                this.updateFrames();
                            }
                        };
                    }
                    if(componentParam.name === "height"){
                        componentParam.callback = function(val){
                            if(!isNaN(val)){
                                this.height = val;
                                this.resize();
                                this.updateFrames();
                            }
                        };
                    }
                    if(componentParam.name === "width"){
                        componentParam.callback = function(val){
                            if(!isNaN(val)){
                                this.width = val;
                                this.resize();
                                this.updateFrames();
                            }
                        };
                    }
                    if(componentParam.name === "r"){
                        componentParam.callback = function(vector){
                            var xyz = vector.toString().replace("{","").replace("}","").split(",");
                            if(xyz.length == 3)
                                this.r = new THREE.Vector3(parseFloat(xyz[0]),parseFloat(xyz[1]),parseFloat(xyz[2]));
                            this.updateFrames();
                        };
                    }
                    if(componentParam.name === "r_shape"){
                        componentParam.callback = function(vector){
                            var xyz = vector.toString().replace("{","").replace("}","").split(",");
                            if(xyz.length == 3)
                                this.r_shape = new THREE.Vector3(parseFloat(xyz[0]),parseFloat(xyz[1]),parseFloat(xyz[2]));
                            this.updateFrames();
                        };
                    }
                    if(componentParam.name === "lengthDirection"){
                        componentParam.callback = function(vector){
                            var xyz = vector.toString().replace("{","").replace("}","").split(",");
                            if(xyz.length == 3)
                                this.lengthDirection = new THREE.Vector3(parseFloat(xyz[0]),parseFloat(xyz[1]),parseFloat(xyz[2]));
                            this.lengthDirection.normalize();
                            this.resize();
                            this.updateFrames();
                        };
                    }
                    dymBox.parameters.push(componentParam);
                }
            }
            colorParametersDecorator(dymBox.parameters);
            
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
            var bodyCylinderClassName = "Playmola.SimpleBodyCylinder";
            var dymCyl = new DymolaCylinder();
            var componentsInClass = dymolaInterface.Dymola_AST_ComponentsInClass(bodyCylinderClassName);
            for(var i = 0; i < componentsInClass.length; i++){
                var params = [];
                params.push(bodyCylinderClassName);
                params.push(componentsInClass[i]);
                if(dymolaInterface.callDymolaFunction("Dymola_AST_ComponentVariability", params) === "parameter"){
                    var componentParam = [];
                    componentParam["name"] = componentsInClass[i];
                    componentParam.name = componentParam.name.substring(1);
                    componentParam["sizes"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentSizes",params);
                    componentParam["fullTypeName"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentFullTypeName", params);
                    componentParam["description"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentDescription",params);
                    componentParam["changed"] = false;
                    componentParam.toSimulate = true;
                     if(componentParam.name === "length"){
                        componentParam.callback = function(val){
                            if(!isNaN(val)){
                                this.length = val;
                                this.resize();
                                this.updateFrames();
                            }
                        }
                        
                    }
                    if(componentParam.name === "diameter"){
                        componentParam.callback = function(val){
                            if(!isNaN(val)){
                                this.diameter = val;
                                this.resize();
                                this.updateFrames();
                            }
                        };
                    }
                    if(componentParam.name === "r"){
                        componentParam.callback = function(vector){
                            var xyz = vector.toString().replace("{","").replace("}","").split(",");
                            if(xyz.length == 3)
                                this.r = new THREE.Vector3(parseFloat(xyz[0]),parseFloat(xyz[1]),parseFloat(xyz[2]));
                            this.updateFrames();
                        };
                    }
                    if(componentParam.name === "r_shape"){
                        componentParam.callback = function(vector){
                            var xyz = vector.toString().replace("{","").replace("}","").split(",");
                            if(xyz.length == 3)
                                this.r_shape = new THREE.Vector3(parseFloat(xyz[0]),parseFloat(xyz[1]),parseFloat(xyz[2]));
                            this.updateFrames();
                        };
                    }
                    if(componentParam.name === "lengthDirection"){
                        componentParam.callback = function(vector){
                            var xyz = vector.toString().replace("{","").replace("}","").split(",");
                            if(xyz.length == 3)
                                this.lengthDirection = new THREE.Vector3(parseFloat(xyz[0]),parseFloat(xyz[1]),parseFloat(xyz[2]));
                            this.lengthDirection.normalize();
                            this.resize();
                            this.updateFrames();
                        };
                    }
                    dymCyl.parameters.push(componentParam);
                }
            }
            
            colorParametersDecorator(dymCyl.parameters);
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
                    componentParam.toSimulate = true;
                    if(componentParam.name === "StartAngle"){
                        componentParam.convertToRadians = true;
                        componentParam.callback = function(angle){
                            if(!isNaN(angle))
                                this.phi = THREE.Math.degToRad(angle);
                        };
                    }
                    if(componentParam.name === "AxisOfRotation"){
                        componentParam.currentValue = "{0,0,1}";
                        componentParam.callback = function(vector){
                            var xyz = vector.toString().replace("{","").replace("}","").split(",");
                            if(xyz.length == 3)
                                this.axis = new THREE.Vector3(parseFloat(xyz[0]),parseFloat(xyz[1]),parseFloat(xyz[2]));
                            this.axis.normalize();
                            this.align();
                        };
                    }
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
            
            scope.add(obj2, "Joints", false, 1, importedComponentScale);
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
                    componentParam.toSimulate = true;
                    if(componentParam.name === "StartTranslation"){
                        componentParam.callback = function(translation){
                            if(!isNaN(translation))
                                this.translation = translation;
                        };
                    }
                    if(componentParam.name === "AxisOfTranslation"){
                        componentParam.currentValue = "{1,0,0}";
                        componentParam.callback = function(vector){
                            var xyz = vector.toString().replace("{","").replace("}","").split(",");
                            if(xyz.length == 3)
                                this.axis = new THREE.Vector3(parseFloat(xyz[0]),parseFloat(xyz[1]),parseFloat(xyz[2]));
                            this.axis.normalize();
                            this.align();
                        };
                    }
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
            
            scope.add(obj2, "Joints", false, 1, importedComponentScale);
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
                    componentParam.toSimulate = true;
                    if(componentParam.name === "radius"){
                        componentParam.callback = function(radius){
                            if(!isNaN(radius))
                                this.radius = radius;
                        };
                    }
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
            
            scope.add(obj2, "Joints", false, 1, importedComponentScale);
        }
        
        this.loadBushing = function(){
            if(categories["HiddenComponents"] === undefined){
                scope.addCategory("HiddenComponents", true);
            }
            
            var exportModelSource = dymolaInterface.exportWebGL("Playmola.SimpleBushing");
            var obj = new Function(exportModelSource)();
            //Remove TextGeometry
            for(var j = 0; j < obj.children.length; j++){
                if(obj.children[j].type == 'Mesh' && obj.children[j].geometry.type == 'TextGeometry'){
                    obj.remove(obj.children[j]);
                    j--;
                }
            }
            var obj2 = new Bushing();
            obj2.typeName = "Playmola.SimpleBushing";
            var componentsInClass = dymolaInterface.Dymola_AST_ComponentsInClass("Playmola.SimpleBushing");

            for(var j = 0; j < componentsInClass.length; j++){
                var params = [];
                params.push("Playmola.SimpleBushing");
                params.push(componentsInClass[j]);
                if(dymolaInterface.callDymolaFunction("Dymola_AST_ComponentVariability", params) === "parameter"){
                    var componentParam = [];
                    componentParam["name"] = componentsInClass[j];
                    componentParam["sizes"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentSizes",params);
                    componentParam["fullTypeName"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentFullTypeName", params);
                    componentParam["description"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentDescription",params);
                    componentParam["changed"] = false;
                    componentParam.toSimulate = true;
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
            
            scope.add(obj2, "HiddenComponents", false, 1, importedComponentScale);
        }
        
        this.loadFixedRotation = function(){
            if(categories["Components"] === undefined){
                scope.addCategory("Components");
            }
            
            var exportModelSource = dymolaInterface.exportWebGL("Playmola.SimpleFixedRotation");
            var obj = new Function(exportModelSource)();
            //Remove TextGeometry
            for(var j = 0; j < obj.children.length; j++){
                if(obj.children[j].type == 'Mesh' && obj.children[j].geometry.type == 'TextGeometry'){
                    obj.remove(obj.children[j]);
                    j--;
                }
            }
            var obj2 = new FixedRotation();
            obj2.typeName = "Playmola.SimpleFixedRotation";
            var componentsInClass = dymolaInterface.Dymola_AST_ComponentsInClass("Playmola.SimpleFixedRotation");

            for(var j = 0; j < componentsInClass.length; j++){
                var params = [];
                params.push("Playmola.SimpleFixedRotation");
                params.push(componentsInClass[j]);
                if(dymolaInterface.callDymolaFunction("Dymola_AST_ComponentVariability", params) === "parameter"){
                    var componentParam = [];
                    componentParam["name"] = componentsInClass[j];
                    componentParam["sizes"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentSizes",params);
                    componentParam["fullTypeName"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentFullTypeName", params);
                    componentParam["description"] = dymolaInterface.callDymolaFunction("Dymola_AST_ComponentDescription",params);
                    componentParam["changed"] = false;
                    componentParam.toSimulate = true;
                    if(componentParam.name === "Translation"){
                        componentParam.currentValue = "{0,0,0}";
                        componentParam.callback = function(vector){
                            var xyz = vector.toString().replace("{","").replace("}","").split(",");
                            if(xyz.length == 3)
                                this.translation = new THREE.Vector3(parseFloat(xyz[0]),parseFloat(xyz[1]),parseFloat(xyz[2]));    
                            this.updateFrames();
                        };
                    }
                    else if(componentParam.name === "AxisOfRotation"){
                        componentParam.currentValue = "{1,0,0}";
                        componentParam.callback = function(vector){
                            var xyz = vector.toString().replace("{","").replace("}","").split(",");
                            if(xyz.length == 3)
                                this.rotationAxis = new THREE.Vector3(parseFloat(xyz[0]),parseFloat(xyz[1]),parseFloat(xyz[2]));
                                this.rotationAxis.normalize();
                            this.updateFrames();
                        };
                    }
                    else if(componentParam.name === "Angle"){
                        componentParam.currentValue = 0;
                        componentParam.callback = function(angle){
                            if(!isNaN(angle))
                                this.rotationAngle = angle;
                            this.updateFrames();
                        };
                    }
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
            
            scope.add(obj2, "Components", false, 1, importedComponentScale);
        };
        
        
        this.addClass = function(classname, category, scale, categoryHidden){
            if(categoryHidden === undefined) categoryHidden = false;
            if(categories[category] === undefined){
                scope.addCategory(category, categoryHidden);
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
                    componentParam["toSimulate"] = true;

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
            
            scope.add(obj2, category, false, 1, scale);
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
                    componentParam.toSimulate = true;
                    componentParam.currentValue = classToLoad.components[j].defaultValue;
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
            
            scope.add(obj2, category, false, 1, importedComponentScale);
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
                            classes[i].components[j].defaultValue = defaultValue;
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
        
        
        scope.addClass("Playmola.SimpleWorld", "World", 0.015, true);
        scope.addClass("Playmola.SimpleInertia", "Components", importedComponentScale);
        scope.addClass("Playmola.SimpleConstantSpeed", "Components", importedComponentScale);
        scope.addClass("Playmola.SimpleConstantTorque", "Components", importedComponentScale);
        scope.addClass("Playmola.SimpleDamper", "Components", importedComponentScale);
        scope.addClass("Playmola.SimpleSpringDamper", "Components", importedComponentScale);
        scope.loadDymolaBox();
        scope.loadDymolaCylinder();
        scope.loadRevoluteJoint();
        scope.loadPrismaticJoint();
        scope.loadRollingWheelJoint();
        scope.loadFixedRotation();
        scope.loadBushing();
        scope.addPackage("Playmola.UserComponents", "Custom Components");
        
        scope.loadParts();
        
        scope.addCategory("None");
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
        this.connectedTo = [];
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
        A.connectedTo.push(B);
        this.connectorB = B;
        B.connectedTo.push(A);
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
        
        this.select = function(){
            line.scale.x = 2;
            line.scale.y = 2;
        };
        
        this.deselect = function(){
            line.scale.x = 1;
            line.scale.y = 1;
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
        this.currentFrame = 0;
        
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
        
        this.getExplosionQuaternion = function(){
            return this.quaternion.clone().multiply(this.children[0].quaternion);
        };
        
        this.enforceConstraint = function(){
            //Animate rotation
            if(this.animatePhi !== null && this.currentFrame < this.animatePhi.length){
                this.phi = this.animatePhi[this.currentFrame];
                if(playAnimation)
                    this.currentFrame++;
            }
            this.frameBConnector.actualOrientation.setFromAxisAngle(this.axis,this.phi);
        };
        
        this.resetAnimation = function(){
            if(this.animatePhi != null)
                this.phi = this.animatePhi[0];
            this.animatePhi = null;
            this.currentFrame = 0;
        };

        this.isAnimationDone = function(){
            return (this.animatePhi !== null && this.animatePhi.length > 0 && this.currentFrame == this.animatePhi.length - 1);
        }
        
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
        this.currentFrame = 0;
        
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
        
        this.getExplosionQuaternion = function(){
            return this.quaternion.clone().multiply(this.children[0].quaternion);
        };
        
        this.enforceConstraint = function(){
            //Animate translation
            if(this.animateTranslation !== null && this.currentFrame < this.animateTranslation.length){
                this.translation = this.animateTranslation[this.currentFrame];
                if(playAnimation)
                    this.currentFrame++;
            }
            this.frameBConnector.actualPosition.copy(this.axis.clone().multiplyScalar(this.translation/this.scale.x * sceneScale));
        };
        
        this.resetAnimation = function(){
            if(this.animateTranslation != null)
                this.translation = this.animateTranslation[0];
            this.animateTranslation = null;
            this.currentFrame = 0;
        };
        this.isAnimationDone = function(){
            return (this.animateTranslation !== null && this.animateTranslation.length > 0 && this.currentFrame == this.animateTranslation.length - 1);
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
        this.currentFrame = 0;
        
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
            if(this.animateTranslation !== null && this.currentFrame < this.animateTranslation.length){
                this.translation = this.animateTranslation[this.currentFrame];
            }
            //Animate rotation
            if(this.animatePhi !== null && this.currentFrame < this.animatePhi.length){
                this.phi = this.animatePhi[this.currentFrame];
                if(playAnimation)
                    this.currentFrame++;
            }
            this.frameBConnector.actualOrientation.setFromAxisAngle(new THREE.Vector3(0,0,1),this.phi);
            this.frameBConnector.actualPosition.set(this.translation/this.scale.x * sceneScale,this.radius/this.scale.x * sceneScale,0);
            
          
        };
        this.isAnimationDone = function(){
            return (this.animateTranslation !== null && this.animateTranslation.length > 0 && this.currentFrame == this.animateTranslation.length - 1);
        }
        
        this.resetAnimation = function(){
            if(this.animatePhi != null)
                this.phi = this.animatePhi[0];
            if(this.animateTranslation != null)
                this.translation = this.animateTranslation[0];
            this.animatePhi = null;
            this.animateTranslation = null;
            this.currentFrame = 0;
        };
    }
    RollingWheelJoint.prototype = Object.create(DymolaComponent.prototype);
    
    function Bushing(){
        DymolaComponent.call(this);
        this.frameAConnector = null;
        this.frameBConnector = null;
        this.type = "Bushing";

        this.clone = function(){
            var bushing = new Bushing();
            Bushing.prototype.clone.call(this, bushing);
            bushing.typeName = this.typeName;
            bushing.connectors = [];
            
            bushing.traverse(function(currentObj){
                if(currentObj.type === "Connector"){
                    bushing.connectors.push(currentObj);
                    if(currentObj.userData.name === "frame_a")
                        bushing.frameAConnector = currentObj;
                    if(currentObj.userData.name === "frame_b")
                        bushing.frameBConnector = currentObj;
                }
            });
            
            bushing.parameters = $.extend(true, [], this.parameters);
            return bushing;
            
        };
 
        this.enforceConstraint = function(){
            //Do nothing for now
        }; 
    }
    Bushing.prototype = Object.create(DymolaComponent.prototype);
    
    function FixedRotation(){
        DymolaComponent.call(this);
        this.frameAConnector = null;
        this.frameBConnector = null;
        this.translation = new THREE.Vector3();
        this.rotationAxis = new THREE.Vector3(1,0,0);
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
        this.currentRed = 0;
        this.currentGreen = 255;
        this.currentBlue = 0;
        this.currentColor = 0x00ff00;
        this.animatePosition = null;
        this.currentFrame = 0;
        this.userData.shouldAnimatePosition = true;

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
        
        this.recolor = function(){
            //var newColor = new THREE.Color(moi.currentRed/255, moi.currentGreen/255, moi.currentBlue/255);
            var newColor = this.currentColor;
            moi.traverse(function(child){
            if(child instanceof THREE.Mesh && child.parent !== moi.frameAConnector && child.parent !== moi.frameBConnector){
                child.userData.initColor = newColor;
                child.oldMaterial.color.setHex(newColor);
             }
        });
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
        
        this.animateFrame = function(){
            if(this.animatePosition !== null && this.currentFrame < this.animatePosition.length){
                var newOffset = new THREE.Vector3();
                newOffset.addVectors(world.position, this.animatePosition[this.currentFrame].clone().multiplyScalar(sceneScale));
                //newOffset.multiplyScalar(0.3);
                newOffset.sub(this.frameAConnector.actualPosition.clone().multiplyScalar(this.scale.x));
                this.position.set(newOffset.x,newOffset.y,newOffset.z);
            }
            if(playAnimation)
                this.currentFrame++;
        }
        
        this.resetAnimation = function(){
            if(this.animatePosition != null){
                var newOffset = new THREE.Vector3();
                newOffset.addVectors(world.position, this.animatePosition[0].clone().multiplyScalar(sceneScale));
                //newOffset.multiplyScalar(0.3);
                newOffset.sub(this.frameAConnector.actualPosition.clone().multiplyScalar(this.scale.x));
                this.position.set(newOffset.x,newOffset.y,newOffset.z);
            }
            this.animatePosition = null;
            this.currentFrame = 0;
        };
        
        this.isAnimationDone = function(){
            return (this.animatePosition !== null && this.animatePosition.length > 0 && this.currentFrame == this.animatePosition.length - 1);
        }
        
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
        this.currentRed = 0;
        this.currentGreen = 255;
        this.currentBlue = 0;
        this.currentColor = 0x00ff00;
        this.animatePosition;
        this.userData.shouldAnimatePosition = true;
        
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
        
        this.recolor = function(){
            //var newColor = new THREE.Color(moi.currentRed/255, moi.currentGreen/255, moi.currentBlue/255);
            var newColor = this.currentColor;
            moi.traverse(function(child){
            if(child instanceof THREE.Mesh && child.parent !== moi.frameAConnector && child.parent !== moi.frameBConnector){
                child.userData.initColor = newColor;
                child.oldMaterial.color.setHex(newColor);
             }
        });
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
        renderer.shadowMapEnabled=true;
        renderer.shadowMapType= THREE.PCFSoftShadowMap;
        renderer.autoClear = false;
        renderer.setClearColor( 0x7EC0EE, 1 );
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.querySelector("#container").appendChild(renderer.domElement);

        camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,1000);
        camera.position.set(0,0.25,4);
        
        
        
        
 
        audio = new PlaymolaAudio();
        $("#button_audio_toggle").on('click', function(){
            if(audio.isMusicPlaying)
                audio.stopMusic();
            else{
                if(simulationMode)
                    audio.playSimulate();
                else
                    audio.playTheme();
            }
        });
        
        
        scene = new THREE.Scene();
        scene.add(camera);
        foregroundScene = new THREE.Scene();
//        axisHelper = new THREE.AxisHelper(0.5);
//        scene.add(axisHelper);
        
        var directionalLight = new THREE.DirectionalLight();
        directionalLight.position.set(5,7,7);
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
        directionalLight.position.set(-1,0,1);
        directionalLight.intensity = 0.2;
        directionalLight.castShadow = false;
        scene.add(directionalLight);
        
        directionalLight = new THREE.DirectionalLight();
        directionalLight.position.set(1,0,1);
        directionalLight.intensity = 0.2;
        directionalLight.castShadow = false;
        scene.add(directionalLight);
        
        directionalLight = new THREE.DirectionalLight();
        directionalLight.position.set(-3,-5,-2);
        directionalLight.intensity = 0.7;
        directionalLight.castShadow = false;
        scene.add(directionalLight);
        
        directionalLight = new THREE.DirectionalLight();
        directionalLight.position.set(1,-1,-1);
        directionalLight.intensity = 0.9;
        directionalLight.castShadow = false;
        foregroundScene.add(directionalLight);

        
        scene.add(new THREE.AmbientLight(new THREE.Color(0.1,0.1,0.1)));
        raycaster = new THREE.Raycaster();
   
        
        var jsonloader = new THREE.JSONLoader();
        
        jsonloader.load( "./models/room.json", function(geometry, mat) {
            var materials = new THREE.MeshFaceMaterial(mat);
            fancyRoom = new THREE.Mesh(geometry, materials );
            fancyRoom.receiveShadow = true;
            fancyRoom.castShadow = false;
            fancyRoom.rotation.set(0,THREE.Math.degToRad(-90),0);
            
        });

        var geometry = new THREE.BoxGeometry(10,5,10);
        var mat = new THREE.MeshLambertMaterial({color:0xeeeeee, side:THREE.DoubleSide});
        simpleRoom = new THREE.Mesh(geometry,mat);
        
        jsonloader.load("./models/desk.json", function(geometry,mat){
            desk = new THREE.Mesh(geometry, mat[0]);
            desk.position.set(0,-1.05,0);
            desk.castShadow = true;
            desk.receiveShadow = true;
            
        }, "models/");
        
        jsonloader.load("./models/radio.json", function(geometry,mat){
            radio = new THREE.Mesh(geometry, mat[0]);
            
            radio.position.set(-1.15,-0.95,-0.55);
            radio.rotation.set(0,THREE.Math.degToRad(-70),0);
            
            radio.scale.set(0.3,0.3,0.3);
            radio.castShadow = true;
            radio.receiveShadow = true;
            radio.material.shading = THREE.SmoothShading;
            
        }, "models/");
        
        jsonloader.load("./models/big_red_button.json", function(geometry,mat){
            big_red_button = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(mat));
            
            big_red_button.position.set(1.25,-0.85,-0.55);
            big_red_button.rotation.set(0,THREE.Math.degToRad(-20),0);
            
            big_red_button.scale.set(0.15,0.15,0.15);
            big_red_button.castShadow = true;
            big_red_button.receiveShadow = true;
            big_red_button.material.shading = THREE.SmoothShading;
            
        }, "models/");
        
        jsonloader.load("./models/screwdriver.json", function(geometry,mat){
            screwdriver = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(mat));
            
            screwdriver.position.set(-1,-0.95,0.55);
            screwdriver.rotation.set(0,THREE.Math.degToRad(-70),0);
            
            screwdriver.scale.set(0.05,0.05,0.05);
            screwdriver.castShadow = true;
            screwdriver.receiveShadow = true;
            screwdriver.material.shading = THREE.SmoothShading;
            
        }, "models/");
        
        
        if(isFancy){
            scene.add(fancyRoom);
            scene.add(desk);
            scene.add(radio);
            scene.add(big_red_button);
            scene.add(screwdriver);
        } else {
            scene.add(simpleRoom);
        }

//        var pointlight = new THREE.PointLight(0xffffff, 2, 10);
//        pointlight.position.set(0,0,0);
//        scene.add(pointlight);
        
 
        
        //ALL EVENT HANDLERS BOUND HERE:
        
        //Keep track of whether or not the left mouse button is down 
        //(since we can't tell from mousemove events)
        $(renderer.domElement).on('vmousedown',function(event){
            if(event.originalEvent.originalEvent instanceof MouseEvent){
                if(event.originalEvent.button != 0){  
                    return;
                }
            } 
            leftMouseDown = true;
        });
        $(renderer.domElement).on('vmouseup',function(event){
            if(event.originalEvent.originalEvent instanceof MouseEvent){
                if(event.originalEvent.button != 0){  
                    return;
                }
            } 
            leftMouseDown = false;
        });
        
        //Palette has event handling priority, since it is always on top
        palette = new Palette(renderer.domElement);  
        initializeWorld();
        
        //Handle mouse events:
        $(renderer.domElement).on('vmousedown', function(event){
            mouseMovedSinceMouseDown = false;
            if(event.originalEvent.originalEvent instanceof MouseEvent){
                if(event.originalEvent.button == 0){  

                } else {
                    return;
                }
            } 
            render(); //Render so that the box is registered if it was only just created by the palette
            var mousePos = new THREE.Vector2(( event.clientX / window.innerWidth ) * 2 - 1,- ( event.clientY / window.innerHeight ) * 2 + 1);
            var result = intersectionTest(mousePos);
            if(!result)
                result = trySelectConnectionLine(mousePos);
            if(!result)
                tryClickInteractiveObject(mousePos);
            
        });
        
        $(renderer.domElement).on('vmousemove', function(event){
            if(event.originalEvent.originalEvent instanceof MouseEvent){
                if(event.originalEvent.button == 0){  

                } else {
                    return;
                }
            } 
            if(draggingConnection){
                dragConnection(event);
                event.stopImmediatePropagation();
            }
            else {
                if(!mouseMovedSinceMouseDown && transformControls.dragging && leftMouseDown){
                    if(event.ctrlKey){
                        DuplicateAndSelect(selectedObject);
                        
                    }
                    ClearForegroundScene();
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
                        var closest = checkForConnection(cPos, c, selectedObject);
                        if(closest !== null && c.connectedTo !== closest && closest.userData.tempDistSquared < distance){
                            closestConnector = closest;
                            distance = closest.userData.tempDistSquared;
                            thisConnector = c;
                        }
                    });
                    HighlightOverlappedConnector(closestConnector);
                }
                mouseMovedSinceMouseDown = true;
            }
            
        });
        
        
        $(renderer.domElement).on('vmouseup', function(event){
            if(event.originalEvent.originalEvent instanceof MouseEvent){
                if(event.originalEvent.button == 0){  
                    if (transformControls.dragging){
                        DropComponent(new THREE.Vector2(event.clientX, event.clientY));
                        mouseMovedSinceMouseDown = false;
                    }
                    if(draggingConnection){
                        event.stopImmediatePropagation();
                        completeConnection(event);
                    } 
                }
                return;
            } 
            if (transformControls.dragging){
                DropComponent(new THREE.Vector2(event.clientX, event.clientY));
                mouseMovedSinceMouseDown = false;
            }
            if(draggingConnection){
                //event.stopImmediatePropagation();
                completeConnection(event);
            }
        });

  
        
        //Create transform controls
        transformControls = new CustomTransformControls(camera, renderer.domElement,new THREE.Box3(new THREE.Vector3(-5,-2.5,-5), new THREE.Vector3(5,2.5,5)));
        //Create camera controls
        cameraControls = new CustomCameraControls(camera, renderer.domElement, new THREE.Box3(new THREE.Vector3(-5,-2.5,-5), new THREE.Vector3(5,2.5,5)), new THREE.Vector3(0,0,0));
        
        //Update camera/renderer/palette on window resize
        $(window).on('resize',function(){
            onWindowResize();
        });
        
        $("#button_simulate").on('click', trySimulation);
        
        //Bind keyboard commands
        bindKeys();
 
        $("#button_play_simulation").on('click', function(){
            if(animationIsDone){
                $("#button_rewind_simulation").click();
                animationIsDone = false;
            }
            playAnimation = true;
        });
        $("#button_stop_simulation").on('click', function(){
            playAnimation = false;
            
        });
        $("#button_rewind_simulation").on('click', function(){
            joints.forEach(function(j){
                j.currentFrame = 0;
            });
            objectCollection.forEach(function(obj){
               obj.currentFrame = 0; 
            });
            playAnimation = false;
        });

        
        
        $("#button_clear_objects").on('click', function(){
           deselectObject();
           while(objectCollection.length > 0){
               var toDelete = objectCollection.shift();
               scene.remove(toDelete);
           } 
           while(connections.length > 0){
               var toDelete = connections.shift();
               scene.remove(toDelete);
           }
           joints = [];
           initializeWorld();
           if(simulationMode)
               leaveSimulationMode();
        });
        
        
        
        
        loadModelFromFile("C:\\Users\\abn4\\Documents\\Dymola","LoadingTest.mo","LoadingTest");

    }
    
    function toggleFancy(){
        if(!isFancy){
            scene.remove(simpleRoom);
            scene.add(fancyRoom);
            scene.add(desk);
            scene.add(radio);
            scene.add(big_red_button);
            scene.add(screwdriver);
        } else {
            scene.add(simpleRoom);
            scene.remove(fancyRoom);
            scene.remove(desk);
            scene.remove(radio);
            scene.remove(big_red_button);
            scene.remove(screwdriver);
        }
        isFancy = !isFancy;
    }
    
    function initializeWorld() {
        world = palette.makeComponent("World","Playmola.SimpleWorld");
        world.parameters[0].currentValue = "9.81";
        world.parameters[1].currentValue = "{0,-1,0}";
        world.position.set(-0.5,0,0); 
    }
    
    function bindKeys(){
        $(document).bind('keydown', function(e) {
            if(e.keyCode == 13){ //enter
                //trySimulation();
            }
            else if(e.keyCode == 46){ //delete
                deleteSelectedObject();
            }
            else if (e.keyCode == 36){ //home
                camera.position.set(0,0.25,4);
            }    
            else if (e.keyCode == 67){ //c
                $('#cameraPos').toggle();
            }
            else if (e.keyCode == 77 && e.altKey){
                if(world.visible){
                    world.visible = false;
                    worldHidden = true;
                }
                else{
                    world.visible = true;
                    worldHidden = false;
                }
                e.preventDefault();
            }
            else if (e.keyCode == 71 && e.altKey){
                toggleFancy();
                e.preventDefault();
            }
            else if (e.keyCode == 77){ //m
                audio.stopMusic();
            }
        });
    }
    
    function getSecondsToSimulate(){
        var seconds = parseFloat($("#input_simulation_length").val());
        if(isNaN(seconds) || seconds > 6)
            seconds = 6;
        return seconds;
    }
    
    function trySimulation(){
        var source = generateModelicaCode(); 
        if(audio.isMusicPlaying){
            audio.stopMusic();
            audio.playSimulate();
        }
        try{
            if(dymolaInterface.setClassText("", source)){
                if(dymolaInterface.simulateModel("TestModel",0,getSecondsToSimulate(),0,0,"Dassl", 0.0001,0.0, "testmodelresults")){
                    enterSimulationMode();
                    audio.playAnimDone();
                }
                else{
                    audio.playError();
                    leaveSimulationMode();
                    alert(dymolaInterface.getLastError());
                }
            }
        }
        catch(err)
        {
            audio.playError();
            leaveSimulationMode();
            console.log(err.message);
        }
    }
    
    function enterSimulationMode(){
        deselectObject();
        simulationMode = true;
        if(schematicMode){
            $('#button_schematic_mode').click();
                   schematicMode = false;
               }
               joints.forEach(function(j){
               var times = [];
               for(var i = 0; i <= getSecondsToSimulate(); i+=1/60)
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
           
           objectCollection.forEach(function(obj){
              var times = [];
              for(var i = 0; i <= getSecondsToSimulate(); i+= 1/60){
                  times.push(i);
              }
              
              if(obj.userData.shouldAnimatePosition){
                  var positionsX = dymolaInterface.interpolateTrajectory("testmodelresults.mat",new Array(obj.name + ".r_0[1]"),times);
                  var positionsY = dymolaInterface.interpolateTrajectory("testmodelresults.mat",new Array(obj.name + ".r_0[2]"),times);
                  var positionsZ = dymolaInterface.interpolateTrajectory("testmodelresults.mat",new Array(obj.name + ".r_0[3]"),times);
                  var positions = [];
                  for(var j = 0; j < positionsX[0].length; j++){
                      positions.push(new THREE.Vector3(positionsX[0][j], positionsY[0][j], positionsZ[0][j]));
                  }
                  obj.animatePosition = positions;
              }
           });
        
        $("#button_play_simulation").css("visibility", "visible");
        $("#button_stop_simulation").css("visibility","visible");
        $("#button_rewind_simulation").css("visibility","visible");
        $("#button_rewind_simulation").click();
        
        //$("#input_simulation_length").css("visibility", "hidden");
    };
    
    function leaveSimulationMode(){
        simulationMode = false;
        if(audio.isMusicPlaying){
            audio.stopMusic();
            audio.playTheme();
        }
        joints.forEach(function(j){
            j.resetAnimation();
        });
        objectCollection.forEach(function(obj){
           if(obj.userData.shouldAnimatePosition){
               obj.resetAnimation();
           } 
        });
        playAnimation = false;
        $("#button_play_simulation").css("visibility", "hidden");
        $("#button_stop_simulation").css("visibility","hidden");
        $("#button_rewind_simulation").css("visibility","hidden");
        //$("#input_simulation_length").css("visibility", "visible");
    }
    
    function deleteSelectedObject(){
        if(selectedObject !== null && selectedObject.name !== "world"){

            for(var i = 0; i < connections.length; i++){
                if(connections[i].connectorA.getParent() === selectedObject || connections[i].connectorB.getParent() === selectedObject){
                    //Remove the connection from connectorA and connectorB's connectedTo arrays
                    connections[i].connectorA.connectedTo.splice(connections[i].connectorA.connectedTo.indexOf(connections[i].connectorB),1);
                    connections[i].connectorB.connectedTo.splice(connections[i].connectorB.connectedTo.indexOf(connections[i].connectorA),1);
                    //Remove the connection from the scene
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
            
            //Delete invisible objects if they are now disconnected (or ONLY connected to world)
            if(!schematicMode){
                for(var i = 0; i < objectCollection.length; i++){
                    if(!objectCollection[i].visible){
                        var noConnections = true;
                        for(var j = 0; j < objectCollection[i].connectors.length; j++){
                            if(objectCollection[i].connectors[j].connectedTo.length > 0){
                                if(!(objectCollection[i].connectors[j].connectedTo.length == 1 && objectCollection[i].connectors[j].connectedTo[0].getParent() === world))
                                    noConnections = false;
                            }
                            
                        }
                        if(noConnections){

                            //Delete
                            for(var k = 0; k < connections.length; k++){
                                if(connections[k].connectorA.getParent() === objectCollection[i] || connections[k].connectorB.getParent() === objectCollection[i]){
                                    //Remove the connection from connectorA and connectorB's connectedTo arrays
                                    connections[k].connectorA.connectedTo.splice(connections[k].connectorA.connectedTo.indexOf(connections[k].connectorB),1);
                                    connections[k].connectorB.connectedTo.splice(connections[k].connectorB.connectedTo.indexOf(connections[k].connectorA),1);
                                    //Remove the connection from the scene
                                    scene.remove(connections[k]);
                                    connections.splice(k,1);
                                    k--;
                                }
                            }
                            scene.remove(objectCollection[i]);
                            if(joints.indexOf(objectCollection[i]) != -1){
                                joints.splice(joints.indexOf(objectCollection[i]),1);
                            }
                            objectCollection.splice(i,1);
                            i--;

                        }
                        
                    }
                }
            }

        }
        if(selectedConnection !== null){
            //Remove the connection from connectorA and connectorB's connectedTo arrays
            selectedConnection.connectorA.connectedTo.splice(selectedConnection.connectorA.connectedTo.indexOf(selectedConnection.connectorB),1);
            selectedConnection.connectorB.connectedTo.splice(selectedConnection.connectorB.connectedTo.indexOf(selectedConnection.connectorA),1);
            //Remove the connection from the scene
            scene.remove(selectedConnection);
            connections.splice(connections.indexOf(selectedConnection),1);
            deselectConnection();
        }
    }
    
    var particleParent = null;
    var isWelding;
    function initParticleSystem(origin, parent){
        if(particleGroup)
            scene.remove(particleGroup.mesh);
        particleGroup = new SPE.Group({
                texture : THREE.ImageUtils.loadTexture('particle.png'),
                transparent : true,
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
                angleAlignVelocity:true,
                
                opacityStart: 1,
                opacityEnd: 1,

                sizeStart: 0.1,
                sizeEnd: 0.02,

                particleCount: 250
        });

        particleGroup.addEmitter( emitter );
        particleParent = parent;
        parent.add( particleGroup.mesh );
        audio.playWelding();
        isWelding = true;
        setTimeout(shutdownParticleSystem, 1600);
    }
    
    function shutdownParticleSystem(){
        particleParent.remove(particleGroup.mesh);
        particleParent = null;
        particleGroup = null;
        audio.stopWelding();
        isWelding = false;
    }
    
    
    
    function loadModel(object, centerOfMass, connectionPoints){
        //Extract the part of the Object3D containing the meshes and puts it in a 
        //new object positioned at the center of mass
        var obj = new DymolaComponent();
        obj.typeName = "Playmola.Body";
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
     
            
            var connPoint = new Connector();
            connPoint.add(new THREE.Mesh(new THREE.SphereGeometry(0.05,20,20),new THREE.MeshPhongMaterial({color:0xff0000})));
            
            connPoint.position.copy(connectionPoints[i].position.clone().sub(centerOfMass));
            connPoint.actualPosition = connPoint.position.clone();
            connPoint.userData.isConnector = true;
            connPoint.userData.name = i == 0 ? "frame_a" : "frame_b";
            obj.add(connPoint);
            obj.connectors.push(connPoint);

            connectionPoints[i].parentObject = obj; //Record the Object3D this ConnectionPoint is attached to for future reference!
        }

        return obj;
    }
    
    //Resets the cameras and renderers when the window is resized
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
    
    

    //Returns true if an intersection was found, false otherwise
    function intersectionTest(mousePos){
//        if(dontCheckConnectors){
//            dontCheckConnectors = false;
//            return true;
//        }
        
        //Only allow selection and deselection if the controls are enabled
        if(!disableControls){

            raycaster.setFromCamera(mousePos, camera);
            var intersectionFound = null;
            var distance = 1000000;
            for(var i = 0; i < objectCollection.length; i++){
                if(!objectCollection[i].visible) //Don't allow selection of invisible objects
                    continue;
                var intersect = raycaster.intersectObject(objectCollection[i],true);
                if(intersect.length > 0){
                    if(intersect[0].distance < distance){
                        distance = intersect[0].distance;
                        intersectionFound = objectCollection[i];
                    }
                }
            }

            //Check if the intersected  object was a DymolaComponent and check if the intersection was on a connector
            if(!isWelding && !dontCheckConnectors && intersectionFound !== null && (intersectionFound.type == 'DymolaComponent' || intersectionFound instanceof DymolaComponent)){
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
         
            
            dontCheckConnectors = false;
            //Don't reselect the currently selected object
            if(intersectionFound === selectedObject && selectedObject !== null){
                return true;
            }
            //Select the new object
            if(intersectionFound !== null){
                selectObject(intersectionFound);
                return true;
            }
            deselectObject();
            deselectConnection();
            return false;
        }
    }
    
    function selectObject(object){
        deselectObject();
        deselectConnection();
        selectedObject = object;
        //initParticleSystem(object.position);
        transformControls.attach(selectedObject);
        
        //Change the selected object's material so it looked "selected"
        selectedObject.traverse(function(child){
            if(child instanceof THREE.Mesh){
                //if(child.userData.initColor === undefined)
                child.oldMaterial = child.material;
                //child.material.color = new THREE.Color(0xB0E2FF);
                child.material = new THREE.MeshPhongMaterial( { color: 0x000000, specular: 0x666666, emissive: 0xff0000, shininess: 10, shading: THREE.SmoothShading, opacity: 0.9, transparent: true } )
             }
        });
        
        //Set up the parameters panel for this object
        if(selectedObject instanceof DymolaComponent){
            $("#detailsPanel").css({"overflow-y":"auto"});
            $("#detailsPanel").panel("open");
            $("#parameters").append("<label>" + selectedObject.typeName +"</label>");
            $("#parameters").append("<button id='delete_button' style='margin-bottom:30px'>Delete</button>");
            $("#delete_button").on('click', function(){
                $("#detailsPanel").panel("close");
                deleteSelectedObject();
            })
        selectedObject.initialName = selectedObject.name;
        $("#parameters").append('<div id="objectName_" style="padding-bottom:5px">');
        $("#objectName_").append('<label for="objectName">' + 'Name' + '</label>'); 
        var value = 'value = ' + selectedObject.name;
        $("#objectName_").append('<span><input name="' + 'objectName' + '" id="' + 'objectName' + '"' + value + ' data-mini="true" data-role="none"></span>');
        $("#objectName_").append('<div class="clear"></div>');
        $("#objectName").on('input', function() {
            var newName = $(this).val();
            for(var i = 0; i < objectCollection.length; i++){
                if(selectedObject !== objectCollection[i] && newName === objectCollection[i].name){
                    selectedObject.name = selectedObject.initialName;
                    return;
                }
            }
            selectedObject.name = $(this).val(); 
        });
        
            for(var i = 0; i < selectedObject.parameters.length; i++){
                generateNewDetailsForm(selectedObject.parameters[i]);
            }
            if(selectedObject.colorSettings !== undefined){
                for(var i = 0; i < selectObject.colorSettings.length; i++){
                    generateNewDetailsForm(selectedObject.colorSettings[i]);
                }
            }
            $("#detailsPanel").enhanceWithin();
        }
    }
    
    
    function deselectObject(){
        if(selectedObject)
        {
            $("#detailsPanel").panel("close");
            selectedObject.traverse(function(child){
               if(child instanceof THREE.Mesh)
                   child.material = child.oldMaterial;
            });
            transformControls.detach(selectedObject);
            selectedObject = null;
            //shutdownParticleSystem();
        }
    }
    
    function selectConnection(c){
        deselectObject();
        deselectConnection();
        c.select();
        selectedConnection = c;
    }
    
    function deselectConnection(){
        if(selectedConnection !== null){
            selectedConnection.deselect();
            selectedConnection = null;
        }
    }
    
    function trySelectConnectionLine(mousePos){
        raycaster.setFromCamera(mousePos, camera);
        var intersectionFound = null;
        var distance = 1000000;
        for(var i = 0; i < connections.length; i++){
            var intersect = raycaster.intersectObject(connections[i],true);
            if(intersect.length > 0){
                if(intersect[0].distance < distance){
                    distance = intersect[0].distance;
                    intersectionFound = connections[i];
                }
            }
        }
        if(intersectionFound){
            selectConnection(intersectionFound);
            return true;
        }
        return false;
    }
    
    function tryClickInteractiveObject(mousePos){
        if(!isFancy) return;
        
        raycaster.setFromCamera(mousePos, camera);

        var intersect = raycaster.intersectObject(radio,true);
        if(intersect.length > 0){
            audio.playClick();
            if(audio.isMusicPlaying)
                audio.stopMusic();
            else{
                if(simulationMode)
                    audio.playSimulate();
                else
                    audio.playTheme();
            }
        }
        intersect = raycaster.intersectObject(big_red_button,true);
        if(intersect.length > 0){
            audio.playClick();
            trySimulation();
        }

    }
    
    
    function loadModelFromFile(path, package, model){
//        dymolaInterface.openModelFile(path,package);
//        
//        
//        var res = dymolaInterface.Dymola_AST_ClassesInPackageWithProperties(model);
//        
//        var components = dymolaInterface.ModelManagement_Structure_AST_ComponentsInClassAttributes(model);
//        
//        for(var i = 0; i < components.length; i++){
//            var c = palette.makeComponentUnkownCategory(components[i].fullTypeName);
//            c.position.set(0,0,0);
//            
//            //Set all the parameters....
//            
//            
////            var params = [];
////            params.push(components[i].fullTypeName);
////            params.push(componentsInClass[j]);
////            if(dymolaInterface.callDymolaFunction("Dymola_AST_ComponentVariability", params) === "parameter"){
////            
////            for(var j = 0; j < c.parameters.length;)
//        }
        
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
            
            var closest = checkForConnection(new THREE.Vector3(event.clientX, event.clientY, 0), draggingFrom);
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
    
    function checkForConnection(position, startConnector, toExclude){
        var widthHalf = window.innerWidth / 2;
        var heightHalf = window.innerHeight / 2;
        var distance = 1000000;
        var closest = null;

        for(var i = 0; i < objectCollection.length; i++){
            if(objectCollection[i].visible){
                for(var j = 0; j < objectCollection[i].connectors.length; j++){
                    //If an object to be excluded has been specified, skip its connectors
                    if(toExclude !== undefined && toExclude == objectCollection[i]) break;
                    //Don't allow connecting a connector to itself or to an incompatible connector
                    if(objectCollection[i].connectors[j] !== startConnector && CanBeConnected(objectCollection[i].connectors[j],startConnector)){
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
            }
        }
        return closest;
    }
    
    //If a connection line is being drawn and the mouse button is released, check for a potential connection
    function completeConnection(event){
        if(!isWelding){
            if(draggingConnection){
                scene.remove(connectionLine);
                connectionLine = null;

                var closest = checkForConnection(new THREE.Vector3(event.clientX, event.clientY, 0), draggingFrom);

                if(closest !== null){
                    var connection = new Connection(draggingFrom, closest);

                    connections.push(connection);
                    scene.add(connection);
                    if(!schematicMode){
    //                    var pos = closest.position.clone();
    //                    closest.parent.localToWorld(pos);
                        initParticleSystem(THREE.Vector3(0,0,0), closest);
                    }
                    if(CheckKinematicLoop(connection)){
                        selectConnection(connection);
                        deleteSelectedObject();

                        var bushing = palette.makeComponent("HiddenComponents","Playmola.SimpleBushing");
                         //Position the new joint half way between the two connectors
                        var p1 = draggingFrom.position.clone();
                        draggingFrom.parent.localToWorld(p1);
                        var p2 = closest.position.clone();
                        closest.parent.localToWorld(p2);
                        bushing.position.copy(p1.add(p2).multiplyScalar(0.5));

                        var connection1 = new Connection(draggingFrom, bushing.frameAConnector);
                        connections.push(connection1);
                        scene.add(connection1);
                        var connection2 = new Connection(bushing.frameBConnector, closest);
                        connections.push(connection2);
                        scene.add(connection2);

                        //alert("!KINEMATIC LOOP!");
                    } 

                    audio.playClick();

                }

                draggingConnection = false;
                draggingFrom = null;
                transformControls.dragging = false;
                ClearForegroundScene();
            }
            if(!schematicMode) self.exitSchematicMode();
        }
    }

    
    function HighlightSelectableConnectors(){
        
    }
    
    function HighlightCompatibleConnectors(dymolaComponent){
        if(dymolaComponent instanceof Connector){
            objectCollection.forEach(function(o){
                if(o !== dymolaComponent.getParent() && o.visible){
                    o.connectors.forEach(function(c){
                        
                        if(CanBeConnected(c,dymolaComponent)){

                            //Make a sphere:
                            var sphere = new THREE.Mesh( new THREE.SphereGeometry(connectorHightlightRadius*sceneScale, 20,20), new THREE.MeshPhongMaterial( {color: 0xff00ff, opacity: 0.5, transparent: true} ) );                     
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
                if(o !== dymolaComponent && o.visible){
                    o.connectors.forEach(function(c){
                        for(var i = 0; i < dymolaComponent.connectors.length; i++){
                            if(CanBeConnected(c,dymolaComponent.connectors[i]) && c.connectedTo !== dymolaComponent.connectors[i]){

                                //Make a sphere:
                                var sphere = new THREE.Mesh( new THREE.SphereGeometry(connectorHightlightRadius*sceneScale, 20,20), new THREE.MeshPhongMaterial( {color: 0xff00ff, opacity: 0.5, transparent: true} ) );                     
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
            c.scale.set(1,1,1);
        });
        if(connector !== null && connector.foregroundBuddy !== undefined){
            connector.foregroundBuddy.material.opacity = 1.0;
            connector.foregroundBuddy.material.color.setHex(0xffff00);
            connector.foregroundBuddy.scale.set(1.5,1.5,1.5);
        }
    }
    
    function ClearForegroundScene(){
        foregroundConnectors.forEach(function(c){
            foregroundScene.remove(c);
        });
        foregroundConnectors.length = 0;
    }
    

    function generateNewDetailsForm(parameter){
        var id = "id"+parameter.name;
        $("#parameters").append('<div id="' + id +'_" style="padding-bottom:5px">');
        $("#"+id+"_").append('<label for="'+id+'">'+ parameter.name + '' +'</label>'); 
        var value = (typeof parameter.currentValue !== 'undefined') ? 'value="' + parameter.currentValue + '"' : "";
        if(parameter.fullTypeName === "Boolean"){
            $("#"+id+"_").append('<span><input name="' + id + '" id="' + id + '" type="checkbox" data-role="none" data-mini="true"></span>');
        }
        else if(isVector(parameter)){
            var xyz = parameter.currentValue.toString().replace("{","").replace("}","").split(",");
            $("#"+id+"_").append('<span><div style="display:inline-block"><input name="' + id + "x" + '" id="' + id + "x" + '" placeholder="x"' + "value=" + xyz[0] + ' data-mini="true" data-role="none" style="width:25px"></div>' 
                    + '<div style="display:inline-block"><input name="' + id + "y" + '" id="' + id + "y" + '" placeholder="y"' + "value=" + xyz[1] + ' data-mini="true" data-role="none" style="width:25px"></div>' 
                    + '<div style="display:inline-block"><input name="' + id + "z" + '" id="' + id + "z" +'" placeholder="z"' + "value=" + xyz[2] + ' data-mini="true" data-role="none" style="width:25px"></div></span>');
        } 
        else if (parameter.fullTypeName === "Color"){
            //var col =  parameter.currentValue.toString(16).substring(2);
            $("#"+id+"_").append('<span><input name="' + id + '" id="' + id + '" type="color" id="html5colorpicker"  data-role="none" ' + value + '"></span>');

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
               if(schematicMode){
                    self.exitSchematicMode();
                    self.enterSchematicMode();
               }
            });
            
        }
        else if(isVector(parameter)){
            $('#'+id + "x").on('input', function(){
               var xVal = $(this).val();
               var yVal = $('#' + id + "y").val();
               var zVal = $('#' + id + "z").val();
               parameter.changed = true;
               if(xVal == "" || yVal == "" || zVal == "")
                   parameter.changed = false;
               var currentValue = "{" + xVal + "," + yVal + "," + zVal + "}";
               parameter.currentValue = currentValue;
               if(parameter.callback !== undefined)
                    parameter.callback.call(selectedObject, currentValue);
                if(schematicMode){
                    self.exitSchematicMode();
                    self.enterSchematicMode();
               }
            });
               $('#'+id + "y").on('input', function(){
               var xVal = $('#' + id + "x").val();
               var yVal = $(this).val();
               var zVal = $('#' + id + "z").val();
               parameter.changed = true;
               if(xVal == "" || yVal == "" || zVal == "")
                   parameter.changed = false;
               var currentValue = "{" + xVal + "," + yVal + "," + zVal + "}";
               parameter.currentValue = currentValue;
               if(parameter.callback !== undefined)
                   parameter.callback.call(selectedObject, currentValue);
               if(schematicMode){
                    self.exitSchematicMode();
                    self.enterSchematicMode();
               }
               
            });
               $('#'+id + "z").on('input', function(){
               var xVal = $('#' + id + "x").val();
               var yVal = $('#' + id + "y").val();
               var zVal = $(this).val();
               parameter.changed = true;
               if(xVal == "" || yVal == "" || zVal == "")
                   parameter.changed = false;
               var currentValue = "{" + xVal + "," + yVal + "," + zVal + "}";
               parameter.currentValue = currentValue;
               if(parameter.callback !== undefined)
                   parameter.callback.call(selectedObject, parameter.currentValue);
               if(schematicMode){
                    self.exitSchematicMode();
                    self.enterSchematicMode();
               }
            });
            
        }
        else{
            $("#"+id).on('input', function(){
               parameter.currentValue = $(this).val();
               parameter.changed = true;
               if($(this).val() == "")
                   parameter.changed = false;
               if(parameter.callback !== undefined)
                   parameter.callback.call(selectedObject, parameter.currentValue);
               
               if(schematicMode){
                    self.exitSchematicMode();
                    self.enterSchematicMode();
               }
            });
        }
        $("#detailsPanel").enhanceWithin();
        
        //alert($("#parameters").html());
        //alert($("#"+id+"_ label").attr('class'));
    }
    
    function isVector(parameter){
        return (parameter.fullTypeName === "Modelica.SIunits.Position" && parameter.sizes[0] === 3) ||
                (parameter.fullTypeName === "SI.Position" && parameter.sizes[0] === 3) ||
                 parameter.fullTypeName === "Modelica.Mechanics.MultiBody.Types.Axis" ||
                 parameters.fullTypeName === "Types.Axis";
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
    
    
    var connectorFrom, connectorTo;
    
    function DropComponent(dropPos){
        ClearForegroundScene();
        if(selectedObject && mouseMovedSinceMouseDown && !isWelding){

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
                var closest = checkForConnection(cPos, c, selectedObject);
                if(closest !== null && c.connectedTo !== closest && closest.userData.tempDistSquared < distance){
                    closestConnector = closest;
                    distance = closest.userData.tempDistSquared;
                    thisConnector = c;
                }
            });
            

            if(closestConnector !== null && thisConnector !== null){
                if(thisConnector.userData.name == "frame_b"){
                    connectorFrom = thisConnector;
                    connectorTo = closestConnector;
                } else {
                    connectorTo = thisConnector;
                    connectorFrom = closestConnector;
                }
                $( "#jointPopup" ).popup('open', {x:dropPos.x,y:dropPos.y });
            }
        }
        
        
    }
    
    this.connectObjects = function(jointType){
        if(!isWelding){
            if(jointType == "none"){
                var connection = new Connection(connectorFrom, connectorTo);
                connections.push(connection);
                scene.add(connection);
                initParticleSystem(THREE.Vector3(0,0,0), connectorTo);
                audio.playClick();
            } else {
                var joint = palette.makeComponent("Joints", jointType);
                if(joint != null){
                    //Position the new joint half way between the two connectors
                    var p1 = connectorFrom.position.clone();
                    connectorFrom.parent.localToWorld(p1);
                    var p2 = connectorTo.position.clone();
                    connectorTo.parent.localToWorld(p2);
                    joint.position.copy(p1.add(p2).multiplyScalar(0.5));

                    var connection1 = new Connection(connectorFrom, joint.frameAConnector);
                    connections.push(connection1);
                    scene.add(connection1);
                    var connection2 = new Connection(joint.frameBConnector, connectorTo);
                    connections.push(connection2);
                    scene.add(connection2);

                    initParticleSystem(THREE.Vector3(0,0,0), connectorTo);

                    if(CheckKinematicLoop(connection2)){
                        selectConnection(connection2);
                        deleteSelectedObject();

                        var bushing = palette.makeComponent("HiddenComponents","Playmola.SimpleBushing");
                         //Position the new joint half way between the two connectors
                        var p1 = joint.frameBConnector.position.clone();
                        joint.frameBConnector.parent.localToWorld(p1);
                        var p2 = connectorTo.position.clone();
                        connectorTo.parent.localToWorld(p2);
                        bushing.position.copy(p1.add(p2).multiplyScalar(0.5));

                        var connection3 = new Connection(joint.frameBConnector, bushing.frameAConnector);
                        connections.push(connection3);
                        scene.add(connection3);
                        var connection4 = new Connection(bushing.frameBConnector, connectorTo);
                        connections.push(connection4);
                        scene.add(connection4);

                        //alert("!KINEMATIC LOOP!");
                    }
                    audio.playClick();


                }
            }

            if(!schematicMode) self.exitSchematicMode();
        }
    };



    this.cancelConnectObjects = function(){
        disableControls = false;
        //selectObject(selectedObject);
        transformControls.dragging = false;
    };
    
    this.enterSchematicMode = function(){
        if(!schematicMode){
            palette.unhideCategory("Joints");
            palette.unhideCategory("Components");
        }
        
        if(simulationMode)
            leaveSimulationMode();
        
        joints.forEach(function(j){
            j.resetAnimation();
            j.enforceConstraint(); 
        });
        
        objectCollection.forEach(function(obj){
           if(obj.userData.shouldAnimatePosition){
               obj.resetAnimation();
           } 
        });
        constrainComponents();
        
        

        var stack = [];
        world.connectors.forEach(function(c){
            stack.push(c);
        });
        var translations = [];
        translations.push(new THREE.Vector3(0,0,0));
        
        while(stack.length > 0){
            var connector = stack.pop();  
            var baseT = translations.pop();
            connector.connectedTo.forEach(function(connectedTo){
                //Stop at a bushing or if the connector isn't a frame
                if((connectedTo.userData.name == "frame_a" || connectedTo.userData.name == "frame_b") && connectedTo.getParent().typeName != "Playmola.SimpleBushing" && connectedTo.getParent() !== connector.userData.prev){
                    
                    //Push components apart:
                    var dist = 0.7;
                    if(connector.getParent() === world)
                        dist = 0.7;
                    
                    var t;
                    
                    //var q;
                    if(connectedTo.getParent().getExplosionQuaternion !== undefined)
                        t = new THREE.Vector3(dist*sceneScale,0,0).applyQuaternion(connectedTo.getParent().getExplosionQuaternion()).add(baseT);
                    else if(connector.getParent().getExplosionQuaternion !== undefined)
                        t = new THREE.Vector3(dist*sceneScale,0,0).applyQuaternion(connector.getParent().getExplosionQuaternion()).add(baseT);
                    else
                        t = new THREE.Vector3(dist*sceneScale,0,0).applyQuaternion(connectedTo.getParent().quaternion.clone()).add(baseT);
                    
//                    var q_ = new THREE.Quaternion();
//                    if(connector.getParent().getExplosionQuaternion !== undefined)
//                        q_ = connector.getParent().getExplosionQuaternion();
//                    
//                    
//                    var t = new THREE.Vector3(dist*sceneScale,0,0).applyQuaternion(new THREE.Quaternion().multiplyQuaternions(q,q_)).add(baseT); 
                    connectedTo.getParent().position.add(t);
           
                    connectedTo.getParent().connectors.forEach(function(c){
                        if(c.userData.name == "frame_a" || c.userData.name == "frame_b"){
                            c.userData.prev = connector.getParent();
                            stack.push(c);
                            translations.push(t);
                        }
                    });
                }
            });
            connector.userData.prev = undefined;
        }
        

        connections.forEach(function(c){
           c.visible = true; 
        });
        objectCollection.forEach(function(o){
            o.visible = true;
        });
        schematicMode = true;
        
    }
   
    
    this.exitSchematicMode = function(){
        if(schematicMode){
            palette.hideCategory("Joints");
            palette.hideCategory("Components");
            palette.selectCategory("Bodies");
            $('#select-custom-1').val("Bodies").selectmenu('refresh');
        }

        connections.forEach(function(c){
           c.visible = false; 
        });
        objectCollection.forEach(function(o){
            if(o.typeName == "Playmola.SimpleBodyBox" || o.typeName == "Playmola.SimpleBodyCylinder" || (o.typeName == "Playmola.SimpleWorld" && !worldHidden) || o.typeName == "Playmola.Body"){
                o.visible = true;
            } else {
                o.visible = false;
            }
        });
        schematicMode = false;
        

    };
    

    var jointsDoneMoving = 0;
    function logic() {
        //moveObjects();
        
//        if(transformControls.dragging && selectedObject && !schematicMode){
//            ClearForegroundScene();
//            HighlightCompatibleConnectors(selectedObject);
//        }
        
        if(!disableControls){
            cameraControls.update();
        }
        transformControls.update();
        if(palette != null) palette.update();
        
        
        if(!schematicMode){
            joints.forEach(function(j){
               j.enforceConstraint(); 
               //j.animationUpdatedThisFrame = false;
               if(j.isAnimationDone())
                   jointsDoneMoving++;
            });
            
            objectCollection.forEach(function(obj){
               if(obj.userData.shouldAnimatePosition){
                   obj.animateFrame();
               } 
            });
            
            if(joints.length > 0 && jointsDoneMoving == joints.length){
                audio.playAnimDone();
                jointsDoneMoving = 0;
                animationIsDone = true;
            }
            constrainComponents();
        }
        
        connections.forEach(function(c){
            c.update();
        });
        
        //Update the axis helper's position
//         var lookAt = new THREE.Vector3(0,0, -1).applyQuaternion(camera.quaternion);
//        var left = new THREE.Vector3(-1,0, 0).applyQuaternion(camera.quaternion);
//        var down = new THREE.Vector3(0,-1, 0).applyQuaternion(camera.quaternion);
//        lookAt.multiplyScalar(3);
//        left.multiplyScalar(2.1);
//        down.multiplyScalar(1);
//        axisHelper.position.copy(camera.position.clone().add(lookAt).add(left).add(down));

        
 
        requestAnimationFrame(render);
    }
    
    function constrainComponents(){
        //Enforce CONNECTION constraints here:
        objectCollection.forEach(function(o){
            o.userData.constrained = false;
        });
        if(world != null){
            world.connectors.forEach(function(c){
                resolveConnection(c);
            });
        }
        objectCollection.forEach(function(o){
            if(!o.userData.constrained){
                o.connectors.forEach(function(c){
                    resolveConnection(c);
                });
            }
        });
    }
    
    //from is the connector we just came from, so don't go back there!
    function resolveConnection(c, from){
        //Loop through the connectors c is connected to
        c.connectedTo.forEach(function(connectedTo){
            //Don't go back to the connector we just came from
            if(connectedTo === from){
                return;
            }
            
            if(connectedTo.userData.name == "frame_a"){
            
                //Rotate the object connected to frame B
                var q = c.getParent().quaternion.clone();
                q.multiply(c.actualOrientation);
                q.multiply(connectedTo.actualOrientation);
                connectedTo.getParent().quaternion.copy(q);
                connectedTo.getParent().updateMatrixWorld(true);

                //Move the object connected to frame B
                //var connAWorld = c.actualPosition.clone().multiplyScalar(1/c.getParent().scale.x * sceneScale * c.getParent().userData.sceneScale); //FIX SCALE HERE!
                var connAWorld = c.actualPosition.clone();//.multiplyScalar(c.getParent().userData.sceneScale);
                c.getParent().localToWorld(connAWorld);
                var connBWorld = connectedTo.actualPosition.clone().multiplyScalar(1/connectedTo.getParent().scale.x * sceneScale * connectedTo.getParent().userData.sceneScale);
                connectedTo.getParent().localToWorld(connBWorld);
                connectedTo.getParent().position.sub(connBWorld.sub(connAWorld));
                connectedTo.getParent().updateMatrixWorld(true);

                connectedTo.getParent().userData.constrained = true;

                //Stop at a bushing
                if(connectedTo.getParent().typeName != "Playmola.SimpleBushing"){
                    connectedTo.getParent().connectors.forEach(function(c_){
                        resolveConnection(c_, c);
                    });
                }
            }
        });

    }
    
    //Assumes there wasn't ALREADY an unhandled kinematic loop!
    function CheckKinematicLoop(connection){

        var start = connection.connectorA;
        //Needs frames to be part of a kinematic loop
        if(start.userData.name != "frame_a" && start.userData.name != "frame_b") return false;
        var first = true;
        var stack = [];
        stack.push(start);
        
        while(stack.length > 0){
            var connector = stack.pop();
            if(connector === start && !first){
                return true;
            } else {
                first = false;
            }
            
            connector.connectedTo.forEach(function(connectedTo){
                //Stop at a bushing or if the connector isn't a frame
                if((connectedTo.userData.name == "frame_a" || connectedTo.userData.name == "frame_b") && connectedTo.getParent().typeName != "Playmola.SimpleBushing" && connectedTo.getParent() !== connector.userData.prev){
                    connectedTo.getParent().connectors.forEach(function(c){
                        if(c.userData.name == "frame_a" || c.userData.name == "frame_b"){
                            c.userData.prev = connector.getParent();
                            stack.push(c);
                        }
                    });
                }
            });
            connector.userData.prev = undefined;
        }
        return false;
   
    }
    
    
    function DuplicateAndSelect(component){
        if(isWelding) return;
        
        deselectObject();
        var duplicate = component.clone();
        duplicate.traverse(function(o){
            
            if(o.material !== undefined) {
                o.material = o.material.clone();
            }
        });
        duplicate.name = "obj" + objCounter;
        objCounter++;
        if(IsJoint(component)) joints.push(duplicate);
        objectCollection.push(duplicate);
        selectObject(duplicate);
        scene.add(duplicate);
        transformControls.dragging = true;
    }
    
    
    function CanBeConnected(A,B){
        if((A.name == "frame_a" || A.name == "frame_b") && AreComponentsDirectlyConnectedViaJoints(A.getParent(),B.getParent())) return false;
        if(A === B) return false;
        if(A.getParent() === B.getParent()) return false;
        
        for(var i = 0; i < B.connectedTo.length; i++){
            if(A === B.connectedTo[i])
                return false;
        }
        
        
        //Don't allow two things to be connected to the same connector in 3D mode
        if(!schematicMode){
            if(A.connectedTo.length != 0 || B.connectedTo.length != 0)
                return false;
        }
        
        if(A.userData.name == "frame_a"){
            if(B.userData.name == "frame_b")
                return true;
            return false;
        }
        if(A.userData.name == "frame_b"){
            if(B.userData.name == "frame_a")
                return true;
            return false;
        }
        if(A.userData.name != "frame_a" && A.userData.name != "frame_b"){
            if(B.userData.name == "frame_a" || B.userData.name == "frame_b")
                return false;
            return true;
        }
        return true;
    }
    
    function AreComponentsDirectlyConnected(A,B){
        for(var i = 0; i < A.connectors.length; i++){
            for(var j = 0; j < A.connectors[i].connectedTo.length; j++){
                if(A.connectors[i].connectedTo[j].getParent() == B)
                    return true;
            }
        }
        return false;
    }
    
    function AreComponentsDirectlyConnectedViaJoints(A,B){
        for(var i = 0; i < A.connectors.length; i++){
            for(var j = 0; j < A.connectors[i].connectedTo.length; j++){
                if(A.connectors[i].connectedTo[j].getParent() == B)
                    return true;
                
                if(IsJoint(A.connectors[i].connectedTo[j].getParent())){
                    var ret = AreComponentsDirectlyConnected(A.connectors[i].connectedTo[j].getParent(),B);
                    if(ret)
                        return true;
                }
            }
        }
        return false;
    }
    
    function IsJoint(component){
        if(component.typeName == "Playmola.SimpleRevoluteJoint"
                || component.typeName == "Playmola.SimplePrismaticJoint"
                || component.typeName == "VisualMultiBody.Joints.RollingWheel") return true;
        return false;
    }
    
    
    function render(){
        if(selectedObject){
            var timer = 0.0001 * Date.now();
            selectedObject.traverse(function(child){
                if(child instanceof THREE.Mesh){
                    if(child.oldMaterial !== undefined){
                        child.material.emissive.setHSL( child.oldMaterial.color.getHSL().h, child.oldMaterial.color.getHSL().s, 0.35 * ( 0.65 + 0.35 * Math.cos( 35 * timer ) ) );
                        
                    }
                    
                }
            });
        }

        renderer.clear();
        if(particleGroup)
            particleGroup.tick();
        renderer.render(scene,camera);
        renderer.clearDepth();
        renderer.render(foregroundScene, camera);
        renderer.clearDepth();
        if(palette != null) palette.render(renderer);
    }
    
    init();
    //loadModels();
    setInterval(logic, 1000/60);
}

var playmola = new Playmola();

