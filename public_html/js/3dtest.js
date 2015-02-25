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
    var connectionLines = [];
    var objectCollection = []; //Collection of all active objects in scene
    var selectedObject = null;
    var closestObject; // Target object of currently selected object
    var connectionPoint1; //Connection point of selected object
    var connectionPoint2; //Connection point of targeted object
    var connectionMarker; //Sphere for visualising connection on target object
    
    var mousePos;
    var disableControls = false;
    var schematicMode = false;
    
    function ConnectionPoint(position){
        this.position = new THREE.Vector3();
        this.position.copy(position);
        this.connectable = true;
        this.connectedTo = null; //The ConnectionPoint this is connected to
        this.parentObject = null; //The Object3D this is attached to
        this.coordinateSystem = new THREE.Matrix4();
        this.coordinateSystem.makeBasis(new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1)); //Default coordinate system
    }
    
    function ConnectionLine(start,end){
        var startPos = new THREE.Vector3();
        var endPos = new THREE.Vector3();
        
        startPos = start.position.clone();
        start.parentObject.localToWorld(startPos);
        endPos = end.position.clone();
        end.parentObject.localToWorld(endPos);
        
        
        
        var material = new THREE.LineDashedMaterial({
                color: 0x000000, linewidth: 2, dashSize: 0.001, scale: 5
        });

        var geometry = new THREE.Geometry();
       
        
        geometry.vertices.push(
                startPos,
                endPos
        );

        var line = new THREE.Line( geometry, material, THREE.LineStrip );
        scene.add( line );
        
        this.update = function(){

            startPos = start.position.clone();
            start.parentObject.localToWorld(startPos);
            endPos = end.position.clone();
            end.parentObject.localToWorld(endPos);
            
            
            var geometry = new THREE.Geometry();


            geometry.vertices.push(
                    startPos,
                    endPos
            );
            scene.remove(line);
            line = new THREE.Line(geometry, material);
            scene.add(line);
        }
    }
    
    function init(){
        renderer = new THREE.WebGLRenderer({antialias:true});
        renderer.setClearColor( 0x7EC0EE, 1 );
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.autoClear = false;
        document.querySelector("#container").appendChild(renderer.domElement);

        camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,1000);
        camera.position.set(200,0,50);
        
        createCameraControls();
        
        transformControls = new THREE.TransformControls( camera, renderer.domElement );
        transformControls.addEventListener( 'objectChange', checkForConnections );
        transformControls.addEventListener('mouseUp', onMouseUp );
        
        scene = new THREE.Scene();
        scene.add(camera);
        scene.add(transformControls);
        foregroundScene = new THREE.Scene();
        
