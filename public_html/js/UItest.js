/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


   $(document).ready(function(){
       $('#test').addClass('showtest').hide();
       
       
        $('.jointButton').on('click', function(){
            if(this.id === 'buttonNone'){
                playmola.connectObjects("none");
                $( "#jointPopup" ).popup('close');
            }
            else if(this.id === 'buttonRevolute'){
                playmola.connectObjects("Playmola.SimpleRevoluteJoint");
                $( "#jointPopup" ).popup('close');
            }
            else if(this.id === 'buttonPrismatic'){
                playmola.connectObjects("Playmola.SimplePrismaticJoint");
                $( "#jointPopup" ).popup('close');
            }
            else if(this.id === 'buttonRollingWheel'){
                playmola.connectObjects("VisualMultiBody.Joints.RollingWheel");
                $( "#jointPopup" ).popup('close');
            }
        });

        $('#jointClose').on('click', function(){
             playmola.cancelConnectObjects();
             $( "#jointPopup" ).popup('close');
        });
        
       
       var schematicMode = false;
       $('#button_schematic_mode').change(function(){
            if(schematicMode === false){
                playmola.enterSchematicMode();
                //$('#button_schematic_mode').html('3D Mode');
                schematicMode = true;
            }
            else {
                playmola.exitSchematicMode();
                //$('#button_schematic_mode').html('Exploded view');
                schematicMode = false;
            }
       });
       
       $('#detailsPanel').on('panelbeforeclose', function(){
           $('#parameters').empty();
       });
       
       $('#camX').val(playmola.getCamera().position.x);
       $('#camY').val(playmola.getCamera().position.y);
       $('#camZ').val(playmola.getCamera().position.z);
       
       $('#camX').on('input',function(){
           playmola.getCamera().position.set(parseFloat($('#camX').val()),parseFloat($('#camY').val()),parseFloat($('#camZ').val()));
       });
       $('#camY').on('input',function(){
           playmola.getCamera().position.set(parseFloat($('#camX').val()),parseFloat($('#camY').val()),parseFloat($('#camZ').val()));
       });
       $('#camZ').on('input',function(){
           playmola.getCamera().position.set(parseFloat($('#camX').val()),parseFloat($('#camY').val()),parseFloat($('#camZ').val()));
       });
       
   });