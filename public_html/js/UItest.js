/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


   $(document).ready(function(){
       $('#test').addClass('showtest').hide();
       
       
        $('.jointButton').on('click', function(){
            if(this.id === 'button_close'){
                playmola.cancelConnectObjects();
                $( "#jointPopup" ).popup('close');
            } else {
                 playmola.connectObjects();
                 $( "#jointPopup" ).popup('close');
            }
        });

        $('#jointClose').on('click', function(){
             playmola.cancelConnectObjects();
             $( "#jointPopup" ).popup('close');
        });
       
       
       var schematicMode = false;
       $('#button_schematic_mode').on('click', function(){
            if(schematicMode === false){
                playmola.enterSchematicMode();
                $('#button_schematic_mode').html('3D Mode');
                schematicMode = true;
            }
            else {
                playmola.exitSchematicMode();
                $('#button_schematic_mode').html('Schematic Mode');
                schematicMode = false;
            }
       });
       
   });