//DymolaInterface Testkod!!
//        var interface;
//        try{
//            interface = new DymolaInterface();
//            var source;
//            var request = new XMLHttpRequest();
//            request.open("GET", "modelicaSource.txt", false);
//            request.send(null);
//            source = request.responseText;
//            
//            var result = interface.setClassText("", source);
//            interface.RunAnimation(false);
//            interface.simulateModel("Furuta",0,600000,0,0,"Dassl", 0.0001,0.0, "dsres");
//            interface.exportAnimation("D:/WebGL/HTML5ApplicationTest/HyperWeb/blabla2.wrl");
//            
//        }
//        catch(err)
//        {
//            console.log(err.message);
//        }

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
        window.addEventListener('click', intersectionTest, false);
        window.addEventListener( 'resize', onWindowResize, false );
			
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
    }
    function loadModels(){
        var loader = new THREE.VRMLLoader();
        function loadModel(object, centerOfMass, connectionPoints){
            //Extract the part of the Object3D containing the meshes and puts it in a 
            //new object positioned at the center of mass
            var obj = new THREE.Object3D();
            obj.translateX(centerOfMass.x);
            obj.translateY(centerOfMass.y);
            obj.translateZ(centerOfMass.z);
            obj.add(object.children[1]);
            obj.children[0].translateX(-centerOfMass.x);
            obj.children[0].translateY(-centerOfMass.y);
            obj.children[0].translateZ(-centerOfMass.z);
            obj.children.forEach(function(child) {
                saveColor(child);
            });
            obj.centerOfMass = centerOfMass;
            obj.connectionPoints = connectionPoints;
            var scaleFactor = 0.3;
            obj.position.set(scaleFactor*(Math.random()*2 - 1), scaleFactor*(Math.random()*2 - 1), scaleFactor*(Math.random()*2 - 1));
            obj.rotation.set(Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2);
            objectCollection.push(obj);
            scene.add(obj);
            
            obj.scale.set(100,100,100);

            obj.updateMatrixWorld(true);
            obj.updateMatrix();

            //Corrects the position of the connection points and initializes them
            for(var i = 0; i < connectionPoints.length; i++){
                var v = connectionPoints[i].position;
                v.sub(centerOfMass);
                connectionPoints[i].position = v;
                connectionPoints[i].parentObject = obj; //Record the Object3D this ConnectionPoint is attached to for future reference!
            }
        }
        function saveColor(object){
            if(object.hasOwnProperty('material'))
                object.userData.initColor = object.material.color;
            object.children.forEach(function(child){
                saveColor(child);
            });
        }
        loader.load("Piston_Study.wrl", function(object){
            loadModel(object, new THREE.Vector3(0.,-0.15149054405043,0.), new Array(new ConnectionPoint(new THREE.Vector3(0.,-0.14420647088485,0.))));
        });
        loader.load("Master_One_Cylinder.wrl", function(object){
            loadModel(object, new THREE.Vector3(-4.5e-2,0.,0.), new Array(new ConnectionPoint(new THREE.Vector3(-4.5e-2,0.,0.))));
        });
        loader.load("Rod_Study.wrl", function(object){
            loadModel(object, new THREE.Vector3(0.,-8.9431700693962e-2,2.4489282256523e-2), new Array(new ConnectionPoint(new THREE.Vector3(0.,-3.465692988818e-2,4.8978561933508e-2)), new ConnectionPoint(new THREE.Vector3(0.,-0.14420647088485,0.))));
        });
        loader.load("Cranck_Study.wrl", function(object){
            loadModel(object, new THREE.Vector3(-2.7054598934035e-2,-9.0702960410631e-3,1.2818607418443e-2), new Array(new ConnectionPoint(new THREE.Vector3(0.,-3.465692988818e-2,4.8978561933508e-2)), new ConnectionPoint(new THREE.Vector3(-4.5e-2,0.,0.))));
        });
    }
    function onMouseMove(event) {
	mousePos.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mousePos.y = - ( event.clientY / window.innerHeight ) * 2 + 1;	
    }
    function generateSphere(x,y,z, valid){
        var geometry = new THREE.SphereGeometry(0.005, 10,10);
        var material = valid ? new THREE.MeshBasicMaterial( {color: 0xffffff} ) : new THREE.MeshBasicMaterial( {color: 0x000000} );
        var sphere = new THREE.Mesh( geometry, material );
        sphere.position.set(x,y,z);
        return sphere;
    }
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
            if(selectedObject !== null)
                deselectObject();
            if(intersectionFound !== null)
                selectObject(intersectionFound);
        }
    }
    function selectObject(object){
        selectedObject = object;
        transformControls.attach(selectedObject);
        transformControls.setMode("translate");
        transformControls.setSpace("local");
        selectedObject.traverse(function(child){
            if(child instanceof THREE.Mesh)
                 child.material.color = new THREE.Color(0xB0E2FF);
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
            
            if(movingObjects[i].position.distanceTo(movingObjects[i].userData.targetPosition) < 0.001){
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
            
            for(var j = 0; j < connectionLines.length; j++){
                connectionLines[j].update();
            }
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

            $('#test').css('left', '' + mouseX + 'px').css('top', '' + mouseY + 'px').show();
            disableControls = true;
            transformControls.detach(selectedObject);
            foregroundScene.remove(connectionMarker);
            //self.connectObjects();
        }
    }
    this.connectObjects = function(){
        connectionMarker = null;
        if(connectionPoint1.connectable && connectionPoint2.connectable){
            //Set up the logical connection:
            connectionPoint1.connectedTo = (connectionPoint2.parent !== undefined) ? connectionPoint2.parent : connectionPoint2;
            connectionPoint2.connectedTo = (connectionPoint1.parent !== undefined) ? connectionPoint1.parent : connectionPoint1;
            
            
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
            connectionPoint1.connectable = false;
            if(connectionPoint1.parent !== undefined){
                connectionPoint1.parent.connectable = false;
                connectionPoint1.parent.connectedTo = (connectionPoint2.parent !== undefined) ? connectionPoint2.parent : connectionPoint2;
            }
            connectionPoint2.connectable = false;
            if(connectionPoint2.parent !== undefined){
                connectionPoint2.parent.connectable = false;
                connectionPoint2.parent.connectedTo = (connectionPoint1.parent !== undefined) ? connectionPoint1.parent : connectionPoint1;
            }
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
        //Loop through all objects and scale down
        for(var i = 0; i < objectCollection.length; i++){
            if(objectCollection[i].group === undefined){
                //Do nothing, since this isn't a group
            } else {
                //This is a group, move objects apart along the axes of their connection points
                //Start with one object and traverse connections:
                schematicPushApart(objectCollection[i].children[0], null, new THREE.Vector3(0,0,0));
            }
        }
    }
    
    //CONNECTION LOOPS ARE NOT ALLOWED!
    function schematicPushApart(obj, prevObj, accumulatedTranslation){

        obj.userData.targetQuaternion = obj.quaternion.clone();
        obj.userData.targetPosition = obj.position.clone().add(accumulatedTranslation);
        obj.userData.targetObject = null;
        movingObjects.push(obj);

        for(var i = 0; i < obj.connectionPoints.length; i++){
            //Skip the object we came from
            if(obj.connectionPoints[i].connectable ||obj.connectionPoints[i].connectedTo.parentObject === prevObj)
                continue;
            
            //Create a pretty line:
            connectionLines.push(new ConnectionLine(obj.connectionPoints[i],obj.connectionPoints[i].connectedTo));
            
            var translation = new THREE.Vector3();
            var y = new THREE.Vector3();
            var z = new THREE.Vector3();
            obj.connectionPoints[i].coordinateSystem.extractBasis(translation,y,z);
            translation.multiplyScalar(0.2);
            var m = new THREE.Matrix4();
            m.extractRotation(obj.matrix)
            translation.applyMatrix4(m);
            translation.add(accumulatedTranslation);
            schematicPushApart(obj.connectionPoints[i].connectedTo.parentObject, obj,translation);
        }
    }
    
    this.exitSchematicMode = function(){
        
    }
    function logic() {
        moveObjects();
        requestAnimationFrame(render);
        if(!disableControls){
            cameraControls.update();
        }
        transformControls.update();
    }
    function render(){
        renderer.clear();
        renderer.render(scene,camera);
        renderer.clearDepth();
        renderer.render(foregroundScene, camera);
    }
    
    init();
    loadModels();
    setInterval(logic, 1000/60);
}

var playmola = new Playmola();

// //var newObj = new THREE.Object3D();
//        var vec1 = obj1.position.clone();
//        var vec2 = obj2.position.clone();
//        vec2.add(vec1);
//        vec2.multiplyScalar(0.5);
//        var obj1WorldMatrix = obj1.matrixWorld.clone();
//        var obj2WorldMatrix = obj2.matrixWorld.clone();
//        newGroup.position.copy(vec2);
//        obj1.position.sub(newGroup.position);
//        obj2.position.sub(newGroup.position);
//        newGroup.add(obj1);
//        newGroup.add(obj2);
//        newGroup.updateMatrix();
//        newGroup.updateMatrixWorld(true);
//        var newConnectionPoints = [];
//        for(var i = 0; i < obj1.connectionPoints.length; i++){
//            var newPosition = newGroup.worldToLocal(obj1.localToWorld(obj1.connectionPoints[i].position.clone()));
//            //newPosition.sub(newObj.position);
//            var newConnectionPoint = new ConnectionPoint(newPosition);
//            newConnectionPoint.connectable = obj1.connectionPoints[i].connectable;
//            newConnectionPoint.coordinateSystem.multiply(obj1WorldMatrix);
//            newConnectionPoint.coordinateSystem.multiply(newGroup.matrix);
//            newConnectionPoints.push(newConnectionPoint);
//        }
//        
//        for(var i = 0; i < obj2.connectionPoints.length; i++){
//            var newPosition = newGroup.worldToLocal(obj2.localToWorld(obj2.connectionPoints[i].position.clone()));
//            //newPosition.sub(newObj.position);
//            var newConnectionPoint = new ConnectionPoint(newPosition);
//            newConnectionPoint.connectable = obj2.connectionPoints[i].connectable;
//            newConnectionPoint.coordinateSystem.multiply(obj2WorldMatrix);
//            newConnectionPoint.coordinateSystem.multiply(newGroup.matrix);
//            newConnectionPoints.push(newConnectionPoint);
//        }
//        
//        //newConnectionPoints = newConnectionPoints.concat(obj1.connectionPoints, obj2.connectionPoints);
//        newGroup.connectionPoints = newConnectionPoints;
//        selectObject(newGroup);
//        var index = objectCollection.indexOf(obj1);
//        objectCollection.splice(index,1);
//        index = objectCollection.indexOf(obj2);
//        objectCollection.splice(index,1);
//        objectCollection.push(newGroup);
//        scene.add(newGroup);