/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function TestTest(){
    var width = window.innerWidth;
    var height = window.innerHeight;
    var container = document.querySelector("#container");
    var renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setClearColor( 0xd3d3d3, 1 );
    renderer.setSize(width,height);
    renderer.autoClear = false;
    container.appendChild(renderer.domElement);
    
    var camera = new THREE.PerspectiveCamera(45,width/height,0.1,1000);
    camera.position.z = 0.5;
    camera.position.y = 0;
    camera.position.x = 0.2;
    
    var cameraControls = new THREE.TrackballControls( camera );

    cameraControls.rotateSpeed = 5.0;
    cameraControls.zoomSpeed = 1.2;
    cameraControls.panSpeed = 0.8;

    cameraControls.noZoom = false;
    cameraControls.noPan = false;

    cameraControls.staticMoving = true;
    cameraControls.dynamicDampingFactor = 0.3;

    cameraControls.keys = [ 65, 83, 68 ];

    //cameraControls.addEventListener( 'change', render );
    //cameraControls.addEventListener('objectChange', );
    
    transformControls = new THREE.TransformControls( camera, renderer.domElement );
    transformControls.addEventListener( 'objectChange', checkForConnections );
    transformControls.addEventListener('mouseUp', onMouseUp );
    
    function onMouseUp(){
        if(selectedObject && closestObject){
            
            mousePos.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            mousePos.y = - ( event.clientY / window.innerHeight ) * 2 + 1;	
            
            var mouseX = (mousePos.x + 1)/2 * window.innerWidth;
            var mouseY = -(mousePos.y - 1)/2 * window.innerHeight;
            
            $('#test').css('left', '' + mouseX + 'px').css('top', '' + mouseY + 'px').show();
            
            //ConnectObjects();
        }
    }
    
    this.ConnectObjects = function(){
        selectedObject.userData.targetRotation = closestObject.rotation.clone();
            
        foregroundScene.remove(connectionMarker);
        connectionMarker = null;
        var oldRotation = selectedObject.rotation.clone();
        selectedObject.rotation.set(closestObject.rotation.x,closestObject.rotation.y,closestObject.rotation.z );
        selectedObject.updateMatrix();
        selectedObject.updateMatrixWorld(true);


        var cp1Clone = connectionPoint1.clone();
        var cp2Clone = connectionPoint2.clone();
        cp1Clone = selectedObject.localToWorld(cp1Clone);
        cp2Clone = closestObject.localToWorld(cp2Clone);
        var displacement = new THREE.Vector3(cp2Clone.x, cp2Clone.y, cp2Clone.z).sub(cp1Clone);
        displacement = displacement.add(selectedObject.position);


        selectedObject.userData.targetPosition = displacement;

        selectedObject.rotation.set(oldRotation.x, oldRotation.y, oldRotation.z);

        //selectedObject.position.set(displacement.x,displacement.y,displacement.z);
        selectedObject.updateMatrix();
        selectedObject.updateMatrixWorld(true);


        objectsMoving[objectsMoving.length] = selectedObject;
    }
    
    var objectsMoving = [];
    
    function MoveObjects(){
        for(var i = 0; i < objectsMoving.length; i++){
            var currentPosition = objectsMoving[i].position.clone();
            currentPosition.lerp(objectsMoving[i].userData.targetPosition,0.07);
            objectsMoving[i].position.set(currentPosition.x, currentPosition.y, currentPosition.z);
            
            var currentRotation = objectsMoving[i].quaternion;
            var targetRotation = new THREE.Quaternion();
            targetRotation.setFromEuler(objectsMoving[i].userData.targetRotation);
            currentRotation.slerp(targetRotation,0.07);
            objectsMoving[i].rotation.setFromQuaternion(currentRotation);
            
            objectsMoving[i].updateMatrix();
            objectsMoving[i].updateMatrixWorld(true);
            
            if(objectsMoving[i].position.distanceTo(objectsMoving[i].userData.targetPosition) < 0.001){
                var pos = objectsMoving[i].userData.targetPosition;
                var rot = objectsMoving[i].userData.targetRotation;
                objectsMoving[i].position.set(pos.x,pos.y,pos.z);
                objectsMoving[i].rotation.set(rot.x,rot.y,rot.z);
                objectsMoving[i].updateMatrix();
                objectsMoving[i].updateMatrixWorld(true);
                objectsMoving.splice(i,1);
                i--;
            } 
        }
    }
    
    var scene = new THREE.Scene();
    scene.add(camera);
    scene.add(transformControls);
    var foregroundScene = new THREE.Scene();
    
    var directionalLight = new THREE.DirectionalLight();
    directionalLight.position.z = 100;
    directionalLight.position.x = 40;
    directionalLight.position.y = 100;
    directionalLight.castShadow = true;
    renderer.shadowMapEnabled = true;
    scene.add(directionalLight);
    
    directionalLight = new THREE.DirectionalLight();
    directionalLight.position.z = -100;
    directionalLight.position.x = -0;
    directionalLight.position.y = -100;
    directionalLight.castShadow = true;
    renderer.shadowMapEnabled = true;
    scene.add(directionalLight);
    
    scene.add(new THREE.AmbientLight(new THREE.Color(0.1,0.1,0.1)));
    
    function generateSphere(x,y,z){
        var geometry = new THREE.SphereGeometry(0.005, 10,10);
        var material = new THREE.MeshBasicMaterial( {color: 0xffffff} );
        var sphere = new THREE.Mesh( geometry, material );
        sphere.position.set(x,y,z);
        return sphere;
    }
    
    var objectCollection = [];
    
    var loader = new THREE.VRMLLoader();
    
    function loadModel(object, toCenterOfMass, connectionPoints){
        //Extract the part of the Object3D containing the meshes
        var obj = new THREE.Object3D();
        obj.translateX(toCenterOfMass.x);
        obj.translateY(toCenterOfMass.y);
        obj.translateZ(toCenterOfMass.z);
        obj.add(object.children[1]);
        obj.children[0].translateX(-toCenterOfMass.x);
        obj.children[0].translateY(-toCenterOfMass.y);
        obj.children[0].translateZ(-toCenterOfMass.z);
        obj.children.forEach(function(child) {
            saveColor(child);
        });
        obj.toCenterOfMass = toCenterOfMass;
        obj.connectionPoints = connectionPoints;
        var scaleFactor = 0.3;
        obj.position.set(scaleFactor*(Math.random()*2 - 1), scaleFactor*(Math.random()*2 - 1), scaleFactor*(Math.random()*2 - 1));
        obj.rotation.set(Math.random()*Math.PI*2, Math.random()*Math.PI*2, Math.random()*Math.PI*2);
        objectCollection.push(obj);
        scene.add(obj);
        
        obj.updateMatrixWorld(true);
        obj.updateMatrix();
        
        //Draw positions of the object's connection points and scale the vectors according to the object's scale
        for(var i = 0; i < connectionPoints.length; i++){
            var v = connectionPoints[i];
            v.sub(toCenterOfMass);
            //v.divideScalar(0.001);
            connectionPoints[i] = v;
//            v = obj.localToWorld(v);
//            generateSphere(v.x,v.y,v.z);
        }
    }
    
    function saveColor(object){
        if(object.hasOwnProperty('material'))
           object.initColor = object.material.color;
       object.children.forEach(function(child){
           saveColor(child);
       });
    }
    loader.load("Piston_Study.wrl", function(object){
        loadModel(object, new THREE.Vector3(0.,-0.15149054405043,0.), new Array(new THREE.Vector3(0.,-0.14420647088485,0.)));
    });
    loader.load("Master_One_Cylinder.wrl", function(object){
        loadModel(object, new THREE.Vector3(-4.5e-2,0.,0.), new Array(new THREE.Vector3(-4.5e-2,0.,0.)));
    });
    loader.load("Rod_Study.wrl", function(object){
        loadModel(object, new THREE.Vector3(0.,-8.9431700693962e-2,2.4489282256523e-2), new Array(new THREE.Vector3(0.,-3.465692988818e-2,4.8978561933508e-2), new THREE.Vector3(0.,-0.14420647088485,0.)));
    });
    loader.load("Cranck_Study.wrl", function(object){
        loadModel(object, new THREE.Vector3(-2.7054598934035e-2,-9.0702960410631e-3,1.2818607418443e-2), new Array(new THREE.Vector3(0.,-3.465692988818e-2,4.8978561933508e-2), new THREE.Vector3(-4.5e-2,0.,0.)));
    });
    
//    generateSphere(0.,0.,0.);
//    generateSphere(-4.5e-2,0.,0.);
//    generateSphere(0.,-3.465692988818e-2,4.8978561933508e-2);
//    generateSphere(0.,-0.14420647088485,0.);
//    generateSphere(0.,-0.16920647088485,0.);
        
    var raycaster = new THREE.Raycaster();
    var mousePos = new THREE.Vector2(-1,-1);
    
    function onMouseMove(event) {
	mousePos.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mousePos.y = - ( event.clientY / window.innerHeight ) * 2 + 1;	
    }
    
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('click', intersectionTest, false);
    
    var selectedObject = null;
    
    function intersectionTest(){
        raycaster.setFromCamera(mousePos, camera);
        var intersectionFound = false;
        for(var i = 0; i < objectCollection.length; ++i){
            var intersect = raycaster.intersectObject(objectCollection[i],true);
            if(intersect.length > 0){
                if(selectedObject !== null)
                    deselectObject();
                selectObject(objectCollection[i]);
                intersectionFound = true;
                break;
            }
        }
            if(!intersectionFound)
                deselectObject();
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
        //generateArrows();
    }
    
    var axisAssistant;
    
    function generateArrows(){
        var origin = new THREE.Vector3(
                selectedObject.toCenterOfMass.x,
                selectedObject.toCenterOfMass.y,
                selectedObject.toCenterOfMass.z);
        var dirX = new THREE.Vector3(1,0,0);
        var dirY = new THREE.Vector3(0,1,0);
        var dirZ = new THREE.Vector3(0,0,1);
        var length = 0.07;
        
        axisAssistant = new THREE.Object3D;
        
        var arrowHelperX = new THREE.ArrowHelper(dirX, origin, length, 0xff0000);
        arrowHelperX.userData.axis = "X";
        axisAssistant.add(arrowHelperX);
        
        var arrowHelperY = new THREE.ArrowHelper(dirY, origin, length, 0x00ff00);
        arrowHelperY.userData.axis = "Y";
        axisAssistant.add(arrowHelperY);
        
        var arrowHelperZ = new THREE.ArrowHelper(dirZ, origin, length, 0x0000FF);
        arrowHelperZ.userData.axis = "Z";
        axisAssistant.add(arrowHelperZ);
        foregroundScene.add(axisAssistant);
    }
    
    function deselectObject(){
        if(selectedObject)
        {
            selectedObject.traverse(function(child){
               if(child instanceof THREE.Mesh)
                   child.material.color = child.initColor;
            });
            transformControls.detach(selectedObject);
            selectedObject = null;
            foregroundScene.remove(axisAssistant);
            //axisAssistant = null;
        }
    }
    
    var closestObject;
    var connectionPoint1;
    var connectionPoint2;
    var connectionMarker;
            
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
                var connectionClone = selectedObject.connectionPoints[i].clone();
                selectedObject.localToWorld(connectionClone);
                var selectedObjScreenPos = connectionClone;
                selectedObjScreenPos = selectedObjScreenPos.project(camera);
                console.log("BEFORE:" + selectedObjScreenPos.x + ", " + selectedObjScreenPos.y);
            
                selectedObjScreenPos.x = ( selectedObjScreenPos.x * widthHalf ) + widthHalf;
                selectedObjScreenPos.y = - ( selectedObjScreenPos.y * heightHalf ) + heightHalf;
                console.log("AFTER:" + selectedObjScreenPos.x + ", " + selectedObjScreenPos.y);
                for(var j = 0; j < objectCollection.length; j++){
                    if(objectCollection[j] !== selectedObject){
                        for(var k = 0; k < objectCollection[j].connectionPoints.length; k++){
                            connectionClone = objectCollection[j].connectionPoints[k].clone();
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
                var connectionClone = connectionPoint2.clone();
                closestObject.localToWorld(connectionClone);
                connectionMarker = generateSphere(connectionClone.x,connectionClone.y,connectionClone.z);
                foregroundScene.add(connectionMarker);
            }
        }
    }
    
//            for(var i = 0; i < connectionPoints.length; i++){
//            var v = connectionPoints[i];
//            v.divideScalar(0.001);
//            connectionPoints[i] = v;
//            v = obj.localToWorld(v);
//            generateSphere(v.x,v.y,v.z);
//        }
    
    function logic() {
        MoveObjects();
        
        requestAnimationFrame(render);
        cameraControls.update();
        transformControls.update();
    }
    
    function render(){
        renderer.clear();
        renderer.render(scene,camera);
        renderer.clearDepth();
        renderer.render(foregroundScene, camera);
    }
    setInterval(logic, 1000/60);
}

var testTest = new TestTest();