
//camera: a THREE.Camera
//domElement: the element to register event listeners with
//bounds: a THREE.Box3 to constrain the camera's position to
//target: the position in the scene for the camera to look at
CustomCameraControls = function ( camera, domElement, bounds, target ) {

    var self = this;

    this.camera = camera;
    this.domElement = domElement;
    this.bounds = bounds;
    this.target = target;
    
    var dragging = false;
    
    var prevPos = new THREE.Vector2();
    var curPos = new THREE.Vector2();
    
    this.rotateSpeed = 0.005;
    this.zoomSpeed = 0.0013;
    
    function init(){
        camera.lookAt(target);
    }
    
    //Might not work for all browsers?
    this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
    
    $(domElement).on('vmousedown', function(event){
        if(event.originalEvent.originalEvent instanceof MouseEvent){
            if(event.originalEvent.button == 2){  
                event.stopImmediatePropagation();
                event.preventDefault();
            } else {
                return;
            }
        } 
        StartDrag(event);
    });
    
    $(domElement).on('vmousemove', function(event){
        if(dragging){
            curPos = new THREE.Vector2(event.screenX, event.screenY);
        }
    });
    
    $(domElement).on('vmouseup', function(event){
        if(event.originalEvent.originalEvent instanceof MouseEvent){
            if(event.originalEvent.button == 2 && dragging){
                event.stopImmediatePropagation();
                event.stopPropagation();
                event.preventDefault();
            } else {
                return;
            }
        }
        dragging = false;
    });
    
    
//    $(domElement).on('mousedown', function(event){
//        //Right mouse button
//        if(event.button == 2){  
//            event.stopImmediatePropagation();
//            event.preventDefault();
//            StartDrag(event);
//        }
//    });
    
//    $(domElement).on('mousemove', function(event){
//        if(dragging){
//            curPos = new THREE.Vector2(event.screenX, event.screenY);
//        }
//    });
//    
//    $(domElement).on('mouseup', function(event){
//        //Right mouse button
//        if(event.button == 2 && dragging){
//            dragging = false;
//            event.stopImmediatePropagation();
//            event.stopPropagation();
//            event.preventDefault();
//        }
//    });
    
    
    
    $(domElement).on('mousewheel', function(event){
        event.preventDefault();
       
        
        self.camera.position.sub(target);
        
        var l = self.camera.position.length();
        self.camera.position.normalize().multiplyScalar(l - event.deltaY * event.deltaFactor * self.zoomSpeed);
        
        self.camera.position.add(target);
        
        camera.position.clamp(self.bounds.min, self.bounds.max);
        
    });
    
    function StartDrag(event){
        dragging = true;
        prevPos = new THREE.Vector2(event.screenX, event.screenY);
        curPos = new THREE.Vector2(event.screenX, event.screenY);
    }

    this.update = function(){
        
        if(dragging){
            
            self.camera.position.sub(target);

            self.camera.position.applyAxisAngle(camera.position.clone().normalize().cross(new THREE.Vector3(0,1,0)), (curPos.y - prevPos.y)*self.rotateSpeed);
            self.camera.position.applyAxisAngle(new THREE.Vector3(0,-1,0), (curPos.x - prevPos.x)*self.rotateSpeed);
            
            self.camera.position.add(target);
             
        }
        

        camera.position.clamp(self.bounds.min, self.bounds.max);
        
        camera.lookAt(target);
        prevPos.copy(curPos);
    }

    init();
    
};

CustomCameraControls.prototype.constructor = CustomCameraControls;

