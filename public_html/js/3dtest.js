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
    loader.addEventListener("load", function (e) {
        var content = e.content;
        var obj = content.children[1];
        obj.children.forEach(function(child) {
            saveColor(child);
        });
        objectCollection.push(obj);
        scene.add(content);
    });
    
    function saveColor(object){
        if(object.hasOwnProperty('material'))
           object.initColor = object.material.color;
       object.children.forEach(function(child){
           saveColor(child);
       });
    }
    loader.load("Piston_Study.wrl");
    loader.load("Master_One_Cylinder.wrl");
    loader.load("Rod_Study.wrl");
    loader.load("Cranck_Study.wrl");
    
    function colorIn(children){
        for(var i = 0; i < children.length; i++){
            if(children[i].castShadow != null) 
                children[i].castShadow = true;
            children[i].receiveShadow = true;
            children[i].material = new THREE.MeshPhongMaterial({color: 0xFF0000});
            children[i].initColor = children[i].material.color;
            if(children[i].children != null)
                colorIn(children[i].children);
        }
    }
        
    var raycaster = new THREE.Raycaster();
    var mousePos = new THREE.Vector2(-1,-1);
    
//    var mouseDown = false;
//    
    function onMouseMove(event) {
	mousePos.x = ( event.clientX / window.innerWidth ) * 2 - 1
	mousePos.y = - ( event.clientY / window.innerHeight ) * 2 + 1	
    }
    
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('click', intersectionTest, false);
    
//    window.addEventListener('mousedown', function(){
//        mouseDown = true;
//    },false);
//    
//    window.addEventListener('mouseup', function(){
//        mouseDown = false;
//    }, false);
    
    
    var selectedObject = null;
    
    function intersectionTest(){
        raycaster.setFromCamera(mousePos, camera);
        var intersects = raycaster.intersectObjects(objectCollection, true);
        if(intersects.length > 0){
            if(selectedObject !== null)
                deselectObject();
            selectObject(intersects[0].object.parent);
        }
        else
            deselectObject();
    }
    
    function selectObject(object){
        selectedObject = object;
        object.children.forEach(function(child){
                child.material.color = new THREE.Color(0x669933);
            });
    }
    
    function generateArrows(){
        var origin = new THREE.Vector3(selectedObject);
    //    var dir = new THREE.Vector3( 1, 0, 0 );
    //    var origin = new THREE.Vector3( 0, 0, 0 );
    //    var length = 0.07;
    //    var hex = 0xffff00;
    //
    //    var arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
    //    objectCollection.push(arrowHelper.cone);
    //    scene.add( arrowHelper );
    }
    
    function deselectObject(){
        selectedObject.children.forEach(function(child){
            child.material.color = child.initColor;
        })
        selectedObject = null;
    }
    
    function logic() {
        requestAnimationFrame(render);
        controls.update();
    }
    
    function render(){
        renderer.render(scene,camera);
    }
    setInterval(logic, 1000/60);
})();