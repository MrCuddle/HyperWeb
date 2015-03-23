CustomTransformControls = function(camera, domElement, bounds){
    var self = this;
    
    var camera = camera;
    var target = null;
    var raycaster = new THREE.Raycaster();
    this.dragging = false;
    var domElement = domElement;
    var newPos = new THREE.Vector3();
    var lookAt = new THREE.Vector3();
    var projPlane = new THREE.Plane();
    var moved = false;
    
    this.attach = function(object){
        target = object; 
    }
    
    this.detach = function(){
        target = null;
    }
    
    $(domElement).on('mousedown', function(event){
        //Left mouse button
        if(event.button == 0 && target !== null){
            //Check if the target was clicked...
            var pointer = new THREE.Vector2(( event.clientX / domElement.getBoundingClientRect().width ) * 2 - 1, - ( event.clientY / domElement.getBoundingClientRect().height ) * 2 + 1);	
            
            raycaster.setFromCamera(pointer, camera);

            var intersect = raycaster.intersectObject(target,true);
            if(intersect.length > 0){
                //object was clicked
                
                
                lookAt = new THREE.Vector3(0,0, -1).applyQuaternion(camera.quaternion);
                raycaster.setFromCamera(new THREE.Vector2(( event.clientX / domElement.getBoundingClientRect().width ) * 2 - 1, - ( event.clientY / domElement.getBoundingClientRect().height ) * 2 + 1), camera);
                projPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(lookAt,target.position);
                projPlane.intersectLine(new THREE.Line3(camera.position, camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(100.0))),newPos);
            
                self.dragging = true;
                //event.stopImmediatePropagation();
            }

        }
    });
    
    $(domElement).on('mousemove', function(event){
        if(self.dragging){
            moved = true;
            lookAt = new THREE.Vector3(0,0, -1).applyQuaternion(camera.quaternion);
            raycaster.setFromCamera(new THREE.Vector2(( event.clientX / domElement.getBoundingClientRect().width ) * 2 - 1, - ( event.clientY / domElement.getBoundingClientRect().height ) * 2 + 1), camera);
            projPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(lookAt,target.position);
            projPlane.intersectLine(new THREE.Line3(camera.position, camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(100.0))),newPos);
               
        }
    });
    
    $(domElement).on('mouseup', function(event){
        //Left mouse button
        if(event.button == 0 && self.dragging){
            self.dragging = false;
            moved = false;
//            event.stopImmediatePropagation();
//            event.preventDefault();
        }
    });
    
    function init(){
        //perform initialization here
    }
    
    this.update = function(){
        if(self.dragging && moved){
            target.position.copy(newPos);
            
            //Clamp target within bounds
            var bbh = new THREE.BoundingBoxHelper(target, 0xffffff);
            bbh.update();
            while(!bounds.containsBox(bbh.box)){
                //target.position.copy(oldPos);
                //var intersection = bbh.box.clone().intersect(bounds);
                if(bbh.box.max.x > bounds.max.x){
                    var v = new THREE.Vector3(-bbh.box.max.x + bounds.max.x,0, 0);
                    v.projectOnPlane(lookAt);
                    v.multiplyScalar((-bbh.box.max.x + bounds.max.x)/v.x);
                    target.position.add(v);
                }
                if(bbh.box.min.x < bounds.min.x){
                    var v = new THREE.Vector3(bounds.min.x - bbh.box.min.x,0, 0);
                    v.projectOnPlane(lookAt);
                    v.multiplyScalar((bounds.min.x - bbh.box.min.x)/v.x);
                    target.position.add(v);
                }
                if(bbh.box.max.z > bounds.max.z){
                    var v = new THREE.Vector3(0,0, -bbh.box.max.z + bounds.max.z);
                    v.projectOnPlane(lookAt);
                    v.multiplyScalar((-bbh.box.max.z + bounds.max.z)/v.z);
                    target.position.add(v);
                }
                if(bbh.box.min.z < bounds.min.z){
                    var v = new THREE.Vector3(0,0, bounds.min.z - bbh.box.min.z);
                    v.projectOnPlane(lookAt);
                    v.multiplyScalar((bounds.min.z - bbh.box.min.z)/v.z);
                    target.position.add(v);
                }
                if(bbh.box.max.y > bounds.max.y){
                    var v = new THREE.Vector3(0,-bbh.box.max.y + bounds.max.y, 0);
                    v.projectOnPlane(lookAt);
                    v.multiplyScalar((-bbh.box.max.y + bounds.max.y)/v.y);
                    target.position.add(v);
                }
                if(bbh.box.min.y < bounds.min.y){
                    var v = new THREE.Vector3(0,bounds.min.y - bbh.box.min.y, 0);
                    v.projectOnPlane(lookAt);
                    v.multiplyScalar((bounds.min.y - bbh.box.min.y)/v.y);
                    target.position.add(v);
                }
                bbh.update();
            }
        }
    };
    
    init();
}

CustomTransformControls.prototype.constructor = CustomTransformControls;