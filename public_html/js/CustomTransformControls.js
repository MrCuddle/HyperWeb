CustomTransformControls = function(camera, domElement, bounds){
    var self = this;
    
    var camera = camera;
    var target = null;
    var raycaster = new THREE.Raycaster();
    this.dragging = false;
    var domElement = domElement;
    
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
                self.dragging = true;
                event.stopImmediatePropagation();
            }

        }
    });
    
    $(domElement).on('mousemove', function(event){
        if(self.dragging){
   
            var oldPos = target.position.clone();
   
 	
            raycaster.setFromCamera(new THREE.Vector2(( event.clientX / domElement.getBoundingClientRect().width ) * 2 - 1, - ( event.clientY / domElement.getBoundingClientRect().height ) * 2 + 1), camera);
            var projPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0,0, -1).applyQuaternion(camera.quaternion),target.position);
            projPlane.intersectLine(new THREE.Line3(camera.position, camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(100.0))),target.position);
            
            
            
            var bbh = new THREE.BoundingBoxHelper(target, 0xffffff);
            bbh.update();
            if(!bounds.containsBox(bbh.box)){
                target.position.copy(oldPos);
            }

            
            
            
            
        }
    });
    
    $(domElement).on('mouseup', function(event){
        //Left mouse button
        if(event.button == 0 && self.dragging){
            self.dragging = false;
//            event.stopImmediatePropagation();
//            event.preventDefault();
        }
    });
    
    function init(){
        //perform initialization here
    }
    
    this.update = function(){
        
    };
    
    init();
}

CustomTransformControls.prototype.constructor = CustomTransformControls;