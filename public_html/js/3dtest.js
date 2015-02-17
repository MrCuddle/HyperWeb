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
    var objectCollection = []; //Collection of all active objects in scene
    var selectedObject = null;
    var closestObject; // Target object of currently selected object
    var connectionPoint1; //Connection point of selected object
    var connectionPoint2; //Connection point of targeted object
    var connectionMarker; //Sphere for visualising connection on target object
    
    var mousePos;
    var disableControls = false;
    
    function ConnectionPoint(position){
        this.position = new THREE.Vector3();
        this.position.copy(position);
        this.connectable = true;
    }
    
    function init(){
        renderer = new THREE.WebGLRenderer({antialias:true});
        renderer.setClearColor( 0x7EC0EE, 1 );
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.autoClear = false;
        document.querySelector("#container").appendChild(renderer.domElement);

        camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,1000);
        camera.position.set(0.2,0,0.5);
        
        createCameraControls();
        
        transformControls = new THREE.TransformControls( camera, renderer.domElement );
        transformControls.addEventListener( 'objectChange', checkForConnections );
        transformControls.addEventListener('mouseUp', onMouseUp );
        
        scene = new THREE.Scene();
        scene.add(camera);
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

            obj.updateMatrixWorld(true);
            obj.updateMatrix();

            //Corrects the position of the connection points and initializes them
            for(var i = 0; i < connectionPoints.length; i++){
                var v = connectionPoints[i].position;
                v.sub(centerOfMass);
                connectionPoints[i].position = v;
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
        var newObj = new THREE.Object3D();
        var vec1 = obj1.position.clone();
        var vec2 = obj2.position.clone();
        vec2.add(vec1);
        vec2.multiplyScalar(0.5);
        newObj.position.copy(vec2);
        //LOCAL TO WORLD - gamla objektens position. WORLD TO LOCAL nya objektet.
        obj1.position.sub(newObj.position);
        obj2.position.sub(newObj.position);
        newObj.add(obj1);
        newObj.add(obj2);
        var newConnectionPoints = [];
        newConnectionPoints = newConnectionPoints.concat(obj1.connectionPoints, obj2.connectionPoints);
        newObj.connectionPoints = newConnectionPoints;
        selectObject(newObj);
        var index = objectCollection.indexOf(obj1);
        objectCollection.splice(index,1);
        index = objectCollection.indexOf(obj2);
        objectCollection.splice(index,1);
        objectCollection.push(newObj);
        scene.add(newObj);
    }
    function moveObjects(){
        for(var i = 0; i < movingObjects.length; i++){
            var interpolationSpeed = 0.07;
            movingObjects[i].position.lerp(movingObjects[i].userData.targetPosition,interpolationSpeed);
            movingObjects[i].quaternion.slerp(movingObjects[i].userData.targetRotation, interpolationSpeed);
            movingObjects[i].updateMatrix();
            movingObjects[i].updateMatrixWorld(true);
            
            if(movingObjects[i].position.distanceTo(movingObjects[i].userData.targetPosition) < 0.001){
                movingObjects[i].position.copy(movingObjects[i].userData.targetPosition);
                movingObjects[i].quaternion.copy(movingObjects[i].userData.targetRotation);
                movingObjects[i].updateMatrix();
                movingObjects[i].updateMatrixWorld(true);
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
                        if(distanceSquared < minDistSquared){
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
        selectedObject.userData.targetRotation = closestObject.quaternion.clone();

        connectionMarker = null;
        if(connectionPoint1.connectable && connectionPoint2.connectable){
            selectedObject.userData.targetRotation = closestObject.quaternion.clone();
            var oldRotation = selectedObject.rotation.clone();
            selectedObject.rotation.copy(closestObject.rotation);
            selectedObject.updateMatrix();
            selectedObject.updateMatrixWorld(true);
            var cp1Clone = connectionPoint1.position.clone();
            var cp2Clone = connectionPoint2.position.clone();
            connectionPoint1.connectable = false;
            connectionPoint2.connectable = false;
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