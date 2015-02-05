/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

(function (){
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
    
    controls = new THREE.TrackballControls( camera );

    controls.rotateSpeed = 5.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;

    controls.keys = [ 65, 83, 68 ];

    controls.addEventListener( 'change', render );
    
    var scene = new THREE.Scene();
    scene.add(camera);
    var foregroundScene = new THREE.Scene();
    
    var directionalLight = new THREE.DirectionalLight();
    directionalLight.position.z = 100;
    directionalLight.position.x = 40;
    directionalLight.position.y = 100;
    directionalLight.castShadow = true;
    renderer.shadowMapEnabled = true;
    scene.add(directionalLight);
    scene.add(new THREE.AmbientLight(new THREE.Color(0.05,0.02,0.1)));
    
    function GenerateSphere(x,y,z){
        var geometry = new THREE.SphereGeometry(0.025, 10,10);
        var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
        var sphere = new THREE.Mesh( geometry, material );
        scene.add( sphere );
        sphere.position.set(x,y,z);
    }
    
    var objectCollection = [];
    
    var loader = new THREE.VRMLLoader();
    
    function loadModel(object, toCenterOfMass){
        var obj = object.children[1];
        obj.children.forEach(function(child) {
            saveColor(child);
        });
        obj.toCenterOfMass = toCenterOfMass;
        objectCollection.push(obj);
        scene.add(obj);
    }
    
    function saveColor(object){
        if(object.hasOwnProperty('material'))
           object.initColor = object.material.color;
       object.children.forEach(function(child){
           saveColor(child);
       });
    }
    loader.load("Piston_Study.wrl", function(object){
        loadModel(object, new THREE.Vector3(0.,-0.15149054405043,0.));
    });
    loader.load("Master_One_Cylinder.wrl", function(object){
        loadModel(object, new THREE.Vector3(-4.5e-2,0.,0.));
    });
    loader.load("Rod_Study.wrl", function(object){
        loadModel(object, new THREE.Vector3(0.,-8.9431700693962e-2,2.4489282256523e-2));
    });
    loader.load("Cranck_Study.wrl", function(object){
        loadModel(object, new THREE.Vector3(-2.7054598934035e-2,-9.0702960410631e-3,1.2818607418443e-2));
    });
        
    var raycaster = new THREE.Raycaster();
    var mousePos = new THREE.Vector2(-1,-1);
    
    function onMouseMove(event) {
	mousePos.x = ( event.clientX / window.innerWidth ) * 2 - 1
	mousePos.y = - ( event.clientY / window.innerHeight ) * 2 + 1	
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
        selectedObject.traverse(function(child){
            if(child instanceof THREE.Mesh)
                 child.material.color = new THREE.Color(0xB0E2FF);
        });
        generateArrows();
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
        if(selectedObject !== null)
        {
            selectedObject.traverse(function(child){
               if(child instanceof THREE.Mesh)
                   child.material.color = child.initColor;
            });
            selectedObject = null;
            foregroundScene.remove(axisAssistant);
            axisAssistant = null;
        }
    }
    
    function logic() {
        requestAnimationFrame(render);
        controls.update();
    }
    
    function render(){
        renderer.clear();
        renderer.render(scene,camera);
        renderer.clearDepth();
        renderer.render(foregroundScene, camera);
    }
    setInterval(logic, 1000/60);
})();